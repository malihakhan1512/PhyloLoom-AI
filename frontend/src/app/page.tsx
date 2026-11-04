"use client";
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import HeroScientist from "@/components/ui/HeroScientist";
import ProteinMascot, { type MascotKind } from "@/components/landing/ProteinMascot";
import ThemeToggle from "@/components/ui/ThemeToggle";
import EvidenceBadge from "@/components/ui/EvidenceBadge";

const COPYRIGHT_YEAR = 2026;
const TITLE = "PhyloLoom AI";

const SAYINGS = [
  "Hi! Let me check your sequence…",
  "Every conclusion cites its evidence.",
  "Mature chain 6 is not precursor 7. I checked.",
  "If it wasn't computed, I'll say unavailable.",
];

const PASTELS = [
  ["var(--land-mint)", "var(--land-mint-d)"],
  ["var(--land-lav)", "var(--land-lav-d)"],
  ["var(--land-sky)", "var(--land-sky-d)"],
  ["var(--land-coral)", "var(--land-coral-d)"],
] as const;

const TOOLS = [
  {
    icon: "🧬",
    title: "Sequence Explorer",
    href: "/workspace",
    text: "Paste or upload FASTA, validate DNA, RNA, or protein sequences, and compute documented statistics live.",
  },
  {
    icon: "🧪",
    title: "Protein Explorer",
    href: "/workspace#protein-explorer",
    text: "View experimental and AlphaFold-predicted 3D structures with provenance labels and pLDDT where available.",
  },
  {
    icon: "🔎",
    title: "Mutation Detective",
    href: "/investigate#mutation-detective",
    text: "Compare reference and alternate proteins, detect observed changes, and inspect descriptor evidence — no clinical claims.",
  },
  {
    icon: "🕸️",
    title: "Evidence Graph",
    href: "/investigate#evidence-graph",
    text: "Click any conclusion and trace it to its evidence, method, parameters, checksum, and source.",
  },
  {
    icon: "🧭",
    title: "Counterfactual Lab",
    href: "/investigate#counterfactual-lab",
    text: "Enumerate all 19 alternative amino acids at a residue. Missing scores stay unavailable — never zero.",
  },
  {
    icon: "🌿",
    title: "Evolutionary Anomaly Detector",
    href: "/investigate#evolution",
    text: "Entropy, normalized conservation, gap fraction, Henikoff effective counts, and candidate recurrent substitutions.",
  },
  {
    icon: "🏗️",
    title: "Structure Context",
    href: "/investigate#structure-context",
    text: "Map an exact PDB chain and residue, then compute heavy-atom contacts at an explicit 4.5–5.0 Å cutoff.",
  },
  {
    icon: "💡",
    title: "Hypothesis Generator",
    href: "/investigate#hypothesis-generator",
    text: "Muse Spark proposes falsifiable hypotheses from an EvidenceBundle. Uncited claims are demoted to suggestions.",
  },
  {
    icon: "📚",
    title: "UniProt Reference Lookup",
    href: "/investigate#reference-lookup",
    text: "Retrieve a live UniProtKB record by accession, with source URL, retrieval time, length, and sequence checksum.",
  },
  {
    icon: "📏",
    title: "Methods & Limitations",
    href: "/methods",
    text: "Assumptions, coordinate rules, privacy model, and limits — documented before you trust any result, including ours.",
  },
];

const CREW: { kind: MascotKind; name: string; role: string; quote: string }[] = [
  {
    kind: "blob",
    name: "Pip",
    role: "Sequence + Protein Explorer",
    quote: "I compute statistics and show structures with provenance.",
  },
  {
    kind: "cloud",
    name: "Coil",
    role: "Mutation Detective + Anomaly Detector",
    quote: "One changed residue? Odd column? I'll flag it — with evidence.",
  },
  {
    kind: "hex",
    name: "Zig",
    role: "Counterfactual Lab + Hypothesis Generator",
    quote: "What if? Let's enumerate all 19 and write down a testable idea.",
  },
];

