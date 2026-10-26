
"use client";

function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function findNewick(obj: any, depth = 0): string | null {
  if (!obj || depth > 6) return null;
  if (typeof obj === "string" && obj.trim().startsWith("(") && obj.trim().endsWith(";")) return obj;
  if (typeof obj === "object") {
    for (const v of Object.values(obj)) {
      const found = findNewick(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

export default function ExportResults({ data, input }: { data?: any, input?: string }) {
  const hasData = data !== undefined && data !== null;
  const newick = hasData ? findNewick(data) : null;
  return (
    <div>
      <p className="text-sm text-slate-500 mb-3">
        {hasData ? "Download your computed results for your report / submission." : "Run Analyze first — export buttons will activate with real data. FASTA export works anytime."}
      </p>
      <div className="flex gap-2 flex-wrap">
        <button disabled={!hasData} onClick={() => download("phyloloom-results.json", JSON.stringify(data, null, 2), "application/json")}
          className="border px-3 py-2 rounded text-sm disabled:opacity-40">Download Results (JSON)</button>
        <button disabled={!hasData} onClick={() => download("phyloloom-results.txt", JSON.stringify(data, null, 2))}
          className="border px-3 py-2 rounded text-sm disabled:opacity-40">Download Results (TXT)</button>
        <button disabled={!newick} onClick={() => newick && download("phyloloom-tree.newick", newick.replace(/:-[0-9.eE+\-]+/g, ":0"))}
          className="border px-3 py-2 rounded text-sm disabled:opacity-40">Download Tree (Newick)</button>
        <button disabled={!input} onClick={() => input && download("phyloloom-input.fasta", input)}
          className="border px-3 py-2 rounded text-sm disabled:opacity-40">Download Input (FASTA)</button>
      </div>
      {!newick && hasData && <p className="text-xs text-slate-400 mt-2">Newick export activates only when a tree was computed (3+ sequences).</p>}
    </div>
  );
}
