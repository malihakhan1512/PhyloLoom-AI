import { describe, it, expect } from "vitest";
import { experimentalDemoStatus, predictedStatus, DEFAULT_UNIPROT_ID } from "./structure";

describe("provenance labels stick", () => {
  it("1CRN is EXPERIMENTAL, never PREDICTED", () => {
    const s = experimentalDemoStatus();
    expect(s).toContain("1CRN");
    expect(s).toContain("EXPERIMENTAL");
    expect(s).toContain("Not a prediction");
    expect(s).not.toContain("PREDICTED structure loaded");
  });

  it("default UniProt demo is P69905", () => {
    expect(DEFAULT_UNIPROT_ID).toBe("P69905");
  });

  it("P69905 is PREDICTED with pLDDT 98.06", () => {
    const s = predictedStatus("P69905", "Homo sapiens", 98.06);
    expect(s).toContain("P69905");
    expect(s).toContain("PREDICTED");
    expect(s).toContain("98.06");
    expect(s).toContain("NOT an experimental structure");
    expect(s).not.toContain("EXPERIMENTAL X-ray");
  });

  it("missing pLDDT shows n/a, does not crash", () => {
    expect(predictedStatus("P69905", undefined, undefined)).toContain("n/a");
  });
});