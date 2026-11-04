import json
from .base import AIProvider


class MockAIProvider(AIProvider):
    name = "mock"
    is_mock = True

    def explain_analysis(self, results: dict, question: str) -> dict:
        return {"provider": self.name, "is_mock": True,
                "text": "[MOCK - not a real AI or biological finding] Interface test only. Computed result keys: " + ", ".join(sorted(results.keys()))}

    def propose_hypotheses_json(self, bundle: dict) -> dict:
        findings = bundle.get("findings", [])
        first_id = findings[0]["id"] if findings else ""
        payload = {
            "observations": [
                {"text": "[MOCK] Mock observation referencing the first supplied finding only.", "citation_ids": [first_id] if first_id else []}
            ],
            "hypotheses": [
                {"text": "[MOCK] Mock hypothesis: the cited computed finding may warrant a pre-stated follow-up test.", "citation_ids": [first_id] if first_id else []}
            ],
            "alternatives": ["[MOCK] Alternative explanations must be evaluated before any test."],
            "proposed_tests": ["[MOCK] No real test proposed by the mock provider."],
            "missing_evidence": ["Real Meta provider output (mock active)"],
            "citations": [first_id] if first_id else [],
            "summary": "[MOCK] Development placeholder only — not an AI-generated scientific interpretation.",
        }
        return {"text": json.dumps(payload), "model": None, "usage": None}