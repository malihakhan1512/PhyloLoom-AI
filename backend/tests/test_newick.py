import re
from app.newick import format_branch_length, sanitize_newick, clamp_tree_branches, to_newick

def test_negative_branch_is_clamped():
    assert format_branch_length(-0.5) == ":0.000000"
    assert format_branch_length(-0.00123) == ":0.000000"

def test_positive_branch_unchanged():
    assert format_branch_length(0.123456) == ":0.123456"
    assert format_branch_length(0) == ":0.000000"

def test_none_branch_has_no_colon():
    assert format_branch_length(None) == ""

def test_sanitize_fixes_existing_newick():
    assert sanitize_newick("(A:-0.01,B:0.2);") == "(A:0.000000,B:0.2);"

def test_sanitize_fixes_scientific_notation():
    assert sanitize_newick("(A:-1e-05,B:0.2);") == "(A:0.000000,B:0.2);"

def test_sanitize_leaves_positive_untouched():
    original = "(A:0.01,B:0.2);"
    assert sanitize_newick(original) == original

def test_sanitize_empty():
    assert sanitize_newick("") == ""

def test_clamp_and_serialize_dict_tree():
    tree = {
        "name": "root",
        "children": [
            {"name": "A", "branch_length": -0.01},
            {"name": "B", "branch_length": 0.2},
        ]
    }
    newick = to_newick(clamp_tree_branches(tree))
    assert not re.search(r":-\d", newick), f"Negative leaked: {newick}"
    assert newick == "(A:0.000000,B:0.200000)root;"

def test_real_nj_tree_never_has_negative_branches():
    # Regression test for the REAL bug from Phase 5 - uses your actual code
    from app.core.phylo import distance_matrix_and_tree
    records = [
        {"id": "Human", "sequence": "ACGTACGTACGTACGTACGT"},
        {"id": "Chimp", "sequence": "ACGTACGTACGTACGTACGA"},
        {"id": "Mouse", "sequence": "ACGTTCGTACGATCGTACGT"},
        {"id": "Rat",   "sequence": "ACGTTCGCACGATCGTACGA"},
    ]
    result = distance_matrix_and_tree(records)
    newick = result["newick"]
    assert newick.endswith(";")
    assert not re.search(r":-\d", newick), f"Negative leaked from NJ: {newick}"
