import json

from app.investigation.agent import (
    EvidenceBundle, EvidenceFinding, parse_agent_json,
    run_hypothesis_agent, validate_agent_output,
)


def _bundle():
    return EvidenceBundle(findings=[
        EvidenceFinding(id="evidence:descriptor:E6V", classification="COMPUTED",
                        summary="E->V hydropathy delta +7.7, charge delta +1 at pH 7.0"),
        EvidenceFinding(id="evidence:conservation:pos6", classification="COMPUTED",
                        summary="Alignment column entropy unavailable in this fixture"),
    ])


class FakeMetaProvider:
    name = "meta"
    is_mock = False

    def propose_hypotheses_json(self, bundle):
        return {
            "text": json.dumps({
                "observations": [{"text": "Hydropathy increased.", "citation_ids": ["evidence:descriptor:E6V"]}],
                "hypotheses": [{"text": "Local context may change.", "citation_ids": ["evidence:descriptor:E6V"]}],
                "alternatives": ["Numbering mismatch"],
                "proposed_tests": ["Map residue to a labelled structure"],
                "missing_evidence": ["Structure mapping"],
                "citations": ["evidence:descriptor:E6V"],
                "summary": "One cited hypothesis.",
            }),
            "model": "muse-spark-1.3",
            "usage": {"total_tokens": 42},
        }


class FakeBadCitationProvider(FakeMetaProvider):
    def propose_hypotheses_json(self, bundle):
        return {
            "text": json.dumps({
                "observations": [{"text": "Invented fact.", "citation_ids": ["evidence:fake"]}],
                "hypotheses": [{"text": "Uncited idea.", "citation_ids": []}],
                "alternatives": [], "proposed_tests": [], "missing_evidence": [],
                "citations": ["evidence:fake"], "summary": "Bad citations.",
            }),
            "model": "muse-spark-1.3", "usage": None,
        }


class FakeGarbageProvider(FakeMetaProvider):
    def propose_hypotheses_json(self, bundle):
        return {"text": "not json at all", "model": "muse-spark-1.3", "usage": None}


def test_parse_agent_json_strips_code_fences():
    parsed = parse_agent_json('```json\n{"summary": "x"}\n```')
    assert parsed["summary"] == "x"


def test_valid_output_keeps_cited_items():
    result = run_hypothesis_agent(_bundle(), FakeMetaProvider())
    assert result["status"] == "generated"
    assert result["output"]["observations"][0]["citation_ids"] == ["evidence:descriptor:E6V"]
    assert result["response_sha256"]
    assert result["token_usage"] == {"total_tokens": 42}


def test_bad_citations_are_demoted_not_displayed_as_evidence():
    result = run_hypothesis_agent(_bundle(), FakeBadCitationProvider())
    assert result["output"]["observations"] == []
    assert result["output"]["hypotheses"] == []
    assert len(result["uncited_suggestions"]) == 2
    assert result["output"]["citations"] == []


def test_garbage_output_is_invalid_not_displayed():
    result = run_hypothesis_agent(_bundle(), FakeGarbageProvider())
    assert result["status"] == "invalid_output"
    assert "output" not in result


def test_empty_bundle_is_unavailable():
    result = run_hypothesis_agent(EvidenceBundle(findings=[]), FakeMetaProvider())
    assert result["status"] == "unavailable"


def test_agent_endpoint_with_mock_is_labelled():
    from fastapi.testclient import TestClient
    from app import main

    client = TestClient(main.app)
    response = client.post("/api/investigation/agent/hypotheses", json={
        "bundle": {"findings": [{"id": "evidence:x", "classification": "COMPUTED", "summary": "s"}]}
    })
    assert response.status_code == 200
    data = response.json()
    # Whatever provider is configured in the test env, status must be honest:
    assert data["status"] in {"mock", "generated", "invalid_output", "unavailable"}
    if data["status"] == "mock":
        assert data["is_mock"] is True