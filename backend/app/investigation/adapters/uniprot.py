import json
import urllib.request
import urllib.error


class SourceUnavailable(RuntimeError):
    pass


def fetch_uniprot_record(accession: str, timeout: float = 15.0) -> dict:
    accession = accession.strip()
    if not accession or not accession.replace("_", "").isalnum():
        raise ValueError("Invalid UniProt accession format.")

    url = f"https://rest.uniprot.org/uniprotkb/{accession}?format=json"
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "PhyloLoomAI/0.1"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as e:
        raise SourceUnavailable(f"UniProt unavailable for {accession}: {type(e).__name__}") from e

    sequence = payload.get("sequence", {}).get("value")
    if not sequence:
        raise SourceUnavailable(f"UniProt record {accession} returned no sequence.")

    return {
        "accession": payload.get("primaryAccession", accession),
        "id": payload.get("uniProtkbId"),
        "sequence": sequence,
        "length": payload.get("sequence", {}).get("length", len(sequence)),
        "source": "UniProtKB REST API",
        "source_url": url,
        "classification": "CURATED_ASSERTION",
        "status": "available",
    }