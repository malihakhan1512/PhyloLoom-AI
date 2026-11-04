"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ReportExport({ sections }: { sections: Record<string, unknown> }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function fetchBundle(): Promise<Record<string, unknown>> {
    const r = await fetch(`${API}/api/investigation/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "PhyloLoom Investigation Report", sections }),
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body.detail || "Report generation failed");
    return body;
  }

  async function downloadJson() {
    setError("");
    setBusy(true);
    try {
      const bundle = await fetchBundle();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "phyloloom-investigation-report.json";
      a.click();
    } catch (e: any) {
      setError(e.message || "JSON export failed");
    }
    setBusy(false);
  }

  async function downloadHtml() {
    setError("");
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/investigation/report/html`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "PhyloLoom Investigation Report", sections }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.detail || "HTML report generation failed");
      }
      const blob = new Blob([await r.text()], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "phyloloom-investigation-report.html";
      a.click();
    } catch (e: any) {
      setError(e.message || "HTML export failed");
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Session-only export</span>
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Nothing is stored server-side</span>
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Includes limitations + unavailable analyses</span>
      </div>

      <p className="text-sm text-slate-500">
        Exports the investigation currently on this page: demo evidence, live mutation results, evolutionary
        results, hypothesis cards, and their provenance where available. Sections not yet run are recorded as
        unavailable in the bundle rather than omitted silently.
      </p>

      <div className="flex gap-2 mt-3">
        <button onClick={downloadJson} disabled={busy} className="pl-btn pl-btn-teal">
          {busy ? "Preparing..." : "Download Report JSON"}
        </button>
        <button onClick={downloadHtml} disabled={busy} className="pl-btn pl-btn-lav">
          Download HTML Report
        </button>
      </div>

      {error && <p className="mt-3 text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}
    </div>
  );
}