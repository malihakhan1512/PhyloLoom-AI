import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .core.fasta import parse_fasta, detect_and_validate, SequenceError
from .core.stats import nucleotide_stats, protein_stats
from .core.align import pairwise_variants
from .core.phylo import distance_matrix_and_tree
from .ai.mock import MockAIProvider
from .ai.meta import MetaAIProvider
from .investigation.demo import build_hbb_demo_graph
from .investigation.graph import validate_graph
from .investigation.descriptors import descriptor_delta

app = FastAPI(title="PhyloLoom AI", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])
def _make_provider():
    if (os.getenv("AI_PROVIDER") or "mock").lower() == "meta":
        try:
            return MetaAIProvider()
        except Exception as e:
            print(f"[PhyloLoom] Meta provider unavailable, falling back to MOCK: {e}")
            return MockAIProvider()
    return MockAIProvider()

ai = _make_provider()

class AnalyzeIn(BaseModel):
    fasta_text: str

class ExplainIn(BaseModel):
    results: dict
    question: str = ""

@app.get("/health")
def health():
    return {
        "status": "ok",
        "ai_provider": ai.name,
        "is_mock": ai.is_mock,
        "model": getattr(ai, "model_id", None),
        "version": "0.1.0",
    }
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
    try:
        return ai.explain_analysis(body.results, body.question)
    except Exception as e:
        print(f"[PhyloLoom] Meta explain failed: {type(e).__name__}: {str(e)[:500]}", flush=True)
        fallback = MockAIProvider().explain_analysis(body.results, body.question)
        fallback["fallback_reason"] = f"Meta provider failed: {type(e).__name__}: {str(e)[:300]}"
        return fallback

@app.get("/api/investigation/demo/hbb")
def investigation_demo_hbb():
    graph = build_hbb_demo_graph()
    errors = validate_graph(graph)
    return {
        "demo": True,
        "demo_label": "DEMO data - not a user analysis",
        "accession": "P68871",
        "gene": "HBB",
        "variant": {
            "mature_chain": "Glu6Val",
            "precursor": "Glu7Val",
            "coordinate_warning": "Mature-chain position 6 corresponds to precursor position 7 in P68871. Numbering schemes are not interchangeable.",
        },
        "descriptor_delta": descriptor_delta("E", "V"),
        "graph": graph.model_dump(mode="json"),
        "graph_errors": errors,
    }    