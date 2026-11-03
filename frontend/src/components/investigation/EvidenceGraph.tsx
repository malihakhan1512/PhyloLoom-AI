"use client";
import { useMemo, useState } from "react";

export type GraphNode = {
  id: string;
  type: string;
  label: string;
  classification: string;
  provenance?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

export type GraphEdge = {
  source: string;
  target: string;
  type: string;
  provenance?: Record<string, unknown>;
};

export type EvidenceGraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  schema_version: string;
};

const CLASS_STYLE: Record<string, string> = {
  COMPUTED: "fill-emerald-100 stroke-emerald-700",
  MODEL_PREDICTION: "fill-violet-100 stroke-violet-700",
  CURATED_ASSERTION: "fill-blue-100 stroke-blue-700",
  LITERATURE: "fill-cyan-100 stroke-cyan-700",
  HYPOTHESIS: "fill-amber-100 stroke-amber-700",
  DEMO: "fill-orange-100 stroke-orange-700",
};

const COL_X: Record<string, number> = {
  Sequence: 90,
  Variant: 225,
  AnalysisArtifact: 365,
  EvidenceItem: 505,
  Claim: 650,
  Hypothesis: 650,
  TestRun: 505,
  Report: 650,
};

function shortLabel(s: string, n = 22) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default function EvidenceGraph({ graph }: { graph: EvidenceGraphData }) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  const positioned = useMemo(() => {
    const counts: Record<string, number> = {};
    return graph.nodes.map((node) => {
      const col = node.type;
      const idx = counts[col] ?? 0;
      counts[col] = idx + 1;
      return {
        node,
        x: COL_X[col] ?? 365,
        y: 70 + idx * 105,
      };
    });
  }, [graph]);

  const byId = useMemo(() => {
    const m = new Map<string, { node: GraphNode; x: number; y: number }>();
    positioned.forEach((p) => m.set(p.node.id, p));
    return m;
  }, [positioned]);

  const height = Math.max(260, 70 + Math.max(...Object.values(
    graph.nodes.reduce<Record<string, number>>((acc, n) => {
      acc[n.type] = (acc[n.type] ?? 0) + 1;
      return acc;
    }, {})
  ), 1) * 105);

  function downloadJson() {
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "phyloloom-evidence-graph.json";
    a.click();
  }

  const activeProvenance = selectedNode?.provenance ?? selectedEdge?.provenance ?? null;
  const activeTitle = selectedNode
    ? `${selectedNode.type}: ${selectedNode.label}`
    : selectedEdge
      ? `Edge: ${selectedEdge.source} —${selectedEdge.type}→ ${selectedEdge.target}`
      : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
        <span className="font-semibold">Legend:</span>
        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">COMPUTED</span>
        <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800">DEMO</span>
        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">HYPOTHESIS</span>
        <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800">MODEL_PREDICTION</span>
        <span className="text-slate-500">Green solid = supports · Red dashed = contradicts · Grey = derived_from / other</span>
        <button onClick={downloadJson} className="ml-auto border px-2 py-1 rounded">Download graph JSON</button>
      </div>

      <svg viewBox={`0 0 740 ${height}`} className="w-full border rounded bg-white" role="img" aria-label="Evidence graph">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
        </defs>

        {graph.edges.map((edge, i) => {
          const s = byId.get(edge.source);
          const t = byId.get(edge.target);
          if (!s || !t) return null;
          const isSupport = edge.type === "supports";
          const isContra = edge.type === "contradicts";
          return (
            <g key={i}>
              <line
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke="transparent" strokeWidth={14}
                style={{ cursor: "pointer" }}
                onClick={() => { setSelectedEdge(edge); setSelectedNode(null); }}
              >
                <title>{`${edge.source} ${edge.type} ${edge.target}`}</title>
              </line>
              <line
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke={isSupport ? "#059669" : isContra ? "#dc2626" : "#94a3b8"}
                strokeWidth={isSupport || isContra ? 2.5 : 1.5}
                strokeDasharray={isContra ? "6 4" : undefined}
                markerEnd="url(#arr)"
                pointerEvents="none"
              />
              <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 4} fontSize={9} fill="#475569" textAnchor="middle">
                {edge.type}
              </text>
            </g>
          );
        })}

        {positioned.map(({ node, x, y }) => (
          <g
            key={node.id}
            transform={`translate(${x - 62}, ${y - 26})`}
            onClick={() => { setSelectedNode(node); setSelectedEdge(null); }}
            style={{ cursor: "pointer" }}
            role="button"
            aria-label={`${node.type} ${node.label}`}
          >
            <rect
              width={124} height={52} rx={8}
              className={CLASS_STYLE[node.classification] ?? "fill-slate-100 stroke-slate-500"}
              strokeWidth={selectedNode?.id === node.id ? 3 : 1.5}
            />
            <text x={62} y={18} textAnchor="middle" fontSize={10} fontWeight={700}>
              {node.type}
            </text>
            <text x={62} y={32} textAnchor="middle" fontSize={8} fill="#334155">
              [{node.classification}]
            </text>
            <text x={62} y={45} textAnchor="middle" fontSize={8} fill="#475569">
              {shortLabel(node.label)}
            </text>
            <title>{node.label}</title>
          </g>
        ))}
      </svg>

      <div className="flex flex-wrap gap-1 mt-2">
        {graph.nodes.map((n) => (
          <button
            key={n.id}
            onClick={() => { setSelectedNode(n); setSelectedEdge(null); }}
            className="text-xs border px-2 py-1 rounded"
          >
            {n.type}: {shortLabel(n.label, 30)}
          </button>
        ))}
      </div>

      {(selectedNode || selectedEdge) && (
        <div className="mt-3 border rounded p-3 bg-slate-50 text-sm">
          <p className="font-semibold">{activeTitle}</p>
          {selectedNode && (
            <>
              <p className="text-xs mt-1">
                Classification: <strong>{selectedNode.classification}</strong> · ID: <code>{selectedNode.id}</code>
              </p>
              <p className="mt-2">{selectedNode.label}</p>
              {selectedNode.data && Object.keys(selectedNode.data).length > 0 && (
                <pre className="mt-2 text-xs bg-white border rounded p-2 overflow-auto max-h-48">{JSON.stringify(selectedNode.data, null, 2)}</pre>
              )}
            </>
          )}
          <p className="text-xs font-semibold mt-3">Provenance</p>
          {activeProvenance && Object.keys(activeProvenance).length > 0 ? (
            <pre className="mt-1 text-xs bg-white border rounded p-2 overflow-auto max-h-48">{JSON.stringify(activeProvenance, null, 2)}</pre>
          ) : (
            <p className="text-xs text-slate-500 mt-1">Provenance: unavailable for this element — not hidden, explicitly missing.</p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-2">
        Method: typed evidence graph ({graph.schema_version}). Click any node or edge for provenance.
        Missing provenance is shown as unavailable, never invented.
      </p>
    </div>
  );
}