const SECTION_SAYS: Record<string, string> = {
  about: "Pip: Welcome to the lab bench!",
  tools: "Pip: Ten tools, pick one!",
  crew: "Pip: Say hi to the crew!",
  start: "Pip: Ready when you are!",
};

export default function DashboardPage() {
  const [sayIndex, setSayIndex] = useState(0);
  const [hopKind, setHopKind] = useState<MascotKind | null>(null);
  const [buddyOn, setBuddyOn] = useState(false);
  const [buddyDismissed, setBuddyDismissed] = useState(false);
  const [buddySay, setBuddySay] = useState(SECTION_SAYS.about);

  function pokeMascot(kind: MascotKind) {
    setSayIndex((i) => (i + 1) % SAYINGS.length);
    setHopKind(kind);
    window.setTimeout(() => setHopKind(null), 750);
  }

  useEffect(() => {
    function onScroll() {
      setBuddyOn(window.scrollY > window.innerHeight * 0.5);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const msg = SECTION_SAYS[(e.target as HTMLElement).id];
            if (msg) setBuddySay(msg);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    Object.keys(SECTION_SAYS).forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <main className="pl-land relative min-h-screen font-sans overflow-x-clip">
      

      {/* ---------- Header ---------- */}
      <header
        className="sticky top-0 z-20 px-6 py-3"
        style={{
          background: "color-mix(in srgb, var(--land-paper) 84%, transparent)",
          backdropFilter: "blur(12px)",
          borderBottom: "2px solid var(--land-mint)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <Link href="/" className="text-2xl font-black tracking-tight" style={{ color: "var(--land-ink)" }}>
            PhyloLoom <span style={{ color: "var(--land-lav-d)" }}>AI</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 flex-wrap" aria-label="Main">
            <a href="#about" className="inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-bold hover:underline">
              What it does
            </a>
            <a href="#tools" className="inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-bold hover:underline">
              Tools
            </a>
            <a href="#crew" className="inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-bold hover:underline">
              Helpers
            </a>
            <Link href="/methods" className="inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-bold hover:underline">
              Methods
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className="relative" style={{ zIndex: 1 }}>
        {/* ---------- Hero ---------- */}
        <section className="max-w-6xl mx-auto px-6 pt-12 pb-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="pl-land-badge">Your friendly molecular biology lab</span>

            <h1 className="mt-5 text-5xl md:text-7xl font-black tracking-tight leading-[0.98]" aria-label={TITLE}>
              {TITLE.split("").map((ch, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={`pl-hero-letter ${i > 8 ? "pl-shimmer" : ""}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </h1>

            <p className="mt-3 text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--land-lav-d)" }}>
              Unravel the Secrets of Life.
            </p>

            <p className="mt-5 text-lg max-w-xl" style={{ color: "var(--land-soft)" }}>
              Read sequences, inspect proteins, and trace evolution with an AI lab partner
              who loves a good clipboard — and cites every piece of evidence.
            </p>

            <p className="mt-3 text-sm max-w-xl" style={{ color: "var(--land-soft)" }}>
              Research-support only. Not a clinical or diagnostic system. Observed differences
              are never labelled pathogenic, benign, adaptive, or function-altering without
              supporting evidence.
            </p>

            <div className="flex flex-wrap gap-4 mt-7">
              <Link href="/workspace" className="pl-land-btn">
                Start exploring
              </Link>
              <a href="#tools" className="pl-land-btn alt">
                See the tools
              </a>
            </div>

            <div className="flex flex-wrap gap-2 mt-7">
              <EvidenceBadge kind="COMPUTED" />
              <EvidenceBadge kind="MODEL_PREDICTION" />
              <EvidenceBadge kind="CURATED_ASSERTION" />
              <EvidenceBadge kind="HYPOTHESIS" />
              <EvidenceBadge kind="DEMO" />
            </div>
          </div>

          {/* Stage */}
          <div className="relative mx-auto w-full max-w-[520px]" style={{ aspectRatio: "1 / 1.02" }}>
            <div className="pl-stage-blob" aria-hidden="true" />
            <div className="pl-say" role="status" aria-live="polite">
              {SAYINGS[sayIndex]}
            </div>

            <div className="absolute" style={{ left: "14%", right: "8%", bottom: 0, top: "8%" }}>
              <HeroScientist />
            </div>

            <button
              type="button"
              onClick={() => pokeMascot("blob")}
              aria-label="Poke the coral protein"
              className={`pl-float ${hopKind === "blob" ? "pl-hop" : ""}`}
              style={{ width: "24%", left: "-3%", top: "22%", ["--t" as string]: "5s", ["--d" as string]: "0s" } as CSSProperties}
            >
              <ProteinMascot kind="blob" />
            </button>

            <button
              type="button"
              onClick={() => pokeMascot("cloud")}
              aria-label="Poke the lavender protein"
              className={`pl-float ${hopKind === "cloud" ? "pl-hop" : ""}`}
              style={{ width: "20%", right: "-2%", top: "6%", ["--t" as string]: "6.5s", ["--d" as string]: "-2s" } as CSSProperties}
            >
              <ProteinMascot kind="cloud" delay={-1.4} />
            </button>

            <button
              type="button"
              onClick={() => pokeMascot("hex")}
              aria-label="Poke the blue protein"
              className={`pl-float ${hopKind === "hex" ? "pl-hop" : ""}`}
              style={{ width: "22%", right: "-3%", bottom: "8%", ["--t" as string]: "4.4s", ["--d" as string]: "-1s" } as CSSProperties}
            >
              <ProteinMascot kind="hex" delay={-2.6} />
            </button>
          </div>
        </section>

        {/* ---------- About / steps ---------- */}
        <section id="about" className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] uppercase" style={{ color: "var(--land-mint-d)" }}>
              What PhyloLoom Is
            </p>
            <h2 className="text-4xl font-black tracking-tight mt-2">A lab partner that explains itself.</h2>
            <p className="mt-4 text-lg" style={{ color: "var(--land-soft)" }}>
              PhyloLoom AI weaves together sequences, protein structures, and evolutionary
              trees, then shows you the evidence beside every answer. No black-box scores.
              Click any conclusion and trace it to its computation, source, and coordinates.
            </p>
            <p className="mt-3" style={{ color: "var(--land-soft)" }}>
              If something was not computed, the interface says{" "}
              <strong style={{ color: "var(--land-ink)" }}>unavailable</strong>. It never fills
              gaps with zeroes or invented records.
            </p>
          </div>

          <ol className="grid gap-4 list-none p-0">
            {[
              ["Bring a sequence", "Paste DNA, RNA, or protein FASTA — or start from a clearly labelled demo."],
              ["Ask what changed", "What differs, what's conserved, and what does the evidence actually show?"],
              ["Read the answer", "Get a clear explanation with the evidence, method, and provenance beside it."],
            ].map(([title, body], i) => (
              <li
                key={title}
                className="flex gap-4 items-start p-5 pl-land-card"
                style={{ ["--c" as string]: PASTELS[i % 4][0], ["--cd" as string]: PASTELS[i % 4][1] } as CSSProperties}
              >
                <span
                  className="flex-none w-10 h-10 rounded-full grid place-items-center font-black text-lg"
                  style={{ background: PASTELS[i % 4][0], color: "var(--land-ink)" }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="relative" style={{ zIndex: 1 }}>
                  <strong className="block text-lg">{title}</strong>
                  <span style={{ color: "var(--land-soft)" }}>{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Tools = the dashboard ---------- */}
        <section id="tools" className="max-w-6xl mx-auto px-6 py-14">
          <p className="text-xs font-bold tracking-[0.22em] uppercase" style={{ color: "var(--land-mint-d)" }}>
            Dashboard
          </p>
          <h2 className="text-4xl font-black tracking-tight mt-2">Tools for curious scientists.</h2>
          <p className="mt-3 text-lg max-w-2xl" style={{ color: "var(--land-soft)" }}>
            Each card opens a real working feature. Demo content stays labelled and is never
            blended into a live analysis.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 pl-stagger">
            {TOOLS.map((tool, i) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="pl-land-card"
                style={{ ["--c" as string]: PASTELS[i % 4][0], ["--cd" as string]: PASTELS[i % 4][1] } as CSSProperties}
              >
                <span className="pl-land-ico" aria-hidden="true">{tool.icon}</span>
                <span className="relative block mt-4" style={{ zIndex: 1 }}>
                  <strong className="block text-xl font-black">{tool.title}</strong>
                  <span className="block mt-2" style={{ color: "var(--land-soft)" }}>{tool.text}</span>
                  <span className="block mt-4 font-black" style={{ color: "var(--land-mint-d)" }}>
                    Open →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ---------- Crew ---------- */}
        <section id="crew" className="max-w-6xl mx-auto px-6 py-14">
          <p className="text-xs font-bold tracking-[0.22em] uppercase" style={{ color: "var(--land-lav-d)" }}>
            Helpers
          </p>
          <h2 className="text-4xl font-black tracking-tight mt-2">Meet your molecular assistants.</h2>
          <p className="mt-3 text-lg" style={{ color: "var(--land-soft)" }}>
            Three little proteins live in the lab. Give them a poke — they like it.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {CREW.map((mate) => (
              <article key={mate.name} className="pl-crew-card">
                <button
                  type="button"
                  onClick={() => pokeMascot(mate.kind)}
                  aria-label={`Poke ${mate.name}`}
                  className={`w-[130px] h-[130px] mx-auto block ${hopKind === mate.kind ? "pl-hop" : ""}`}
                  style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}
                >
                  <ProteinMascot kind={mate.kind} />
                </button>
                <h3 className="text-2xl font-black mt-2">{mate.name}</h3>
                <span
                  className="inline-block rounded-full px-4 py-1 font-bold text-sm mt-2 pl-crew-tag"
                >
                  {mate.role}
                </span>
                <p className="mt-3" style={{ color: "var(--land-soft)" }}>
                  “{mate.quote}”
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section id="start" className="max-w-6xl mx-auto px-6 pb-16 pt-4">
          <div
            className="text-center rounded-[40px] px-6 py-14 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--land-mint), var(--land-lav) 60%, var(--land-sky))",
              color: "#26304d",
            }}
          >
            <h2 className="text-4xl font-black tracking-tight">Ready to meet your sequences?</h2>
            <p className="mt-3 text-lg">Start with a free exploration. The clipboard is already out.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-7">
              <Link href="/workspace" className="pl-land-btn">
                Start exploring
              </Link>
              <Link href="/investigate#mutation-detective" className="pl-land-btn alt">
                Try Mutation Detective
              </Link>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative text-center px-6 pb-10 text-sm font-semibold" style={{ zIndex: 1, color: "var(--land-soft)" }}>
        © {COPYRIGHT_YEAR} PhyloLoom AI. Made with curiosity — and provenance.
      </footer>

      {/* ---------- Scroll buddy: landing page only ---------- */}
      {buddyOn && !buddyDismissed && (
        <div className="fixed right-4 bottom-4 z-30 flex items-end gap-2" aria-live="polite">
          <div
            className="text-sm font-bold px-4 py-2 max-w-[220px]"
            style={{
              background: "#fff",
              color: "#26304d",
              border: "3px solid #26304d",
              borderRadius: "18px 18px 4px 18px",
              boxShadow: "0 4px 0 var(--land-coral)",
            }}
          >
            {buddySay}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setBuddySay("Hehe, that tickles!")}
              aria-label="Poke Pip"
              className="pl-float block"
              style={{ width: 74, height: 74, position: "relative", ["--t" as string]: "3.5s" } as CSSProperties}
            >
              <ProteinMascot kind="blob" />
            </button>
            <button
              type="button"
              onClick={() => setBuddyDismissed(true)}
              aria-label="Dismiss the helper"
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-sm font-black"
              style={{ background: "#26304d", color: "#fff", border: "2px solid #fff" }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}