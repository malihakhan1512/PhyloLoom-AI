from io import StringIO
from Bio import SeqIO

DNA = set("ACGTUNRYSWKMBDHV")
PROTEIN = set("ACDEFGHIKLMNPQRSTVWYBXZJUO")

class SequenceError(ValueError):
    pass

def parse_fasta(text: str, max_seqs=50, max_len=100000):
    if not text or not text.strip():
        raise SequenceError("Empty input.")
    records = []
    try:
        for r in SeqIO.parse(StringIO(text), "fasta"):
            seq = str(r.seq).upper().replace(" ", "").replace("\r", "")
            if not seq:
                raise SequenceError(f"Record {r.id} has empty sequence.")
            if len(seq) > max_len:
                raise SequenceError(f"Record {r.id} exceeds {max_len} residues.")
            records.append({"id": r.id, "description": r.description, "sequence": seq})
    except SequenceError:
        raise
    except Exception as e:
        raise SequenceError(f"FASTA parse failed: {e}")
    if not records:
        raise SequenceError("No FASTA records found. Headers must start with >")
    if len(records) > max_seqs:
        raise SequenceError(f"Too many sequences. Max {max_seqs}.")
    return records

def detect_and_validate(seq: str):
    chars = set(seq)
    invalid_dna = chars - DNA
    invalid_prot = chars - PROTEIN
    if not invalid_dna:
        return {"type": "nucleotide", "invalid": [], "ambiguous": sorted(chars & set("NRYSWKMBDHVU"))}
    if not invalid_prot:
        return {"type": "protein", "invalid": [], "ambiguous": sorted(chars & set("BXZJUO"))}
    return {"type": "unknown", "invalid": sorted(invalid_dna & invalid_prot), "ambiguous": []}
