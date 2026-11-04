"use client";
import { useEffect, useRef, useState } from "react";
import DnaMascot from "./DnaMascot";

function useDelayedVisible(active: boolean): boolean {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    if (active) {
      showTimer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, 150);
    } else if (shownAt.current !== null) {
      const elapsed = Date.now() - shownAt.current;
      const wait = Math.max(0, 400 - elapsed);
      hideTimer = setTimeout(() => {
        shownAt.current = null;
        setVisible(false);
      }, wait);
    } else {
      setVisible(false);
    }

    return () => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [active]);

  return visible;
}

export default function LoadingState({
  active,
  status,
  steps,
}: {
  active: boolean;
  status: string;
  steps?: string[];
}) {
  const visible = useDelayedVisible(active);
  if (!visible) return null;

  return (
    <div
      className="flex items-center gap-4 p-4 pl-surface-2 my-3"
      role="status"
      aria-live="polite"
      aria-label={status}
    >
      <DnaMascot />
      <div>
        <p className="font-bold text-sm">{status}</p>
        {steps && steps.length > 0 ? (
          <ul className="text-sm pl-ink-soft mt-1 space-y-0.5">
            {steps.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm pl-ink-soft mt-1">Working… this names the step, not the result.</p>
        )}
      </div>
    </div>
  );
}