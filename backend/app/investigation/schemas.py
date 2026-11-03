from enum import Enum
from pydantic import BaseModel, Field


class EvidenceClassification(str, Enum):
    COMPUTED = "COMPUTED"
    MODEL_PREDICTION = "MODEL_PREDICTION"
    CURATED_ASSERTION = "CURATED_ASSERTION"
    LITERATURE = "LITERATURE"
    HYPOTHESIS = "HYPOTHESIS"
    DEMO = "DEMO"


class NodeType(str, Enum):
    Sequence = "Sequence"
    Variant = "Variant"
    AnalysisArtifact = "AnalysisArtifact"
    EvidenceItem = "EvidenceItem"
    Claim = "Claim"
    Hypothesis = "Hypothesis"
    TestRun = "TestRun"
    Report = "Report"


class EdgeType(str, Enum):
    derived_from = "derived_from"
    supports = "supports"
    contradicts = "contradicts"
    annotates = "annotates"
    maps_to_residue = "maps_to_residue"
    observed_in_taxon = "observed_in_taxon"
    tested_by = "tested_by"
    supersedes = "supersedes"


class EvidenceNode(BaseModel):
    id: str
    type: NodeType
    label: str
    classification: EvidenceClassification
    provenance: dict = Field(default_factory=dict)
    data: dict = Field(default_factory=dict)


class EvidenceEdge(BaseModel):
    source: str
    target: str
    type: EdgeType
    provenance: dict = Field(default_factory=dict)


class EvidenceGraph(BaseModel):
    nodes: list[EvidenceNode]
    edges: list[EvidenceEdge]
    schema_version: str = "phyloloom.evidence-graph/0.1.0"