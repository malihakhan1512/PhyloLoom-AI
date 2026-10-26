# PhyloLoom AI
AI-Powered Computational Genomics and Evolutionary Analysis Workspace.
Domain: phyloloom.study

Status: Phase 1 - Scientific Foundation
- FASTA parsing & validation: DONE
- Nucleotide / protein statistics: DONE
- Pairwise alignment & variant calling: DONE
- p-distance matrix + Neighbor-Joining tree: DONE
- AI Provider: Mock only (Meta API not yet configured)
- Frontend: Phase 2, not yet built

This is a research-support tool, not a clinical diagnostic system.
Observed sequence differences are NOT pathogenicity predictions.

## Run backend
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
python -m pytest -q
uvicorn app.main:app --reload
Open http://127.0.0.1:8000/docs
