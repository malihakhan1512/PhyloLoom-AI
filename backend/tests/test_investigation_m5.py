import pytest

from app.investigation.hypothesis import build_hypothesis_cards


DELTA = {
    "hydropathy_kd": 7.7,
    "polarity_grantham": -6.4,
    "volume_a3": 1.6,
    "charge_ph7": 1,
}


def test_hypothesis_cards_require_citations():
    with pytest.raises(ValueError):
        build_hypothesis_cards(
            variant_label="E6V",
            delta=DELTA,
            citation_ids=[],
        )


def test_hypothesis_cards_are_labelled_hypotheses():
    cards = build_hypothesis_cards(
        variant_label="E6V",
        delta=DELTA,
        citation_ids=["evidence:descriptor:E6V"],
    )

    assert len(cards) == 2
    for card in cards:
        assert card["classification"] == "HYPOTHESIS"
        assert card["status"] == "untested"
        assert card["citation_ids"] == ["evidence:descriptor:E6V"]


def test_hypothesis_cards_include_alternatives_tests_and_falsifiers():
    cards = build_hypothesis_cards(
        variant_label="E6V",
        delta=DELTA,
        citation_ids=["evidence:descriptor:E6V"],
    )

    for card in cards:
        assert card["alternatives"]
        assert card["falsifier"]
        assert card["proposed_test"]["null_hypothesis"]
        assert card["proposed_test"]["alternative_hypothesis"]
        assert card["proposed_test"]["falsification_criteria"]
        assert card["missing_evidence"]


def test_hypothesis_cards_do_not_make_clinical_claims():
    cards = build_hypothesis_cards(
        variant_label="E6V",
        delta=DELTA,
        citation_ids=["evidence:descriptor:E6V"],
    )

    combined = " ".join(
        card["hypothesis"] + " " + card["observation"]
        for card in cards
    ).lower()

    assert "pathogenic" not in combined
    assert "benign" not in combined
    assert "causes disease" not in combined
    assert "positive selection" not in combined


def test_hypotheses_endpoint_returns_cards():
    from fastapi.testclient import TestClient
    from app import main

    client = TestClient(main.app)
    response = client.post(
        "/api/investigation/hypotheses",
        json={
            "variant_label": "E2V",
            "descriptor_delta": {"delta": DELTA},
            "citation_ids": ["evidence:live:descriptor"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["classification"] == "HYPOTHESIS"
    assert data["status"] == "untested"
    assert len(data["cards"]) == 2


def test_demo_hypotheses_endpoint_returns_cards():
    from fastapi.testclient import TestClient
    from app import main

    client = TestClient(main.app)
    response = client.get("/api/investigation/demo/hbb/hypotheses")

    assert response.status_code == 200
    data = response.json()
    assert data["demo"] is True
    assert len(data["cards"]) == 2