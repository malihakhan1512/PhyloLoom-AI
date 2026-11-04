"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

const ToastCtx = createContext<{ push: (kind: ToastKind, message: string) => void }>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((cur) => [...cur.slice(-3), { id, kind, message }]);
    if (kind !== "error") {
      window.setTimeout(() => dismiss(id), 5000);
    }
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2 items-end" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className="pl-toast-in pl-surface px-4 py-3 text-sm font-semibold flex items-center gap-3 max-w-[min(92vw,380px)]"
            style={{
              borderLeft: `4px solid ${t.kind === "error" ? "var(--danger)" : t.kind === "success" ? "var(--accent)" : "var(--border-strong)"}`,
            }}
          >
            <span aria-hidden="true">{t.kind === "error" ? "⚠" : t.kind === "success" ? "✓" : "ℹ"}</span>
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full font-black"
              style={{ color: "var(--ink-soft)" }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}