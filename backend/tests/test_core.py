import pytest
from app.core.fasta import parse_fasta, detect_and_validate, SequenceError
from app.core.stats import nucleotide_stats, protein_stats
from app.core.align import pairwise_variants

def test_gc():
    assert nucleotide_stats("ACGTACGT")["gc_percent"] == 50.0
def test_empty():
    with pytest.raises(SequenceError):
        parse_fasta(">a\n\n")
def test_invalid_fasta():
    with pytest.raises(SequenceError):
        parse_fasta("ACGTACGT")
def test_ambiguous():
    assert "N" in detect_and_validate("ACGTN")["ambiguous"]
def test_protein_detect():
    assert detect_and_validate("MKTVRQG")["type"] == "protein"
def test_identical():
    v = pairwise_variants("ACGT", "ACGT")
    assert v["identity_percent"] == 100.0 and v["variants"] == []
def test_substitution():
    v = pairwise_variants("ACGT", "ACTT")["variants"]
    assert v == [{"type": "substitution", "ref_pos": 3, "ref": "G", "alt": "T"}]
def test_insertion():
    v = pairwise_variants("ACGT", "ACGTT")["variants"]
    assert v[0]["type"] == "insertion"
def test_protein_stats():
    s = protein_stats("MKTVRQG")
    assert s["length"] == 7 and s["molecular_weight_da"] > 0
