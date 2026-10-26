# PhyloLoom AI - 3-Minute Judge Demo Script

Live: https://phyloloom.study

## 0:00 - Problem (15s)
"Comparing sequences and exploring evolutionary relationships usually requires multiple CLI tools. PhyloLoom does it in one browser workspace - with full scientific transparency."

## 0:15 - Variant comparison (45s)
1. Click **Demo A: Variant comparison** -> **Analyze**
2. Point out: alignment, identity %, substitutions - computed live with Biopython Needleman-Wunsch, NOT AI-generated.

## 1:00 - Tree building (45s)
1. Click **Demo B: Tree building** -> **Analyze**
2. Point out: p-distance matrix + Neighbor-Joining tree.
3. Say the limitation out loud: "This is exploratory - p-distance, no bootstrap. We state that on our Methods page."

## 1:45 - Export (20s)
Click **Download Tree (Newick)** and **Download Results (JSON)** - reproducible outputs, not screenshots.

## 2:05 - Protein Explorer (45s)
1. **Load Demo: 1CRN** - "Experimental X-ray structure from RCSB PDB."
2. Change to Sticks, highlight residue 10.
3. Enter UniProt `P69905` -> **Load AlphaFold Prediction** - "Now a PREDICTED structure, labeled as a different evidence category. We never mix them up."

## 2:50 - Transparency close (10s)
Open **Methods & Limitations**: "Every method, assumption, and limitation is documented. The AI copilot is clearly labeled MOCK - it makes no biological claims."

## Honest limitations to state if asked
Not clinical/diagnostic. No structure prediction. No bootstrap. Pairwise alignment, not true MSA.
