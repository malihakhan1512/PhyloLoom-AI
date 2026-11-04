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
from .investigation.mutation import investigate_pair
from .investigation.counterfactual import enumerate_counterfactuals
from .investigation.hypothesis import build_hypothesis_cards
from .investigation.evolution import analyze_evolution, DEMO_EVOLUTION_FASTA
from .investigation.adapters.uniprot import fetch_uniprot_record, SourceUnavailable
from .investigation.structure import analyze_structure_context, StructureMappingError
from .investigation.provenance import canonical_sha256, utc_now_iso
from fastapi.responses import HTMLResponse
from .investigation.report import build_report_bundle, render_html_report
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
class MutationInvestigationIn(BaseModel):
    reference_sequence: str
    alternate_sequence: str
    reference_id: str = "reference"
    alternate_id: str = "alternate"
    coordinate_system: str = "submitted_sequence_1_based"


class CounterfactualIn(BaseModel):
    ref_aa: str

class HypothesisIn(BaseModel):
    variant_label: str
    descriptor_delta: dict
    citation_ids: list[str]

class EvolutionIn(BaseModel):
    fasta_text: str
    gap_flag_threshold: float = 0.5
class StructureContextIn(BaseModel):
    pdb_text: str
    chain_id: str
    residue_number: int
    insertion_code: str = ""
    cutoff: float = 5.0
class ReportIn(BaseModel):
    title: str = "PhyloLoom Investigation Report"
    sections: dict

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

@app.post("/api/investigation/mutation")
def investigation_mutation(body: MutationInvestigationIn):
    try:
        return investigate_pair(
            body.reference_sequence,
            body.alternate_sequence,
            body.reference_id,
            body.alternate_id,
            body.coordinate_system,
        )
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.post("/api/investigation/counterfactual")
def investigation_counterfactual(body: CounterfactualIn):
    try:
        return enumerate_counterfactuals(body.ref_aa)
    except ValueError as e:
        raise HTTPException(422, str(e))

@app.post("/api/investigation/hypotheses")
def investigation_hypotheses(body: HypothesisIn):
    delta = body.descriptor_delta.get("delta", body.descriptor_delta)
    try:
        cards = build_hypothesis_cards(
            variant_label=body.variant_label,
            delta=delta,
            citation_ids=body.citation_ids,
        )
    except ValueError as e:
        raise HTTPException(422, str(e))

    return {
        "classification": "HYPOTHESIS",
        "status": "untested",
        "cards": cards,
        "note": (
            "These are falsifiable hypotheses generated from approved templates. "
            "They are not findings, clinical interpretations, or executed tests."
        ),
    }


@app.get("/api/investigation/demo/hbb/hypotheses")
def investigation_demo_hbb_hypotheses():
    cards = build_hypothesis_cards(
        variant_label="Glu6Val (mature chain) = Glu7Val (precursor)",
        delta={
            "hydropathy_kd": 7.7,
            "polarity_grantham": -6.4,
            "volume_a3": 1.6,
            "charge_ph7": 1,
        },
        citation_ids=["evidence:descriptor:E6V"],
    )
    return {
        "demo": True,
        "demo_label": "DEMO hypotheses - generated from the labelled HBB demo evidence",
        "classification": "HYPOTHESIS",
        "status": "untested",
        "cards": cards,
        "note": (
            "These are falsifiable hypotheses generated from approved templates. "
            "They are not findings, clinical interpretations, or executed tests."
        ),
    }    

@app.post("/api/investigation/evolution")
def investigation_evolution(body: EvolutionIn):
    try:
        return analyze_evolution(body.fasta_text, gap_threshold=body.gap_flag_threshold)
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.get("/api/investigation/demo/evolution")
def investigation_demo_evolution():
    result = analyze_evolution(DEMO_EVOLUTION_FASTA, demo=True)
    result["demo_label"] = "DEMO alignment - labelled demonstration data, not a user analysis"
    return result

@app.get("/api/investigation/reference/uniprot/{accession}")
def investigation_uniprot(accession: str):
    try:
        record = fetch_uniprot_record(accession)
    except SourceUnavailable as e:
        return {
            "status": "unavailable",
            "accession": accession,
            "reason": str(e),
            "classification": "CURATED_ASSERTION",
            "note": "External record unavailable. Nothing was invented or substituted.",
        }
    except ValueError as e:
        raise HTTPException(422, str(e))

    return {
        "status": "available",
        "accession": record["accession"],
        "id": record["id"],
        "length": record["length"],
        "sequence_sha256": canonical_sha256(record["sequence"]),
        "source": record["source"],
        "source_url": record["source_url"],
        "classification": "CURATED_ASSERTION",
        "retrieved_at": utc_now_iso(),
        "note": "Sequence itself is not echoed by this endpoint; only its checksum and metadata. Retrieval is live and may vary by database release.",
    }


@app.post("/api/investigation/structure-context")
def investigation_structure_context(body: StructureContextIn):
    try:
        return analyze_structure_context(
            body.pdb_text,
            body.chain_id,
            body.residue_number,
            body.insertion_code,
            body.cutoff,
        )
    except StructureMappingError as e:
        raise HTTPException(422, str(e))
@app.post("/api/investigation/report")
def investigation_report(body: ReportIn):
    try:
        return build_report_bundle(body.title, body.sections)
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.post("/api/investigation/report/html", response_class=HTMLResponse)
def investigation_report_html(body: ReportIn):
    try:
        bundle = build_report_bundle(body.title, body.sections)
    except ValueError as e:
        raise HTTPException(422, str(e))
    return render_html_report(bundle)

    