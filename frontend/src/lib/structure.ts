export const DEMO_STRUCTURE_ID = "1CRN";
export const DEFAULT_UNIPROT_ID = "P69905";

export function experimentalDemoStatus(): string {
  return "Demo loaded: 1CRN (crambin) - EXPERIMENTAL X-ray crystal structure from RCSB PDB. Not a prediction.";
}

export function predictedStatus(
  id: string,
  organismScientificName: string | undefined,
  globalMetricValue: number | string | undefined
): string {
  return (
    "PREDICTED structure loaded: AlphaFold DB " + id +
    " (" + (organismScientificName || "unknown organism") + "), avg pLDDT: " +
    (globalMetricValue ?? "n/a") +
    ". This is a prediction, NOT an experimental structure."
  );
}