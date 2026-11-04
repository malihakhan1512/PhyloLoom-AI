import type { ReactNode } from "react";

export default function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="pl-tip">
      {children}
      <span className="pl-tip-bubble" role="tooltip">{label}</span>
    </span>
  );
}