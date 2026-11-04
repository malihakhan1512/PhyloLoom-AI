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
  Sequence: 105,
  Variant: 285,
  AnalysisArtifact: 465,
  EvidenceItem: 645,
  Claim: 835,
  Hypothesis: 835,
  TestRun: 645,
  Report: 835,
};

const NODE_W = 148;
const NODE_H = 64;

function shortLabel(s: string, n = 28) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function edgeColor(type: string) {
  if (type === "supports") return "#059669";
  if (type === "contradicts") return "#dc2626";
  return "#94a3b8";
}

function edgePath(
  s: { x: number; y: number },
  t: { x: number; y: number }
) {
  const sx = s.x + NODE_W / 2;
  const tx = t.x - NODE_W / 2;

  // Same-column or backwards edges: route below the nodes instead of through them.
  if (tx <= sx) {
    const midY = Math.max(s.y, t.y) + 78;
    return {
      d: `M ${s.x} ${s.y + NODE_H / 2} C ${s.x - 40} ${midY}, ${t.x + 40} ${midY}, ${t.x} ${t.y + NODE_H / 2}`,
      labelX: (s.x + t.x) / 2,
      labelY: midY - 8,
    };
  }

  const midX = (sx + tx) / 2;
  return {
    d: `M ${sx} ${s.y} C ${midX} ${s.y}, ${midX} ${t.y}, ${tx} ${t.y}`,
    labelX: midX,
    labelY: (s.y + t.y) / 2 - 10,
  };
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
        x: COL_X[col] ?? 465,
        y: 72 + idx * 112,
      };
    });
  }, [graph]);

  const byId = useMemo(() => {
    const m = new Map<string, { node: GraphNode; x: number; y: number }>();
    positioned.forEach((p) => m.set(p.node.id, p));
    return m;
  }, [positioned]);

  const maxRows = Math.max(
    1,
    ...Object.values(
      graph.nodes.reduce<Record<string, number>>((acc, n) => {
        acc[n.type] = (acc[n.type] ?? 0) + 1;
        return acc;
      }, {})
    )
  );

  const height = Math.max(250, 84 + maxRows * 112);

  function downloadJson() {
    const blob = new Blob([JSON.stringify(graph, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "phyloloom-evidence-graph.json";
    a.click();
  }

  const activeProvenance =
    selectedNode?.provenance ?? selectedEdge?.provenance ?? null;

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
        <span className="pl-ink-faint">
          Green solid = supports · Red dashed = contradicts · Grey curved = derived_from / other
        </span>
        <button onClick={downloadJson} className="pl-btn pl-btn-ghost pl-btn-sm ml-auto">
          Download graph JSON
        </button>
      </div>

      <div className="overflow-x-auto border rounded bg-white">
        <svg
          viewBox={`0 0 940 ${height}`}
          className="w-full min-w-[820px]"
          role="img"
          aria-label="Evidence graph"
        >
          <defs>
            <marker
              id="pl-arr"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
          </defs>

          {graph.edges.map((edge, i) => {
            const s = byId.get(edge.source);
            const t = byId.get(edge.target);
            if (!s || !t) return null;

            const path = edgePath(s, t);
            const isContra = edge.type === "contradicts";

            return (
              <g key={i}>
                <path
                  d={path.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={18}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSelectedEdge(edge);
                    setSelectedNode(null);
                  }}
                >
                  <title>{`${edge.source} ${edge.type} ${edge.target}`}</title>
                </path>

                <path
                  d={path.d}
                  fill="none"
                  stroke={edgeColor(edge.type)}
                  strokeWidth={edge.type === "supports" || isContra ? 2.6 : 1.8}
                  strokeDasharray={isContra ? "6 4" : undefined}
                  markerEnd="url(#pl-arr)"
                  pointerEvents="none"
                />

                <text
                  x={path.labelX}
                  y={path.labelY}
                  fontSize={10}
                  fontWeight={700}
                  fill="#334155"
                  textAnchor="middle"
                  pointerEvents="none"
                  style={{
                    paintOrder: "stroke",
                    stroke: "#ffffff",
                    strokeWidth: 5,
                    strokeLinejoin: "round",
                  }}
                >
                  {edge.type}
                </text>
              </g>
            );
          })}

          {positioned.map(({ node, x, y }) => (
            <g
              key={node.id}
              transform={`translate(${x - NODE_W / 2}, ${y - NODE_H / 2})`}
              onClick={() => {
                setSelectedNode(node);
                setSelectedEdge(null);
              }}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label={`${node.type} ${node.label}`}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={10}
                className={CLASS_STYLE[node.classification] ?? "fill-slate-100 stroke-slate-500"}
                strokeWidth={selectedNode?.id === node.id ? 3.2 : 1.6}
              />
              <text x={NODE_W / 2} y={21} textAnchor="middle" fontSize={11} fontWeight={800} fill="#0f172a">
                {node.type}
              </text>
              <text x={NODE_W / 2} y={37} textAnchor="middle" fontSize={8.5} fill="#334155">
                [{node.classification}]
              </text>
              <text x={NODE_W / 2} y={53} textAnchor="middle" fontSize={8.5} fill="#475569">
                {shortLabel(node.label)}
              </text>
              <title>{node.label}</title>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {graph.nodes.map((n) => (
          <button title={n.label} key={n.id} onClick={() => { setSelectedNode(n);
              setSelectedEdge(null);
            }}
            className="pl-btn pl-btn-teal pl-btn-sm pl-evidence-node-btn"
          >
            {n.type} · {n.classification}
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

              {selectedNode.data && Object.keys(selectedNode.data).length > 0 && (
                <pre className="mt-2 text-xs bg-white border rounded p-2 overflow-auto max-h-56">
                  {JSON.stringify(selectedNode.data, null, 2)}
                </pre>
              )}
            </>
          )}

          <p className="text-xs font-semibold mt-3">Provenance</p>

          {activeProvenance && Object.keys(activeProvenance).length > 0 ? (
            <pre className="mt-1 text-xs bg-white border rounded p-2 overflow-auto max-h-56">
              {JSON.stringify(activeProvenance, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Provenance: unavailable for this element — not hidden, explicitly missing.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-2">
        Method: typed evidence graph ({graph.schema_version}). Click any node or edge for provenance.
        Edge labels are offset above the connector so node labels remain readable.
      </p>
    </div>
  );
}