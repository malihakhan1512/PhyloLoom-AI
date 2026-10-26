import pathlib
ROOT = pathlib.Path(".")

# --- New file: interactive SVG phylogenetic tree component ---
comp_dir = ROOT / "frontend/src/components"
comp_dir.mkdir(parents=True, exist_ok=True)
(comp_dir / "PhyloTree.tsx").write_text(r'''
"use client";
import { useState } from "react";

type Node = { name: string; length: number; children: Node[] };

function parseNewick(s: string): Node {
  let i = 0;
  function parseNode(): Node {
    const node: Node = { name: "", length: 0, children: [] };
    if (s[i] === "(") {
      i++;
      while (true) {
        node.children.push(parseNode());
        if (s[i] === ",") { i++; continue; }
        if (s[i] === ")") { i++; break; }
        break;
      }
    }
    let name = "";
    while (i < s.length && !":,();".includes(s[i])) { name += s[i]; i++; }
    node.name = name.trim();
    if (s[i] === ":") {
      i++; let num = "";
      while (i < s.length && !" ,();".includes(s[i])) { num += s[i]; i++; }
      node.length = Math.max(0, parseFloat(num) || 0); // clamp NJ floating-point noise (e.g. 1e-17) to 0
    }
    return node;
  }
  return parseNode();
}

function maxDepth(n: Node): number {
  if (!n.children.length) return n.length;
  return n.length + Math.max(...n.children.map(maxDepth));
}
function countLeaves(n: Node): number {
  return n.children.length ? n.children.reduce((a, c) => a + countLeaves(c), 0) : 1;
}

export default function PhyloTree({ newick }: { newick: string }) {
  const [hover, setHover] = useState<string | null>(null);
  let root: Node;
  try { root = parseNewick(newick); } catch { return <p className="text-sm text-red-600">Could not parse tree.</p>; }

  const W = 520, leafH = 34, padL = 10, padR = 110, padT = 14;
  const leaves = countLeaves(root);
  const H = leaves * leafH + padT * 2;
  const totalDepth = maxDepth(root) || 1;
  const scaleX = (W - padL - padR) / totalDepth;

  const lines: React.ReactNode[] = []; const labels: React.ReactNode[] = [];
  let leafIdx = 0;
  function layout(n: Node, x: number): number {
    const myX = x + n.length * scaleX;
    let y: number;
    if (!n.children.length) { y = padT + leafIdx * leafH + leafH / 2; leafIdx++; }
    else {
      const ys = n.children.map(c => {
        const cy = layout(c, myX);
        const cx = myX + c.length * scaleX;
        lines.push(<line key={`h${lines.length}`} x1={myX} y1={cy} x2={cx} y2={cy} stroke="#94a3b8" strokeWidth={1.5} />);
        return cy;
      });
      y = (ys[0] + ys[ys.length - 1]) / 2;
      lines.push(<line key={`v${lines.length}`} x1={myX} y1={ys[0]} x2={myX} y2={ys[ys.length - 1]} stroke="#94a3b8" strokeWidth={1.5} />);
    }
    if (!n.children.length) {
      labels.push(
        <g key={`l${labels.length}`} onMouseEnter={() => setHover(n.name)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
          <circle cx={myX} cy={y} r={hover === n.name ? 6 : 4} fill={hover === n.name ? "#0d9488" : "#14b8a6"} />
          <text x={myX + 9} y={y + 4} fontSize={13} fontFamily="monospace" fontWeight={hover === n.name ? 700 : 400}>{n.name}</text>
          <text x={myX + 9} y={y + 18} fontSize={10} fill="#94a3b8">branch: {n.length.toFixed(3)}</text>
        </g>);
    } else if (n.name && n.name !== "Root") {
      labels.push(<text key={`l${labels.length}`} x={myX - 4} y={y - 5} fontSize={10} fill="#94a3b8" textAnchor="end">{n.name}</text>);
    }
    return y;
  }
  layout(root, padL);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full border rounded bg-white" role="img" aria-label="Phylogenetic tree">
        {lines}{labels}
        {/* scale bar: 0.05 substitutions per site */}
        <line x1={padL} y1={H - 8} x2={padL + 0.05 * scaleX} y2={H - 8} stroke="#0f172a" strokeWidth={2} />
        <text x={padL} y={H - 12} fontSize={9} fill="#475569">0.05</text>
      </svg>
      <p className="text-xs text-slate-400 mt-1">Hover a tip for branch length. Scale bar = substitutions per site (p-distance). Exploratory NJ tree — not a definitive evolutionary history.</p>
    </div>
  );
}
''', encoding="utf-8")
print("PhyloTree.tsx written")

# --- Patch page.tsx to use it ---
page = ROOT / "frontend/src/app/page.tsx"
t = page.read_text(encoding="utf-8")
if "PhyloTree" not in t:
    t = t.replace('import { useState } from "react";',
                  'import { useState } from "react";\nimport PhyloTree from "@/components/PhyloTree";')
    t = t.replace('<p className="text-xs font-mono bg-slate-50 p-2 rounded mt-2 break-all">Newick: {result.phylogeny.newick}</p>',
                  '<div className="mt-3"><PhyloTree newick={result.phylogeny.newick} /></div>\n'
                  '              <details className="mt-2"><summary className="text-xs text-slate-500 cursor-pointer">Raw Newick (for reproducibility / download)</summary>'
                  '<p className="text-xs font-mono bg-slate-50 p-2 rounded mt-1 break-all">{result.phylogeny.newick}</p></details>')
    page.write_text(t, encoding="utf-8")
    print("page.tsx patched")
else:
    print("already patched")