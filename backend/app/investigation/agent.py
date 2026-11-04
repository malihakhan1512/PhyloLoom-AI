import json
import re

from pydantic import BaseModel, Field

from .provenance import canonical_sha256, utc_now_iso

PROMPT_VERSION = "phyloloom.hypothesis-agent/1.0.0"


class EvidenceFinding(BaseModel):
    id: str
    classification: str
    summary: str
    caveats: list[str] = Field(default_factory=list)


class EvidenceBundle(BaseModel):
    findings: list[EvidenceFinding]
    context: str = ""


class CitedItem(BaseModel):
    text: str
    citation_ids: list[str] = Field(default_factory=list)


class AgentOutput(BaseModel):
    observations: list[CitedItem] = Field(default_factory=list)
    hypotheses: list[CitedItem] = Field(default_factory=list)
    alternatives: list[str] = Field(default_factory=list)
    proposed_tests: list[str] = Field(default_factory=list)
    missing_evidence: list[str] = Field(default_factory=list)
    citations: list[str] = Field(default_factory=list)
    summary: str = ""


def build_agent_prompt(bundle: EvidenceBundle) -> str:
    findings = "\n".join(
        f"- id={f.id} [{f.classification}] {f.summary} caveats={'; '.join(f.caveats) or 'none'}"
        for f in bundle.findings
    )
    return f"""You are PhyloLoom's Scientific Hypothesis Generator.

Rules:
- Use ONLY the evidence findings below. Do not invent values, records, or findings.
- Every observation and hypothesis MUST cite at least one evidence id from the list, using the exact id string.
- Hypotheses are untested suggestions for falsifiable tests — never findings, never clinical claims.
- Never claim pathogenic, benign, adaptive, or positively selected.
- If evidence is missing, list it under missing_evidence.
- Return ONLY a JSON object (no markdown, no commentary) with exactly these keys:
  observations: [{{"text": string, "citation_ids": [string]}}],
  hypotheses: [{{"text": string, "citation_ids": [string]}}],
  alternatives: [string],
  proposed_tests: [string],
  missing_evidence: [string],
  citations: [string],
  summary: string

Evidence findings:
{findings}

Additional context: {bundle.context or "none"}
"""


def parse_agent_json(text: str) -> dict:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Model output contained no JSON object.")
    return json.loads(cleaned[start : end + 1])


def validate_agent_output(parsed: dict, bundle: EvidenceBundle) -> dict:
    valid_ids = {f.id for f in bundle.findings}
    output = AgentOutput(**parsed)

    kept_observations, kept_hypotheses, uncited = [], [], []

    for item in output.observations:
        valid = [c for c in item.citation_ids if c in valid_ids]
        if valid:
            kept_observations.append({"text": item.text, "citation_ids": valid})
        else:
            uncited.append({"text": item.text, "reason": "observation without a valid evidence citation"})

    for item in output.hypotheses:
        valid = [c for c in item.citation_ids if c in valid_ids]
        if valid:
            kept_hypotheses.append({"text": item.text, "citation_ids": valid})
        else:
            uncited.append({"text": item.text, "reason": "hypothesis without a valid evidence citation"})

    valid_citations = sorted({
        c for item in kept_observations + kept_hypotheses for c in item["citation_ids"]
    } & valid_ids)

    return {
        "output": {
            "observations": kept_observations,
            "hypotheses": kept_hypotheses,
            "alternatives": output.alternatives,
            "proposed_tests": output.proposed_tests,
            "missing_evidence": output.missing_evidence,
            "citations": valid_citations,
            "summary": output.summary,
        },
        "uncited_suggestions": uncited,
        "valid_evidence_ids": sorted(valid_ids),
    }


def run_hypothesis_agent(bundle: EvidenceBundle, provider) -> dict:
    """Provider must expose propose_hypotheses_json(bundle_dict) -> {text, usage}."""
    generated_at = utc_now_iso()

    if not bundle.findings:
        return {
            "status": "unavailable",
            "reason": "EvidenceBundle contains no findings. The agent will not generate hypotheses without citable evidence.",
            "classification": "HYPOTHESIS",
            "prompt_version": PROMPT_VERSION,
            "generated_at": generated_at,
        }

    if not hasattr(provider, "propose_hypotheses_json"):
        return {
            "status": "unavailable",
            "reason": "Configured AI provider does not support hypothesis proposals. Template Hypothesis Board remains available.",
            "classification": "HYPOTHESIS",
            "provider": getattr(provider, "name", "unknown"),
            "is_mock": bool(getattr(provider, "is_mock", True)),
            "prompt_version": PROMPT_VERSION,
            "generated_at": generated_at,
        }

    raw = provider.propose_hypotheses_json(bundle.model_dump(mode="json"))
    raw_text = raw.get("text", "")
    response_hash = canonical_sha256(raw_text)

    try:
        parsed = parse_agent_json(raw_text)
        validated = validate_agent_output(parsed, bundle)
    except Exception as e:
        return {
            "status": "invalid_output",
            "reason": f"Model output failed validation: {type(e).__name__}. Raw output was discarded, not displayed as findings.",
            "classification": "HYPOTHESIS",
            "provider": getattr(provider, "name", "unknown"),
            "is_mock": bool(getattr(provider, "is_mock", True)),
            "model": raw.get("model"),
            "prompt_version": PROMPT_VERSION,
            "response_sha256": response_hash,
            "token_usage": raw.get("usage"),
            "generated_at": generated_at,
        }

    return {
        "status": "mock" if getattr(provider, "is_mock", False) else "generated",
        "classification": "HYPOTHESIS",
        "provider": getattr(provider, "name", "unknown"),
        "is_mock": bool(getattr(provider, "is_mock", True)),
        "model": raw.get("model"),
        "prompt_version": PROMPT_VERSION,
        "response_sha256": response_hash,
        "token_usage": raw.get("usage"),
        "generated_at": generated_at,
        **validated,
        "note": "AI-generated hypotheses are untested. Only items citing valid evidence IDs are shown as evidence-linked; everything else is demoted to uncited suggestions.",
    }