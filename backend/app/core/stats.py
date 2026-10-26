from collections import Counter
from Bio.SeqUtils.ProtParam import ProteinAnalysis

def nucleotide_stats(seq: str):
    c = Counter(seq)
    n = len(seq)
    gc = (c["G"] + c["C"]) / n * 100 if n else 0.0
    return {"length": n, "gc_percent": round(gc, 3),
            "composition": {k: round(v / n, 4) for k, v in sorted(c.items())},
            "method": "Direct counting. GC% = (G+C)/length*100"}

def protein_stats(seq: str):
    # ProtParam does not accept U/O. Documented substitution for MW/GRAVY calc only.
    clean = seq.replace("U", "C").replace("O", "K").replace("X", "A").replace("B", "N").replace("Z", "Q").replace("J", "L")
    pa = ProteinAnalysis(clean)
    c = Counter(seq)
    n = len(seq)
    return {"length": n, "molecular_weight_da": round(pa.molecular_weight(), 2),
            "gravy": round(pa.gravy(), 4),
            "composition": {k: round(v / n, 4) for k, v in sorted(c.items())},
            "method": "Biopython ProtParam. MW=sum residue masses+water. GRAVY=Kyte-Doolittle mean."}
