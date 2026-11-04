"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
import LoadingState from "@/components/ui/LoadingState";

type UniprotResult = {
  status: "available" | "unavailable";
  accession: string;
  id?: string;
  length?: number;
  sequence_sha256?: string;
  source?: string;
  source_url?: string;
  classification: string;
  retrieved_at?: string;
  reason?: string;
  note?: string;
};

export default function ReferenceLookup() {
  const [accession, setAccession] = useState("P68871");
  const [result, setResult] = useState<UniprotResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookup() {
    const cleanAccession = accession.trim();

    if (!cleanAccession) {
      setError("Enter a UniProt accession.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const r = await fetch(
        `${API}/api/investigation/reference/uniprot/${encodeURIComponent(cleanAccession)}`
      );
      const body = await r.json();

      if (!r.ok) {
        throw new Error(body.detail || "UniProt lookup failed");
      }

      setResult(body);
    } catch (e: any) {
      setError(e.message || "UniProt lookup failed");
    }

    setLoading(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
          CURATED_ASSERTION
        </span>
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
          Live external reference lookup
        </span>
      </div>

      <p className="text-sm text-slate-500 mb-3">
        Retrieve a UniProtKB reference record by accession. PhyloLoom displays the
        source, retrieval time, record length, and sequence checksum. The raw
        sequence is not echoed by this endpoint.
      </p>

      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm">
          UniProt accession
          <input
            value={accession}
            onChange={(e) => setAccession(e.target.value.toUpperCase())}
            className="block border rounded px-3 py-2 font-mono mt-1"
            placeholder="P68871"
          />
        </label>

        <button
          onClick={lookup}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Retrieving..." : "Retrieve Reference"}
        </button>
      </div>

      <LoadingState active={loading} status="Fetching UniProt record" />

      {error && (
        <p className="mt-3 text-red-600 text-sm bg-red-50 p-3 rounded">
          {error}
        </p>
      )}

      {result?.status === "available" && (
        <div className="mt-4 border rounded p-3 bg-slate-50 text-sm">
          <p>
            <strong>Status:</strong> available
          </p>
          <p>
            <strong>Accession:</strong> {result.accession}
          </p>
          <p>
            <strong>UniProt ID:</strong> {result.id}
          </p>
          <p>
            <strong>Sequence length:</strong> {result.length} residues
          </p>
          <p>
            <strong>Classification:</strong> {result.classification}
          </p>
          <p>
            <strong>Source:</strong> {result.source}
          </p>
          <p>
            <strong>Retrieved at:</strong> {result.retrieved_at}
          </p>
          <p className="break-all">
            <strong>Sequence SHA-256:</strong>
            <code className="block mt-1 text-xs">{result.sequence_sha256}</code>
          </p>
          {result.source_url && (
            <p className="mt-2">
              <a
                href={result.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 underline"
              >
                Open UniProt source record
              </a>
            </p>
          )}
          <p className="text-xs text-slate-500 mt-2">{result.note}</p>
        </div>
      )}

      {result?.status === "unavailable" && (
        <div className="mt-4 border border-amber-200 bg-amber-50 rounded p-3 text-sm">
          <p>
            <strong>UniProt record unavailable</strong>
          </p>
          <p>{result.reason}</p>
          <p className="mt-1">
            No record was invented or substituted.
          </p>
        </div>
      )}
    </div>
  );
}