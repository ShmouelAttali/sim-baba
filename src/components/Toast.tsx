import { useEffect } from "react";
import type { AppliedEffect } from "../utils/cardEffects";

export interface ToastData {
  cardName: string;
  subtitle?: string;
  effects: AppliedEffect[];
  needsManual: boolean;
  curseNote?: string;
}

interface Props {
  toast: ToastData | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const dangerWarning = toast.effects.find(e => e.label === "התפרצות!");
  const mainEffects = toast.effects.filter(e => e.label !== "התפרצות!");

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        background: "#1e1e2e",
        color: "white",
        borderRadius: "12px",
        padding: "12px 20px",
        minWidth: "180px",
        maxWidth: "90vw",
        direction: "rtl",
        pointerEvents: "none",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "5px" }}>
        {toast.cardName}{toast.subtitle ? ` — ${toast.subtitle}` : " ✓"}
      </div>
      {(mainEffects.length > 0 || toast.needsManual) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          {mainEffects.map((e, i) => (
            <span key={i} style={{ fontSize: "13px" }}>
              {e.icon}{" "}
              {e.delta !== 0 ? (e.delta > 0 ? `+${e.delta}` : String(e.delta)) : ""}
              {e.delta !== 0 ? " " : ""}{e.label}
            </span>
          ))}
          {toast.needsManual && (
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>+ אפקט ידני נדרש</span>
          )}
        </div>
      )}
      {dangerWarning && (
        <div style={{ marginTop: "5px", color: "#f87171", fontWeight: 700, fontSize: "13px" }}>
          🚨 סכנה 6+ — הפעל התפרצות!
        </div>
      )}
      {toast.curseNote && (
        <div style={{ marginTop: "5px", color: "#fbbf24", fontSize: "12px" }}>
          {toast.curseNote}
        </div>
      )}
    </div>
  );
}
