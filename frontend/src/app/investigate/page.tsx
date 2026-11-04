"use client";
import { useEffect, useState } from "react";
import EvidenceGraph, { EvidenceGraphData } from "@/components/investigation/EvidenceGraph";
import ResidueStrip from "@/components/investigation/ResidueStrip";
import CounterfactualMatrix, { CounterfactualRow } from "@/components/investigation/CounterfactualMatrix";
import HypothesisBoard, { HypothesisCard } from "@/components/investigation/HypothesisBoard";
import EntropyTrack, { ColumnStat } from "@/components/investigation/EntropyTrack";
import ConservationHeatmap from "@/components/investigation/ConservationHeatmap";
import PhyloTree from "@/components/PhyloTree";
import StructureContextPanel from "@/components/investigation/StructureContextPanel";
import ReferenceLookup from "@/components/investigation/ReferenceLookup";
import ReportExport from "@/components/investigation/ReportExport";
import HypothesisAgentPanel, { AgentFinding } from "@/components/investigation/HypothesisAgentPanel";
import EvidenceBadge from "@/components/ui/EvidenceBadge";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SectionLabel from "@/components/ui/SectionLabel";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type DemoResponse = {
  demo: boolean;
  demo_label: string;
  accession: string;
  gene: string;
  variant: {
    mature_chain: string;
    precursor: string;
    coordinate_warning: string;
  };
  descriptor_delta: {
    table_version: string;
    ph_assumption: number;
    hydropathy_scale: string;
    delta: {
      hydropathy_kd: number;
      polarity_grantham: number;
      volume_a3: number;
      charge_ph7: number;
      aromatic_change: boolean;
    };
    note: string;
  };
  graph: EvidenceGraphData;
  graph_errors: string[];
};

type LiveResult = {
  demo: boolean;
  result_label: string;
  coordinate_system: string;
  coordinate_note: string;
  comparison: {
    identity_percent: number;
    variants: { type: string; ref_pos: number; ref: string | null; alt: string | null }[];
    method: string;
    note: string;
  };
  primary_substitution: { type: string; ref_pos: number; ref: string; alt: string } | null;
  descriptor_delta: DemoResponse["descriptor_delta"] | null;
  counterfactuals: { ref_aa: string; count: number; alternatives: CounterfactualRow[] } | null;
  graph: EvidenceGraphData | null;
  graph_errors: string[];
  unavailable: Record<string, string>;
};
type EvolutionResult = {
  demo: boolean;
  classification: string;
  sequence_type: string;
  sequence_count: number;
  alignment_length: number;
  alignment: { status: string; method?: string; reason?: string; mafft_version?: string | null };
  sequences: { id: string; sequence: string }[];
  effective_sequence_count: number;
  columns: ColumnStat[] | null;
  candidate_homoplasy: { position: number; consensus: string; residue: string; sequence_count: number; low_occupancy: boolean; label: string }[];
  tree: { newick: string; method: string; branch_support_label: string } | null;
  summary: { flagged_low_occupancy_columns: number[]; candidate_recurrent_count: number; note: string } | null;
  unavailable: Record<string, string>;
};

