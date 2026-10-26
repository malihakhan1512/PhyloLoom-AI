import os
from .base import AIProvider
class NotConfiguredError(RuntimeError):
    pass
class MetaAIProvider(AIProvider):
    name = "meta"
    is_mock = False
    def __init__(self):
        if not os.getenv("META_API_KEY") or not os.getenv("META_MODEL_ID") or not os.getenv("META_API_BASE"):
            raise NotConfiguredError("Meta API not configured. Verify official hackathon docs for endpoint/model/auth, then set META_API_KEY, META_API_BASE, META_MODEL_ID.")
    def explain_analysis(self, results: dict, question: str) -> dict:
        raise NotConfiguredError("Meta provider is a placeholder until credentials and official API schema are verified. Do not fabricate endpoint/model.")
