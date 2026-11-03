"use client";
import { useEffect, useState } from "react";
import EvidenceGraph, { EvidenceGraphData } from "@/components/investigation/EvidenceGraph";

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

export default function InvestigatePage() {
  const [data, setData] = useState<DemoResponse | null>(null);
  const [error, setError] = useState("");

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
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="border-b px-6 py-4 flex justify-between items-center">
        <div>
          <a href="/" className="text-2xl font-bold text-teal-700">PhyloLoom AI</a>
          <p className="text-sm text-slate-500">Biological Investigation Engine</p>
        </div>
        <a href="/methods" className="text-sm text-teal-700 underline">Methods &amp; Limitations</a>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="border-2 border-orange-300 bg-orange-50 rounded-xl p-4">
          <p className="font-bold text-orange-800">DEMO — labelled demonstration data</p>
          <p className="text-sm text-orange-700">
            HBB / P68871 beta-globin showcase. This is not a user analysis and is never blended with live results.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}
        {!data && !error && <p className="text-sm text-slate-400">Loading investigation…</p>}

        {data && (
          <>
            <section className="border rounded-xl p-4">
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

            <section className="border rounded-xl p-4">
              <h2 className="font-semibold">Physicochemical Evidence <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">COMPUTED</span></h2>
              <table className="text-sm mt-3 w-full max-w-xl">
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

            <section className="border rounded-xl p-4">
              <h2 className="font-semibold mb-3">Evidence Graph — click any conclusion to trace it</h2>
              <EvidenceGraph graph={data.graph} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}