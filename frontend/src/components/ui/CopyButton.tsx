"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "./Toast";
import Tooltip from "./Tooltip";

export default function CopyButton({ value, label }: { value: string; label: string }) {
  const { push } = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopied(true);
      push("success", `${label} copied`);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      push("error", `Could not copy ${label.toLowerCase()}`);
    }
  }

  return (
    <Tooltip label={copied ? "Copied" : `Copy ${label.toLowerCase()}`}>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-2.5 rounded-full border text-xs font-bold transition-colors duration-[120ms]"
        style={{
          borderColor: copied ? "var(--accent)" : "var(--border-strong)",
          background: copied ? "var(--accent-soft)" : "var(--surface)",
          color: copied ? "var(--accent-strong)" : "var(--ink-soft)",
        }}
      >
        <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </Tooltip>
  );
}