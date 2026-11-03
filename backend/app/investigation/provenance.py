import hashlib
import json
from datetime import datetime, timezone


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical_sha256(obj) -> str:
    payload = json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def artifact_record(
    *,
    artifact_type: str,
    input_obj,
    output_obj,
    method: str,
    parameters: dict,
    source: str,
    evidence_classification: str,
    coordinate_system: str | None = None,
    warnings: list[str] | None = None,
) -> dict:
    return {
        "artifact_type": artifact_type,
        "input_sha256": canonical_sha256(input_obj),
        "output_sha256": canonical_sha256(output_obj),
        "method": method,
        "parameters": parameters,
        "source": source,
        "evidence_classification": evidence_classification,
        "coordinate_system": coordinate_system,
        "warnings": warnings or [],
        "created_at": utc_now_iso(),
        "status": "computed",
    }