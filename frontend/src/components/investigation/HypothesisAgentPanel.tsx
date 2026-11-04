"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
import LoadingState from "@/components/ui/LoadingState";

export type AgentFinding = { id: string; classification: string; summary: string; caveats?: string[] };

type AgentResult = {
  status: string;
  reason?: string;
  provider?: string;
  is_mock?: boolean;
  model?: string | null;
  prompt_version?: string;
  response_sha256?: string;
  generated_at?: string;
  output?: {
    observations: { text: string; citation_ids: string[] }[];
    hypotheses: { text: string; citation_ids: string[] }[];
    alternatives: string[];
    proposed_tests: string[];
    missing_evidence: string[];
    citations: string[];
    summary: string;
  };
  uncited_suggestions?: { text: string; reason: string }[];
  note?: string;
};

export default function HypothesisAgentPanel({
  findings, context, onResult,
}: {
  findings: AgentFinding[];
  context: string;
  onResult?: (r: AgentResult) => void;
}) {
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await fetch(`${API}/api/investigation/agent/hypotheses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle: { findings, context } }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.detail || "Hypothesis agent failed");
      setResult(body);
      onResult?.(body);
    } catch (e: any) {
      setError(e.message || "Hypothesis agent failed");
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">HYPOTHESIS</span>
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">EvidenceBundle only — no raw sequences sent</span>
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Citations validated server-side</span>
      </div>

      <p className="text-sm text-slate-500">
        Sends the EvidenceBundle below ({findings.length} finding{findings.length === 1 ? "" : "s"}) to the configured
        AI provider and validates every citation. Uncited model statements are demoted to suggestions, never
        shown as evidence. Proposed tests are recorded, not executed, until a user approves them.
      </p>

      <ul className="text-xs font-mono mt-2 space-y-1">
        {findings.map((f) => (
          <li key={f.id} className="border rounded px-2 py-1 bg-slate-50">
            {f.id} [{f.classification}] — {f.summary}
          </li>
        ))}
      </ul>

      <button onClick={run} disabled={loading || findings.length === 0} className="pl-btn pl-btn-lav mt-3">
        {loading ? "Generating..." : "Generate AI Hypothesis Proposal"}
      </button>
      {findings.length === 0 && <p className="text-xs text-amber-700 mt-2">No findings available yet — run an investigation first.</p>}

      {error && <p className="mt-3 text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}
      <LoadingState active={loading} status="Asking Muse Spark for cited hypotheses" steps={["Sending EvidenceBundle (no raw sequences)", "Validating citations server-side"]} />

      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            Status: <strong>{result.status}</strong>
            {result.provider && <> · Provider: <strong>{result.provider}</strong>{result.is_mock ? " (MOCK)" : ""}</>}
            {result.model && <> · Model: <code>{result.model}</code></>}
          </p>
          {result.reason && <p className="text-sm bg-amber-50 border border-amber-200 rounded p-3">{result.reason}</p>}

          {result.output && (
            <>
              {result.output.observations.length > 0 && (
                <div className="border rounded p-3">
                  <h4 className="font-semibold text-sm">Observations (evidence-linked)</h4>
                  <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                    {result.output.observations.map((o, i) => (
                      <li key={i}>{o.text} <span className="text-xs text-slate-500">[{o.citation_ids.join(", ")}]</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {result.output.hypotheses.length > 0 && (
                <div className="border rounded p-3 bg-amber-50">
                  <h4 className="font-semibold text-sm">Hypotheses (untested)</h4>
                  <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                    {result.output.hypotheses.map((h, i) => (
                      <li key={i}>{h.text} <span className="text-xs text-slate-500">[{h.citation_ids.join(", ")}]</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {result.output.alternatives.length > 0 && (
                <p className="text-sm"><strong>Alternatives:</strong> {result.output.alternatives.join(" · ")}</p>
              )}
              {result.output.proposed_tests.length > 0 && (
                <p className="text-sm"><strong>Proposed tests (not executed):</strong> {result.output.proposed_tests.join(" · ")}</p>
              )}
              {result.output.missing_evidence.length > 0 && (
                <p className="text-sm"><strong>Missing evidence:</strong> {result.output.missing_evidence.join(" · ")}</p>
              )}
              {result.output.summary && <p className="text-sm"><strong>Summary:</strong> {result.output.summary}</p>}
            </>
          )}

          {result.uncited_suggestions && result.uncited_suggestions.length > 0 && (
            <div className="border-2 border-dashed border-amber-400 rounded p-3">
              <h4 className="font-semibold text-sm text-amber-800">Uncited suggestions — NOT evidence</h4>
              <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                {result.uncited_suggestions.map((u, i) => (
                  <li key={i}>{u.text} <span className="text-xs text-amber-700">({u.reason})</span></li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-400">
            {result.prompt_version && <>Prompt: {result.prompt_version} · </>}
            {result.generated_at && <>Generated: {result.generated_at} · </>}
            {result.response_sha256 && <>Response SHA-256: {result.response_sha256.slice(0, 16)}…</>}
          </p>
          {result.note && <p className="text-xs text-slate-500">{result.note}</p>}
        </div>
      )}
    </div>
  );
}