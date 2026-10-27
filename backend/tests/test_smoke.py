import json, re
from io import StringIO
from Bio import Phylo
from fastapi.testclient import TestClient
from app.main import app
from app.core.fasta import parse_fasta

client = TestClient(app)

FASTA_3 = """>Human
ACGTACGTACGTACGTACGT
>Chimp
ACGTACGTACGTACGTACGA
>Mouse
ACGTTCGTACGATCGTACGT
>Rat
ACGTTCGCACGATCGTACGA
"""

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_analyze_single_sequence():
    r = client.post("/api/analyze", json={"fasta_text": ">Human\nACGTACGTACGT\n"})
    assert r.status_code == 200
    data = r.json()
    assert len(data["sequences"]) == 1
    assert data["sequences"][0]["id"] == "Human"

def test_analyze_provenance_sticks():
    r = client.post("/api/analyze", json={"fasta_text": FASTA_3})
    assert r.status_code == 200
    for seq in r.json()["sequences"]:
        assert seq["provenance"] == "computed_live"

def test_analyze_two_sequences_has_comparison():
    fasta = ">A\nACGTACGTACGT\n>B\nACGTACGTACGA\n"
    r = client.post("/api/analyze", json={"fasta_text": fasta})
    assert r.status_code == 200
    assert "comparison" in r.json()

def test_analyze_phylogeny_newick_never_negative():
    r = client.post("/api/analyze", json={"fasta_text": FASTA_3})
    assert r.status_code == 200
    newick = r.json()["phylogeny"]["newick"]
    assert newick.endswith(";")
    assert not re.search(r":-\d", newick), f"Negative leaked via API: {newick}"
    # And it must be parseable by Bio.Phylo (same check export viewers do)
    tree = Phylo.read(StringIO(newick), "newick")
    assert tree is not None

def test_export_roundtrips_from_analyze_result():
    r = client.post("/api/analyze", json={"fasta_text": FASTA_3})
    assert r.status_code == 200
    data = r.json()

    # 1. JSON export must be serializable
    exported_json = json.dumps(data)
    assert json.loads(exported_json)["phylogeny"]["newick"] == data["phylogeny"]["newick"]

    # 2. FASTA export must re-parse to same IDs/sequences
    exported_fasta = "\n".join(f">{s['id']}\n{s['sequence']}" for s in data["sequences"])
    reparsed = parse_fasta(exported_fasta)
    assert [x["id"] for x in reparsed] == [x["id"] for x in data["sequences"]]
    assert [x["sequence"] for x in reparsed] == [x["sequence"] for x in data["sequences"]]

    # 3. Newick export must re-parse
    Phylo.read(StringIO(data["phylogeny"]["newick"]), "newick")

def test_analyze_invalid_sequence_is_422():
    r = client.post("/api/analyze", json={"fasta_text": ">Bad\n12345!!!\n"})
    assert r.status_code == 422
