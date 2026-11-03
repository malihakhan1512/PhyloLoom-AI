import json
import os
from openai import OpenAI
from .base import AIProvider


class NotConfiguredError(RuntimeError):
    pass


# Never send raw sequences to the external API.
_BLOCKED_KEYS = {"sequence", "sequences_raw", "fasta_text", "raw_sequence"}


def _sanitize(obj, depth=0):
    if depth > 6:
        return "..."
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k.lower() in _BLOCKED_KEYS:
                # Keep count/id only if present elsewhere; drop raw sequence text
                continue
            out[k] = _sanitize(v, depth + 1)
        return out
    if isinstance(obj, list):
        return [_sanitize(x, depth + 1) for x in obj[:50]]
    if isinstance(obj, str) and len(obj) > 500:
        return obj[:500] + "...[truncated]"
    return obj


class MetaAIProvider(AIProvider):
    name = "meta"
    is_mock = False

    def __init__(self, client=None):
        self.api_key = os.getenv("MODEL_API_KEY") or os.getenv("META_API_KEY")
        self.base_url = os.getenv("META_API_BASE") or "https://api.meta.ai/v1"
        self.model_id = os.getenv("META_MODEL_ID") or "muse-spark-1.3"
        if not self.api_key:
            raise NotConfiguredError(
                "Meta API not configured: set MODEL_API_KEY (server-side only)."
            )
        self.client = client or OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
            timeout=30.0,
            max_retries=1,
        )

    def explain_analysis(self, results: dict, question: str) -> dict:
        safe_results = _sanitize(results)
        payload = json.dumps(safe_results, indent=2)[:8000]

        prompt = f"""You are PhyloLoom's AI Research Copilot.

Explain ONLY the computed results below. Do not invent biological findings,
do not provide clinical diagnosis, and state limitations clearly.
If a value is not in the results, say it was not computed.

Computed results (structured data only, no raw sequences):
{payload}

User question:
{question or "Explain these results in plain language."}
"""

        response = self.client.responses.create(
            model=self.model_id,
            input=prompt,
        )
        text = (response.output_text or "").strip()
        if not text:
            raise RuntimeError("Meta API returned empty output")

        return {
            "provider": self.name,
            "is_mock": False,
            "model": self.model_id,
            "text": text,
        }