import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const TITLE = "PhyloLoom AI";

export default function SiteHeader({ subtitle }: { subtitle: string }) {
  return (
    <header className="pl-site-header px-4 md:px-6 py-3">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-3">
        <div className="pl-enter">
          <Link href="/" aria-label={TITLE} className="text-2xl font-black tracking-tight" style={{ color: "var(--ink)" }}>
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
          </Link>
          <p className="text-sm pl-ink-soft">{subtitle}</p>
        </div>
        <nav className="ml-auto flex items-center gap-1 flex-wrap" aria-label="Main">
          <Link className="pl-nav-pill" href="/">Dashboard</Link>
          <Link className="pl-nav-pill" href="/workspace">Workspace</Link>
          <Link className="pl-nav-pill" href="/investigate">Investigation</Link>
          <Link className="pl-nav-pill" href="/methods">Methods</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}