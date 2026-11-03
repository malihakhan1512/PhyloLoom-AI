import pytest

from app.ai.meta import MetaAIProvider, NotConfiguredError, _sanitize
from app import main


class FakeResponse:
    def __init__(self, output_text):
        self.output_text = output_text


class FakeResponses:
    def __init__(self, output_text="Test explanation"):
        self.output_text = output_text
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return FakeResponse(self.output_text)


class FakeClient:
    def __init__(self, output_text="Test explanation"):
        self.responses = FakeResponses(output_text)


class FailingProvider:
    name = "meta"
    is_mock = False
    model_id = "muse-spark-1.3"

    def explain_analysis(self, results: dict, question: str) -> dict:
        raise RuntimeError("Simulated Meta API failure")


def test_missing_key_prevents_meta_provider(monkeypatch):
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    monkeypatch.delenv("META_API_KEY", raising=False)

    with pytest.raises(NotConfiguredError):
        MetaAIProvider(client=FakeClient())


def test_sanitize_removes_raw_sequence_fields():
    results = {
        "sequence": "ACGTACGTACGT",
        "sequences_count": 2,
        "nested": {
            "raw_sequence": "MSTNPKPQRK",
            "identity_percent": 95.0,
        },
    }

    sanitized = _sanitize(results)

    assert "sequence" not in sanitized
    assert "raw_sequence" not in sanitized["nested"]
    assert sanitized["sequences_count"] == 2
    assert sanitized["nested"]["identity_percent"] == 95.0


def test_meta_provider_success_is_labelled_meta(monkeypatch):
    monkeypatch.setenv("MODEL_API_KEY", "test-key-not-real")
    monkeypatch.setenv("META_MODEL_ID", "muse-spark-1.3")

    provider = MetaAIProvider(client=FakeClient("Real test explanation"))
    result = provider.explain_analysis(
        {"sequences_count": 2, "comparison": {"identity_percent": 95.0}},
        "Explain briefly",
    )

    assert result["provider"] == "meta"
    assert result["is_mock"] is False
    assert result["model"] == "muse-spark-1.3"
    assert result["text"] == "Real test explanation"


def test_meta_provider_rejects_empty_response(monkeypatch):
    monkeypatch.setenv("MODEL_API_KEY", "test-key-not-real")

    provider = MetaAIProvider(client=FakeClient(""))

    with pytest.raises(RuntimeError, match="empty output"):
        provider.explain_analysis(
            {"sequences_count": 2},
            "Explain briefly",
        )


def test_explain_endpoint_falls_back_to_labelled_mock(monkeypatch):
    from fastapi.testclient import TestClient

    monkeypatch.setattr(main, "ai", FailingProvider())

    client = TestClient(main.app)
    response = client.post(
        "/api/explain",
        json={
            "results": {"sequences_count": 2},
            "question": "Explain briefly",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["provider"] == "mock"
    assert data["is_mock"] is True
    assert "fallback_reason" in data
    assert "Simulated Meta API failure" in data["fallback_reason"]