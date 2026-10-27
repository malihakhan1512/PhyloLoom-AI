from io import StringIO
from Bio import Phylo
from Bio.Phylo.TreeConstruction import DistanceMatrix, DistanceTreeConstructor
from .align import _aligner
from ..newick import sanitize_newick

def p_distance(s1: str, s2: str) -> float:
    aln = _aligner().align(s1, s2)[0]
    pairs = [(x, y) for x, y in zip(str(aln[0]), str(aln[1])) if x != "-" and y != "-"]
    return sum(x != y for x, y in pairs) / len(pairs) if pairs else 0.0

def distance_matrix_and_tree(records):
    names = [r["id"] for r in records]
    lower = []
    for i in range(len(records)):
        row = [p_distance(records[i]["sequence"], records[j]["sequence"]) if j < i else 0.0 for j in range(i + 1)]
        lower.append(row)
    tree = DistanceTreeConstructor().nj(DistanceMatrix(names, lower))
    buf = StringIO()
    Phylo.write(tree, buf, "newick")
    return {"method": "p-distance on pairwise global alignments (gap columns excluded) + Neighbor-Joining. Exploratory only, not a definitive evolutionary history. No multiple-substitution correction.",
            "names": names, "matrix": lower, "newick": sanitize_newick(buf.getvalue().strip())}
