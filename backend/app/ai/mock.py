from .base import AIProvider
class MockAIProvider(AIProvider):
    name = "mock"
    is_mock = True
    def explain_analysis(self, results: dict, question: str) -> dict:
        return {"provider": self.name, "is_mock": True,
                "text": "[MOCK - not a real AI or biological finding] Interface test only. Computed result keys: " + ", ".join(sorted(results.keys()))}
