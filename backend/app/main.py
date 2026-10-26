from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .core.fasta import parse_fasta, detect_and_validate, SequenceError
from .core.stats import nucleotide_stats, protein_stats
from .core.align import pairwise_variants
from .core.phylo import distance_matrix_and_tree
from .ai.mock import MockAIProvider

app = FastAPI(title="PhyloLoom AI", version="0.1.0")
ai = MockAIProvider()

class AnalyzeIn(BaseModel):
    fasta_text: str

class ExplainIn(BaseModel):
    results: dict
    question: str = ""

@app.get("/health")
def health():
    return {"status": "ok", "ai_provider": "mock", "version": "0.1.0"}

@app.post("/api/analyze")
def analyze(body: AnalyzeIn):
    try:
        records = parse_fasta(body.fasta_text)
    except SequenceError as e:
        raise HTTPException(422, str(e))
    out = []
    for r in records:
        v = detect_and_validate(r["sequence"])
        if v["type"] == "unknown":
            raise HTTPException(422, f"{r['id']}: invalid characters {v['invalid']}")
        stats = nucleotide_stats(r["sequence"]) if v["type"] == "nucleotide" else protein_stats(r["sequence"])
        out.append({**r, "validation": v, "stats": stats, "provenance": "computed_live"})
    result = {"sequences": out, "disclaimer": "Research support only, not clinical diagnosis."}
    if len(records) == 2:
        result["comparison"] = pairwise_variants(records[0]["sequence"], records[1]["sequence"])
    if len(records) >= 3:
        result["phylogeny"] = distance_matrix_and_tree(records)
    return result

@app.post("/api/explain")
def explain(body: ExplainIn):
    return ai.explain_analysis(body.results, body.question)
