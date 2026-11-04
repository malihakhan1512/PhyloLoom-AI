export type EvidenceClass =
  | "COMPUTED" | "MODEL_PREDICTION" | "CURATED_ASSERTION"
  | "LITERATURE" | "HYPOTHESIS" | "DEMO";

export const EVIDENCE_META: Record<EvidenceClass, { label: string; icon: string; vars: [string, string, string] }> = {
  COMPUTED:         { label: "COMPUTED",          icon: "ƒx", vars: ["--ev-computed-bg", "--ev-computed-fg", "--ev-computed-border"] },
  MODEL_PREDICTION: { label: "MODEL PREDICTION",  icon: "◈",  vars: ["--ev-model-bg", "--ev-model-fg", "--ev-model-border"] },
  CURATED_ASSERTION:{ label: "CURATED ASSERTION", icon: "❖",  vars: ["--ev-curated-bg", "--ev-curated-fg", "--ev-curated-border"] },
  LITERATURE:       { label: "LITERATURE",        icon: "¶",  vars: ["--ev-literature-bg", "--ev-literature-fg", "--ev-literature-border"] },
  HYPOTHESIS:       { label: "HYPOTHESIS",        icon: "?",  vars: ["--ev-hypothesis-bg", "--ev-hypothesis-fg", "--ev-hypothesis-border"] },
  DEMO:             { label: "DEMO",              icon: "⚑",  vars: ["--ev-demo-bg", "--ev-demo-fg", "--ev-demo-border"] },
};