export default function InvestigatePage() {
  const [data, setData] = useState<DemoResponse | null>(null);
  const [error, setError] = useState("");
  const [liveRef, setLiveRef] = useState("MEEPQSDPSV");
  const [liveAlt, setLiveAlt] = useState("MVEPQSDPSV");
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null);
  const [liveError, setLiveError] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const [demoHypotheses, setDemoHypotheses] = useState<HypothesisCard[]>([]);
  const [liveHypotheses, setLiveHypotheses] = useState<HypothesisCard[]>([]);
  const [liveHypothesisError, setLiveHypothesisError] = useState("");

  const DEMO_EVO = ">demo_human\nMVHLTPEEKSAVTALWGKVN\n>demo_chimp\nMVHLTPEEKSAVTALWGKVN\n>demo_mouse\nMVHLTDAEKAAVNGLWGKVN\n>demo_rabbit\nMVHLSSDEKNAVHGLWGKVN\n>demo_zebrafish\nMVHLTADEKAAVTGLWSKVN\n";

  const [evoInput, setEvoInput] = useState(DEMO_EVO);
  const [evoResult, setEvoResult] = useState<EvolutionResult | null>(null);
  const [evoError, setEvoError] = useState("");
  const [evoLoading, setEvoLoading] = useState(false);
  const [evoColumn, setEvoColumn] = useState<number | null>(null);
  const [agentResult, setAgentResult] = useState<unknown>(null);

  async function loadDemoHypotheses() {
    try {
      const r = await fetch(`${API}/api/investigation/demo/hbb/hypotheses`);
      if (!r.ok) return;
      const body = await r.json();
      setDemoHypotheses(body.cards || []);
    } catch {
      setDemoHypotheses([]);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`${API}/api/investigation/demo/hbb`);
        if (!r.ok) throw new Error(`Investigation demo failed (${r.status})`);
        setData(await r.json());
      } catch (e: any) {
        setError(e.message || "Could not load investigation demo");
      }
    }
    load();
    loadDemoHypotheses();
  }, []);

  async function generateLiveHypotheses() {
    if (!liveResult?.primary_substitution || !liveResult.descriptor_delta) return;

    setLiveHypothesisError("");
    try {
      const r = await fetch(`${API}/api/investigation/hypotheses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_label:
            `${liveResult.primary_substitution.ref}` +
            `${liveResult.primary_substitution.ref_pos}` +
            `${liveResult.primary_substitution.alt}`,
          descriptor_delta: liveResult.descriptor_delta,
          citation_ids: ["evidence:live:descriptor"],
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.detail || "Hypothesis generation failed");
      setLiveHypotheses(body.cards || []);
    } catch (e: any) {
      setLiveHypotheses([]);
      setLiveHypothesisError(e.message || "Hypothesis generation failed");
    }
  }

  async function runLiveInvestigation() {
    setLiveLoading(true);
    setLiveError("");
    setLiveResult(null);
    setLiveHypotheses([]);
    setLiveHypothesisError("");

    try {
      const r = await fetch(`${API}/api/investigation/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_sequence: liveRef,
          alternate_sequence: liveAlt,
          reference_id: "user_reference",
          alternate_id: "user_alternate",
          coordinate_system: "submitted_sequence_1_based",
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.detail || "Live investigation failed");
      setLiveResult(body);
    } catch (e: any) {
      setLiveError(e.message || "Live investigation failed");
    }

    setLiveLoading(false);
  }
  async function runEvolution() {
    setEvoLoading(true);
    setEvoError("");
    setEvoResult(null);
    setEvoColumn(null);
    try {
      const r = await fetch(`${API}/api/investigation/evolution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fasta_text: evoInput, gap_flag_threshold: 0.5 }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.detail || "Evolution analysis failed");
      setEvoResult(body);
    } catch (e: any) {
      setEvoError(e.message || "Evolution analysis failed");
    }
    setEvoLoading(false);
  }
  const reportSections: Record<string, unknown> = {
    hbb_demo: data ?? { status: "unavailable", reason: "HBB demo not loaded" },
    demo_hypotheses: demoHypotheses.length
      ? demoHypotheses
      : { status: "unavailable", reason: "No demo hypothesis cards loaded" },
    live_mutation: liveResult ?? { status: "unavailable", reason: "Live mutation investigation not run" },
    live_hypotheses: liveHypotheses.length
      ? liveHypotheses
      : { status: "unavailable", reason: "No live hypothesis cards generated" },
    evolution: evoResult ?? { status: "unavailable", reason: "Evolutionary analysis not run" },
    unavailable_analyses: {
      esm_model_score: "unavailable — gated spike not completed",
      ddg: "unavailable — no licensed and benchmarked stability tool integrated",
      dssp_secondary_structure: "unavailable — mkdssp not verified",
      solvent_accessibility: "unavailable — requires DSSP",
      fasttree: "unavailable — not verified in deployment image",
      positive_selection: "unavailable — never inferred from variability alone",
      clinical_interpretation: "unavailable — PhyloLoom does not classify variants clinically",
    },
    ai_hypothesis_proposal: agentResult ?? { status: "unavailable", reason: "AI hypothesis proposal not generated" },
  };
  const agentFindings: AgentFinding[] = [];
  if (data) {
    agentFindings.push({
      id: "evidence:descriptor:E6V",
      classification: "COMPUTED",
      summary: `HBB demo E->V descriptor delta: hydropathy +7.7, polarity -6.4, volume +1.6 A^3, charge +1 (mature chain 6 = precursor 7)`,
      caveats: ["DEMO dataset", "Descriptor differences only — not pathogenicity, stability, or fitness"],
    });
  }
  if (liveResult?.primary_substitution && liveResult.descriptor_delta) {
    const v = liveResult.primary_substitution;
    const d = liveResult.descriptor_delta.delta;
    agentFindings.push({
      id: "evidence:live:descriptor",
      classification: "COMPUTED",
      summary: `Live variant ${v.ref}${v.ref_pos}${v.alt}: hydropathy ${d.hydropathy_kd}, polarity ${d.polarity_grantham}, volume ${d.volume_a3} A^3, charge ${d.charge_ph7} (submitted-sequence numbering)`,
      caveats: ["Submitted-sequence coordinates only", "Not a clinical interpretation"],
    });
  }
  if (evoResult?.summary) {
    agentFindings.push({
      id: "evidence:evolution:summary",
      classification: evoResult.classification,
      summary: `Evolution: ${evoResult.sequence_count} sequences, effective count ${evoResult.effective_sequence_count}, ${evoResult.summary.candidate_recurrent_count} candidate recurrent substitutions, low-occupancy columns: ${evoResult.summary.flagged_low_occupancy_columns.join(", ") || "none"}`,
      caveats: ["Candidate homoplasy is descriptive only", "No positive-selection inference"],
    });
  }

  return (
    <main className="min-h-screen font-sans" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <header
        className="px-6 py-4 flex flex-wrap gap-3 justify-between items-center pl-enter"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div>
          <a href="/" className="text-2xl font-black tracking-tight" style={{ color: "var(--accent)" }}>
            PhyloLoom AI
          </a>
          <p className="text-sm pl-ink-soft">Biological Investigation Engine</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="/workspace"
            className="inline-flex items-center min-h-[44px] text-sm underline"
            style={{ color: "var(--accent)" }}
          >
            Workspace
          </a>
          <a
            href="/methods"
            className="inline-flex items-center min-h-[44px] text-sm underline"
            style={{ color: "var(--accent)" }}
          >
            Methods &amp; Limitations
          </a>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 grid gap-6 xl:grid-cols-2 items-start">
        <div className="pl-surface p-4 xl:col-span-2" style={{ borderTop: "3px solid var(--accent-demo)", background: "var(--ev-demo-bg)" }}>
          <p className="font-bold" style={{ color: "var(--ev-demo-fg)" }}>DEMO — labelled demonstration data</p>
          <p className="text-sm" style={{ color: "var(--ev-demo-fg)" }}>
            HBB / P68871 beta-globin showcase. This is not a user analysis and is never blended with live results.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}
        {!data && !error && <LoadingState active status="Loading HBB demo investigation" steps={["Fetching demo evidence graph", "Computing descriptor deltas"]} />}

        {data && (
          <>
            <section id="mutation-detective-demo" className="pl-surface p-4 xl:col-span-2" style={{ borderTop: "3px solid var(--accent-demo)" }}>
              <SectionLabel accent="var(--accent-demo)">Demo Showcase</SectionLabel>
              <h2 className="font-semibold text-lg">Mutation Detective — {data.gene} {data.variant.mature_chain}</h2>
              <p className="text-sm mt-1">
                Accession: <code>{data.accession}</code> · Mature chain: <strong>{data.variant.mature_chain}</strong> ·
                Precursor: <strong>{data.variant.precursor}</strong>
              </p>
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                Coordinate warning: {data.variant.coordinate_warning}
              </p>
              {data.graph_errors.length > 0 && (
                <p className="text-sm text-red-600 mt-2">Graph integrity errors: {data.graph_errors.join("; ")}</p>
              )}
            </section>

            <section id="physicochemical-evidence" className="xl:col-span-2 pl-surface p-4" style={{ borderTop: "3px solid var(--accent-live)" }}>
              <SectionLabel accent="var(--accent-live)">Computed Evidence</SectionLabel>
              <h2 className="font-semibold">Physicochemical Evidence <EvidenceBadge kind="COMPUTED" /></h2>
              <table className="text-sm mt-3 w-full max-w-xl pl-table-nums">
                <tbody>
                  <tr className="border-b"><td className="py-1">Hydropathy Δ (Kyte-Doolittle)</td><td className="font-mono">{data.descriptor_delta.delta.hydropathy_kd}</td></tr>
                  <tr className="border-b"><td className="py-1">Polarity Δ (Grantham)</td><td className="font-mono">{data.descriptor_delta.delta.polarity_grantham}</td></tr>
                  <tr className="border-b"><td className="py-1">Volume Δ (Å³)</td><td className="font-mono">{data.descriptor_delta.delta.volume_a3}</td></tr>
                  <tr className="border-b"><td className="py-1">Charge Δ (pH {data.descriptor_delta.ph_assumption})</td><td className="font-mono">{data.descriptor_delta.delta.charge_ph7}</td></tr>
                  <tr><td className="py-1">Aromaticity changed</td><td className="font-mono">{String(data.descriptor_delta.delta.aromatic_change)}</td></tr>
                </tbody>
              </table>
              <p className="text-xs text-slate-400 mt-2">
                Table: {data.descriptor_delta.table_version}. {data.descriptor_delta.note}
              </p>
              <p className="text-sm mt-2">
                Model score (ESM-family): <strong>unavailable</strong> — gated spike not yet run. Stability ΔΔG: <strong>unavailable</strong> — no licensed tool verified. Neither is shown as zero.
              </p>
            </section>

            <section id="evidence-graph" className="pl-surface p-4 xl:col-span-2" style={{ borderTop: "3px solid var(--accent-live)" }}>
              <SectionLabel accent="var(--accent-live)">Traceability</SectionLabel>
              <h2 className="font-semibold mb-3">Evidence Graph — click any conclusion to trace it</h2>
              <EvidenceGraph graph={data.graph} />
            </section>

            <section id="demo-hypotheses" className="xl:col-span-2 pl-surface p-4" style={{ borderTop: "3px solid var(--accent-agent)" }}>
              <SectionLabel accent="var(--accent-agent)">Hypotheses</SectionLabel>
              <h2 className="font-semibold mb-1">Hypothesis Board — HBB Demo</h2>
              <p className="text-sm text-slate-500 mb-3">
                Approved-template hypotheses generated from demo evidence. They are untested,
                falsifiable, and are not findings or clinical interpretations.
              </p>
              <HypothesisBoard cards={demoHypotheses} />
            </section>
          </>
        )}

        {/* Live section is a SIBLING of the demo block above.
            It must remain usable even if the demo endpoint fails. */}
        <section id="mutation-detective" className="pl-surface p-4 xl:col-span-2" style={{ borderTop: "3px solid var(--accent-live)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel accent="var(--accent-live)">Live Analysis</SectionLabel>
            <h2 className="font-semibold text-lg">Live Mutation Detective</h2>
            <EvidenceBadge kind="COMPUTED" text="LIVE COMPUTED" />
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">Not demo data</span>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            Paste two protein sequences. PhyloLoom aligns them, detects observed differences, computes descriptor
            evidence for the first substitution, and generates the 19-way counterfactual matrix. It does not classify
            the variant as pathogenic, benign, adaptive, or stability-changing.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <label className="text-sm">
              Reference protein sequence
              <textarea
                value={liveRef}
                onChange={(e) => setLiveRef(e.target.value)}
                rows={5}
                className="w-full border rounded p-2 font-mono text-sm mt-1"
                spellCheck={false}
              />
            </label>

            <label className="text-sm">
              Alternate protein sequence
              <textarea
                value={liveAlt}
                onChange={(e) => setLiveAlt(e.target.value)}
                rows={5}
                className="w-full border rounded p-2 font-mono text-sm mt-1"
                spellCheck={false}
              />
            </label>
          </div>

          <button
            onClick={runLiveInvestigation}
            disabled={liveLoading}
            className="bg-teal-600 text-white px-4 py-2 rounded mt-3 disabled:opacity-50"
          >
            {liveLoading ? "Investigating..." : "Run Live Investigation"}
          </button>

          {liveError && <p className="mt-3 text-red-600 text-sm bg-red-50 p-3 rounded">{liveError}</p>}
          <LoadingState active={liveLoading} status="Aligning sequences and computing descriptor evidence" steps={["Needleman-Wunsch alignment", "Descriptor deltas", "19-way counterfactuals"]} />

          {liveResult && (
            <div className="mt-5 space-y-5">
              <div className="border rounded p-3 bg-slate-50 text-sm">
                <p><strong>{liveResult.result_label}</strong></p>
                <p>Identity: {liveResult.comparison.identity_percent}%</p>
                <p>Variants detected: {liveResult.comparison.variants.length}</p>
                <p className="text-xs text-slate-500 mt-1">{liveResult.coordinate_note}</p>
                <p className="text-xs text-slate-500">{liveResult.comparison.method}</p>
              </div>

              {liveResult.primary_substitution ? (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">
                      Residue Strip — {liveResult.primary_substitution.ref}
                      {liveResult.primary_substitution.ref_pos}
                      {liveResult.primary_substitution.alt}
                    </h3>
                    <ResidueStrip
                      referenceSequence={liveRef.toUpperCase().replace(/\s/g, "")}
                      alternateSequence={liveAlt.toUpperCase().replace(/\s/g, "")}
                      position={liveResult.primary_substitution.ref_pos}
                      coordinateSystem={liveResult.coordinate_system}
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Residue strip uses submitted-sequence coordinates for substitution cases. Gap-aware strip
                      rendering for variants occurring after insertions or deletions is unavailable in this slice.
                    </p>
                  </div>

                  {liveResult.descriptor_delta && (
                    <div className="border rounded p-3">
                      <h3 className="font-semibold">Computed Descriptor Evidence</h3>
                      <p className="text-sm mt-1">
                        Δ Hydropathy: {liveResult.descriptor_delta.delta.hydropathy_kd} ·
                        Δ Polarity: {liveResult.descriptor_delta.delta.polarity_grantham} ·
                        Δ Volume: {liveResult.descriptor_delta.delta.volume_a3} Å³ ·
                        Δ Charge: {liveResult.descriptor_delta.delta.charge_ph7}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{liveResult.descriptor_delta.note}</p>
                    </div>
                  )}

                  {liveResult.counterfactuals && (
                    <div>
                      <h3 className="font-semibold mb-2">
                        Biological Counterfactual Lab — all 19 alternatives to {liveResult.counterfactuals.ref_aa}
                      </h3>
                      <CounterfactualMatrix rows={liveResult.counterfactuals.alternatives} />
                    </div>
                  )}

                  {liveResult.graph && (
                    <div>
                      <h3 className="font-semibold mb-2">Live Evidence Graph</h3>
                      <EvidenceGraph graph={liveResult.graph} />
                    </div>
                  )}

                  <div className="mt-5">
                    <button
                      onClick={generateLiveHypotheses}
                      className="border px-3 py-2 rounded text-sm"
                    >
                      Generate Hypothesis Cards
                    </button>

                    {liveHypothesisError && (
                      <p className="mt-3 text-red-600 text-sm bg-red-50 p-3 rounded">{liveHypothesisError}</p>
                    )}

                    {liveHypotheses.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">Hypothesis Board — Live Analysis</h3>
                        <HypothesisBoard cards={liveHypotheses} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm bg-amber-50 border border-amber-200 rounded p-3">
                  No single primary substitution was selected. Indels and identical sequences are reported as observations,
                  but descriptor and counterfactual analysis are unavailable for them in this slice rather than being forced.
                </p>
              )}

              <div className="text-sm border rounded p-3">
                <p>Model score: <strong>unavailable</strong></p>
                <p>ΔΔG: <strong>unavailable</strong></p>
                <p>Clinical interpretation: <strong>unavailable</strong></p>
              </div>
            </div>
          )}
        </section>
        <section id="evolution" className="pl-surface p-4 xl:col-span-2" style={{ borderTop: "3px solid var(--accent-evolution)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel accent="var(--accent-evolution)">Evolution</SectionLabel>
            <h2 className="font-semibold text-lg">Evolutionary Anomaly Detector</h2>
            <EvidenceBadge kind="COMPUTED" />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Paste 3+ aligned homologous sequences (equal length, gaps allowed), or unaligned sequences if MAFFT is
            available on the server. Computes Shannon entropy, normalized conservation, gap fraction, Henikoff
            effective sequence count, and candidate recurrent substitutions. Candidate homoplasy is a descriptive
            flag — never proof of convergence or positive selection.
          </p>

          <textarea
            value={evoInput}
            onChange={(e) => setEvoInput(e.target.value)}
            rows={8}
            className="w-full border rounded p-2 font-mono text-sm mt-3"
            spellCheck={false}
          />
          <button
            onClick={runEvolution}
            disabled={evoLoading}
            className="bg-sky-600 text-white px-4 py-2 rounded mt-3 disabled:opacity-50"
          >
            {evoLoading ? "Analyzing..." : "Run Evolutionary Analysis"}
          </button>

          {evoError && <p className="mt-3 text-red-600 text-sm bg-red-50 p-3 rounded">{evoError}</p>}
          <LoadingState active={evoLoading} status="Computing conservation and entropy" steps={["Column frequencies", "Shannon entropy (bits)", "Henikoff weights"]} />
          {!evoResult && !evoLoading && !evoError && (
            <EmptyState title="No evolutionary analysis yet" description="Paste at least 3 aligned homologous sequences above and run the analysis. Demo input is prefilled and labelled." />
          )}

          {evoResult && evoResult.columns && (
            <div className="mt-5 space-y-5">
              <div className="border rounded p-3 bg-slate-50 text-sm">
                <p>Sequences: {evoResult.sequence_count} ({evoResult.sequence_type}) · Alignment length: {evoResult.alignment_length} · Effective sequence count (Henikoff): {evoResult.effective_sequence_count}</p>
                <p>Alignment: {evoResult.alignment.method}{evoResult.alignment.mafft_version ? ` (${evoResult.alignment.mafft_version})` : ""}</p>
                <p>Low-occupancy columns: {evoResult.summary?.flagged_low_occupancy_columns.join(", ") || "none"}</p>
                <p>Candidate recurrent substitutions: {evoResult.summary?.candidate_recurrent_count}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Conservation Heatmap</h3>
                <ConservationHeatmap sequences={evoResult.sequences} columns={evoResult.columns} selected={evoColumn} onSelect={setEvoColumn} />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Entropy Track</h3>
                <EntropyTrack columns={evoResult.columns} maxEntropy={evoResult.sequence_type === "protein" ? 4.32 : 2} selected={evoColumn} onSelect={setEvoColumn} />
              </div>

              {evoResult.candidate_homoplasy.length > 0 && (
                <div className="border rounded p-3">
                  <h3 className="font-semibold">Candidate Recurrent Substitutions</h3>
                  <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
                    {evoResult.candidate_homoplasy.map((c, i) => (
                      <li key={i}>
                        Position {c.position}: {c.residue} in {c.sequence_count} sequences (consensus {c.consensus})
                        {c.low_occupancy ? " — low occupancy ⚠" : ""}. <span className="text-slate-500">{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evoResult.tree && (
                <div>
                  <h3 className="font-semibold mb-2">Exploratory Tree <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">branch support: unavailable — bootstrap not computed</span></h3>
                  <PhyloTree newick={evoResult.tree.newick} />
                  <p className="text-xs text-slate-400">{evoResult.tree.method}</p>
                </div>
              )}

              <div className="text-sm border rounded p-3">
                <p>FastTree: <strong>unavailable</strong> — not yet verified in deployment image</p>
                <p>Positive selection inference: <strong>unavailable</strong> — never inferred from variability alone</p>
              </div>
            </div>
          )}

          {evoResult && !evoResult.columns && (
            <p className="mt-3 text-sm bg-amber-50 border border-amber-200 rounded p-3">
              Alignment: unavailable — {evoResult.unavailable.alignment} Column statistics, heatmap, and tree are
              unavailable rather than computed from an unaligned input.
            </p>
          )}
        </section>
        <section id="reference-lookup" className="pl-surface p-4 min-w-0" style={{ borderTop: "3px solid var(--accent-structure)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel accent="var(--accent-structure)">Reference &amp; Structure</SectionLabel>
            <h2 className="font-semibold text-lg">UniProt Reference Record</h2>
            <EvidenceBadge kind="CURATED_ASSERTION" />
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
              External source
            </span>
          </div>

          <p className="text-sm text-slate-500 mt-1 mb-3">
            Live reference metadata for an explicitly selected UniProt accession.
            This record provides provenance and sequence identity context; it does not
            by itself establish a variant effect.
          </p>

          <ReferenceLookup />
        </section>
        <section id="structure-context" className="pl-surface p-4 min-w-0" style={{ borderTop: "3px solid var(--accent-structure)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel accent="var(--accent-structure)">Reference &amp; Structure</SectionLabel>
            <h2 className="font-semibold text-lg">Structure Context</h2>
            <EvidenceBadge kind="COMPUTED" />
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">Explicit chain mapping required</span>
          </div>
          <p className="text-sm text-slate-500 mt-1 mb-3">
            Paste PDB text, choose the exact chain and residue number as written in the file, and compute
            heavy-atom contacts. For interactive 3D viewing with experimental vs predicted labelling, use the
            Protein Explorer on the home page — this panel computes the contact evidence behind it.
          </p>
          <StructureContextPanel />
        </section>
        <section id="hypothesis-generator" className="pl-surface p-4 xl:col-span-2" style={{ borderTop: "3px solid var(--accent-agent)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel accent="var(--accent-agent)">Hypotheses</SectionLabel>
            <h2 className="font-semibold text-lg">Scientific Hypothesis Generator</h2>
            <EvidenceBadge kind="MODEL_PREDICTION" text="Muse Spark when configured" />
            <EvidenceBadge kind="HYPOTHESIS" />
          </div>
          <div className="mt-3">
            <HypothesisAgentPanel
              findings={agentFindings}
              context="PhyloLoom investigation page. Research support only, not clinical."
              onResult={setAgentResult}
            />
          </div>
        </section>
        <section id="export" className="xl:col-span-2 pl-surface p-4 min-w-0" style={{ borderTop: "3px solid var(--accent-live)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel accent="var(--accent-live)">Export</SectionLabel>
            <h2 className="font-semibold text-lg">Reproducible Investigation Export</h2>
            <EvidenceBadge kind="COMPUTED" text="EXPORT" />
          </div>
          <div className="mt-3">
            <ReportExport sections={reportSections} />
          </div>
        </section>
      </div>
    </main>
  );
}