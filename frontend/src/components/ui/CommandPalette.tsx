"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { title: string; hint: string; href: string; keywords: string };

const ITEMS: Item[] = [
  { title: "Dashboard", hint: "Home · all tools", href: "/", keywords: "home landing dashboard start" },
  { title: "Sequence Explorer", hint: "Workspace · FASTA analysis", href: "/workspace#sequence-explorer", keywords: "fasta sequence analyze stats gc" },
  { title: "Protein Explorer", hint: "Workspace · 3D structure", href: "/workspace#protein-explorer", keywords: "protein 3d pdb alphafold structure viewer" },
  { title: "Ask AI Copilot", hint: "Workspace · Meta Muse Spark", href: "/workspace", keywords: "copilot explain ai meta muse" },
  { title: "Mutation Detective", hint: "Investigation · live variant analysis", href: "/investigate#mutation-detective", keywords: "mutation variant detective ref alt substitution" },
  { title: "HBB Demo (Glu6Val)", hint: "Investigation · labelled DEMO", href: "/investigate#mutation-detective-demo", keywords: "hbb demo e6v globin showcase" },
  { title: "Evidence Graph", hint: "Investigation · trace any conclusion", href: "/investigate#evidence-graph", keywords: "evidence graph provenance claim citation" },
  { title: "Counterfactual Lab", hint: "Investigation · all 19 alternatives", href: "/investigate#counterfactual-lab", keywords: "counterfactual 19 amino acids what if" },
  { title: "Evolutionary Anomaly Detector", hint: "Investigation · entropy & conservation", href: "/investigate#evolution", keywords: "evolution entropy conservation heatmap homoplasy tree" },
  { title: "UniProt Reference Lookup", hint: "Investigation · curated record", href: "/investigate#reference-lookup", keywords: "uniprot accession reference curated" },
  { title: "Structure Context", hint: "Investigation · PDB contacts", href: "/investigate#structure-context", keywords: "structure pdb contacts chain residue dssp" },
  { title: "Hypothesis Generator", hint: "Investigation · Muse Spark agent", href: "/investigate#hypothesis-generator", keywords: "hypothesis agent muse spark falsifiable" },
  { title: "Reproducible Export", hint: "Investigation · JSON / HTML report", href: "/investigate#export", keywords: "export report download json html reproducibility" },
  { title: "Methods & Limitations", hint: "Documentation", href: "/methods", keywords: "methods limitations privacy assumptions documentation" },
];

function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter((i) => `${i.title} ${i.hint} ${i.keywords}`.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setHelp(false);
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        setHelp(false);
        return;
      }
      if (e.key === "?" && !isTypingTarget(e) && !open) {
        e.preventDefault();
        setHelp((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open ]);

  useEffect(() => { setIndex(0); }, [query]);

  function go(item: Item | undefined) {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]"
          style={{ background: "rgba(8,12,24,.45)", backdropFilter: "blur(8px)" }}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="pl-panel-in w-full max-w-xl pl-surface overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, filtered.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
                if (e.key === "Enter") { e.preventDefault(); go(filtered[index]); }
              }}
              placeholder="Jump to a tool…  (↑ ↓ Enter, Esc to close)"
              aria-label="Search tools"
              className="w-full px-5 py-4 text-base outline-none"
              style={{ background: "var(--surface)", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}
            />
            <ul className="max-h-[46vh] overflow-auto py-2" role="listbox" aria-label="Tools">
              {filtered.map((item, i) => (
                <li key={item.title}>
                  <button
                    type="button"
                    onClick={() => go(item)}
                    onMouseEnter={() => setIndex(i)}
                    aria-selected={i === index}
                    className="w-full text-left px-5 py-3 min-h-[44px] flex items-baseline justify-between gap-3"
                    style={{ background: i === index ? "var(--surface-3)" : "transparent" }}
                  >
                    <span className="font-bold">{item.title}</span>
                    <span className="text-xs pl-ink-faint text-right">{item.hint}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-5 py-4 text-sm pl-ink-soft">No tool matches “{query}”.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {help && !open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          style={{ background: "rgba(8,12,24,.45)", backdropFilter: "blur(8px)" }}
          onClick={() => setHelp(false)}
          role="presentation"
        >
          <div
            className="pl-panel-in w-full max-w-md pl-surface p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-black text-lg">Keyboard shortcuts</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between gap-4"><span>Open command palette</span><kbd className="font-mono font-bold">Ctrl / ⌘ + K</kbd></li>
              <li className="flex justify-between gap-4"><span>This shortcut overlay</span><kbd className="font-mono font-bold">?</kbd></li>
              <li className="flex justify-between gap-4"><span>Close palette / overlay / tooltip</span><kbd className="font-mono font-bold">Esc</kbd></li>
              <li className="flex justify-between gap-4"><span>Navigate palette results</span><kbd className="font-mono font-bold">↑ ↓ + Enter</kbd></li>
              <li className="flex justify-between gap-4"><span>Move through controls</span><kbd className="font-mono font-bold">Tab / Shift+Tab</kbd></li>
            </ul>
            <button
              onClick={() => setHelp(false)}
              className="inline-flex items-center min-h-[44px] px-5 rounded-full font-bold text-white mt-5"
              style={{ background: "var(--accent)" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}