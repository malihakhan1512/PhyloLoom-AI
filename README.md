# PhyloLoom AI

AI-Powered Computational Genomics and Evolutionary Analysis Workspace

**Live application:** https://phyloloom.study
**Methods, assumptions & limitations:** https://phyloloom.study/methods

Status: **Live research prototype** — deployed, tested, and under continuous integration.
This is a research-support tool, not a clinical diagnostic system.
Observed sequence differences are NOT pathogenicity predictions.

## What PhyloLoom does

PhyloLoom AI is a reproducible research workspace for exploratory sequence analysis.
Researchers and analysts can submit their own FASTA and PDB data, compute documented
statistics, alignments, distances and exploratory trees, and export machine-readable
results (JSON, Newick) together with the method parameters used.

It is designed to be useful even when every external AI service is unavailable:
the scientific engine (FASTA validation, statistics, alignment, phylogenetics)
runs independently of the AI copilot. The copilot, when connected, receives only
computed results from the backend and must not invent numerical values.

## Features: works / experimental / not implemented

| Feature | Status |
|---|---|
| FASTA upload & paste (DNA / RNA / protein), validation, length limits | ✅ Works |
| Nucleotide composition & GC% (direct counting) | ✅ Works |
| Protein composition, molecular weight (Biopython ProtParam), GRAVY | ✅ Works |
| Pairwise Needleman–Wunsch alignment, substitutions / insertions / deletions | ✅ Works |
| p-distance matrix + exploratory Neighbor-Joining tree, raw Newick export | ✅ Works (exploratory) |
| 3D protein viewer (3Dmol.js): 1CRN experimental, AlphaFold DB predicted (pLDDT shown) | ✅ Works |
| JSON download of computed results | ✅ Works |
| Methods, assumptions, limitations & privacy documentation | ✅ Works |
| AI Research Copilot | ⚠️ Experimental — clearly labeled MOCK provider |
| Meta AI provider | 🔌 Placeholder — activates when hackathon credentials arrive |
| FASTQ, genome assembly, variant calling (VCF) | ❌ Not implemented |
| Structure prediction, pathogenicity prediction, bootstrap support | ❌ Not implemented — see Methods page |

Illustrative demo sequences (Demo A/B/C in the app) are provided for demonstrating
features and are labeled as not for scientific inference.

## Three-minute demo

1. Open https://phyloloom.study — note the `AI: MOCK provider` badge.
2. **Demo B: Tree building (4 seq)** → Analyze → composition statistics (computed live),
   p-distance matrix, exploratory NJ tree with scale bar → open *Raw Newick* → Download JSON.
3. **Demo A: Variant comparison (2 seq)** → Analyze → position-aware differences from
   the global alignment. Differences are observations, never labeled pathogenic.
4. **Protein Explorer:** Load *1CRN (experimental)*, then load AlphaFold prediction
   *P69905* — experimental and predicted structures are labeled as different evidence
   categories, with average pLDDT displayed for predictions.
5. **Ask AI Copilot (mock)** — response is labeled `[MOCK - not a real AI or biological finding]`
   and only references keys of the computed result.
6. **Methods & Limitations** — alignment parameters, distance/tree limitations,
   intended research use, privacy (data processed in memory, not stored).

## Architecture

```mermaid
flowchart LR
    U[Researcher / Browser] --> FE[Next.js Frontend]
    FE -->|FASTA / PDB| API[FastAPI Backend]
    API --> ENG[Scientific Engine<br/>Biopython: stats, alignment,<br/>p-distance, Neighbor-Joining]
    ENG --> API
    API --> FE
    FE --> V[3Dmol.js Viewer<br/>RCSB PDB / AlphaFold DB]
    API -.->|structured computed results only| AI[AI Provider<br/>Mock now / Meta when configured]