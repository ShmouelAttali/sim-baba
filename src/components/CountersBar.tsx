import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { FactionDef, PlayerState } from "../types/game";

const LEGEND_ROWS = [
  { icon: "💰", name: "כסף", note: "מתאפס בסוף תור" },
  { icon: "👥", name: "חסידים", note: "" },
  { icon: "🥛", name: 'חל"ב', note: "" },
  { icon: "🏛️", name: "תשתית", note: "מגיעה רק מהחצר" },
  { icon: "🃏", name: "שלוף קלף", note: "" },
] as const;

interface PillProps {
  icon: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  subtitle?: string;
}

function CounterPill({ icon, label, value, onChange, subtitle }: PillProps) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevValueRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevValueRef.current;
    prevValueRef.current = value;
    if (value === prev) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlash(value > prev ? "up" : "down");
    timerRef.current = setTimeout(() => setFlash(null), 650);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-full px-3 py-1.5 select-none">
        <span className="text-base leading-none">{icon}</span>
        <span className="text-xs font-medium text-white/75 whitespace-nowrap">{label}</span>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-5 h-5 bg-white/15 hover:bg-white/25 active:bg-white/35 text-white rounded-full text-sm font-bold flex items-center justify-center transition-colors shrink-0"
          aria-label={`הפחת ${label}`}
        >
          −
        </button>
        <span
          className="font-bold text-lg w-7 text-center tabular-nums text-white"
          style={{
            color: flash === "up" ? "#4ade80" : flash === "down" ? "#f87171" : undefined,
            transition: flash ? "none" : "color 0.55s ease",
          }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-5 h-5 bg-white/15 hover:bg-white/25 active:bg-white/35 text-white rounded-full text-sm font-bold flex items-center justify-center transition-colors shrink-0"
          aria-label={`הוסף ${label}`}
        >
          +
        </button>
      </div>
      {subtitle && (
        <span className="text-[10px] text-white/35 italic leading-none">{subtitle}</span>
      )}
    </div>
  );
}

const FACTION_BAR_BG: Record<string, string> = {
  baba:    "bg-yellow-950/90 border-yellow-700/25",
  breslov: "bg-purple-950/90 border-purple-700/25",
  chabad:  "bg-orange-950/90 border-orange-700/25",
  litvaks: "bg-slate-900    border-slate-600/30",
};

interface Props {
  player: PlayerState;
  faction: FactionDef;
  onUpdatePlayer: (updated: PlayerState) => void;
  isEndingTurn?: boolean;
}

interface ModalProps {
  faction: FactionDef;
  locked: boolean;
  onClose: () => void;
  onPanelMouseEnter: () => void;
  onPanelMouseLeave: () => void;
}

function LegendModal({ faction, locked, onClose, onPanelMouseEnter, onPanelMouseLeave }: ModalProps) {
  useEffect(() => {
    if (!locked) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [locked, onClose]);

  return createPortal(
    <div
      onClick={locked ? onClose : undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: locked ? "rgba(0,0,0,0.55)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: locked ? "auto" : "none",
        ...(locked && { animation: "modal-backdrop-in 180ms ease-out forwards" } as React.CSSProperties),
      }}
    >
      <div
        className="modal-panel-in"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={onPanelMouseEnter}
        onMouseLeave={onPanelMouseLeave}
        style={{
          background: "#1e1e2e",
          color: "white",
          borderRadius: 16,
          padding: "24px 28px",
          width: 360,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          direction: "rtl",
          border: "1px solid rgba(255,255,255,0.08)",
          pointerEvents: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: "bold" }}>מפתח סמלים ויכולת פלגה</span>
          {locked && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                fontSize: 20,
                cursor: "pointer",
                lineHeight: 1,
                padding: "0 4px",
              }}
              aria-label="סגור"
            >
              ×
            </button>
          )}
        </div>

        {/* Legend section */}
        <div style={{ fontSize: 12, fontWeight: "bold", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          סמלים
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, marginBottom: 20 }}>
          {LEGEND_ROWS.map(({ icon, name, note }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 17, minWidth: 26, textAlign: "center" }}>{icon}</span>
              <span style={{ fontWeight: 500 }}>{name}</span>
              {note && (
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginInlineStart: "auto" }}>
                  {note}
                </span>
              )}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 17, minWidth: 26, textAlign: "center" }}>⚠️</span>
            <span style={{ fontWeight: 500 }}>{faction.dangerName}</span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginInlineStart: "auto" }}>
              סכנת הפלגה
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }} />

        {/* Faction ability section */}
        <div style={{ fontSize: 12, fontWeight: "bold", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          יכולת פלגה
        </div>
        <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 6 }}>
          {faction.abilityName}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginBottom: 14 }}>
          {faction.abilityText}
        </div>
        {faction.outburstText && (
          <div style={{
            background: "rgba(220,60,60,0.1)",
            border: "1px solid rgba(220,60,60,0.25)",
            borderRadius: 8,
            padding: "10px 12px",
          }}>
            <div style={{ fontSize: 11, fontWeight: "bold", color: "rgba(220,100,100,0.7)", marginBottom: 4 }}>
              התפרצות (6+ סכנה)
            </div>
            <div style={{ fontSize: 13, color: "rgba(220,120,120,0.9)", lineHeight: 1.6 }}>
              {faction.outburstText}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function CountersBar({ player, faction, onUpdatePlayer, isEndingTurn }: Props) {
  const [locked, setLocked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOpen = locked || hovered;
  const p = player;
  const barColor = FACTION_BAR_BG[p.factionId] ?? "bg-stone-900 border-stone-700/30";

  const startHoverClose = () => {
    closeTimer.current = setTimeout(() => setHovered(false), 150);
  };
  const cancelHoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <div className={`shrink-0 border-b ${barColor} ${isEndingTurn ? "bar-flash" : ""}`}>
      <div className="relative px-6 py-2 flex items-start justify-center gap-5 flex-wrap overflow-x-auto">
        {/* Legend ? button — right side */}
        <button
          onMouseEnter={() => { cancelHoverClose(); setHovered(true); }}
          onMouseLeave={startHoverClose}
          onClick={() => setLocked((v) => !v)}
          aria-label="מפתח סמלים"
          style={{
            position: "absolute",
            right: 24,
            top: "50%",
            transform: "translateY(-50%)",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: locked ? "#6366f1" : isOpen ? "#4b5563" : "#374151",
            color: "white",
            fontSize: 13,
            fontWeight: "bold",
            border: locked ? "1px solid #818cf8" : "1px solid #6b7280",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ?
        </button>

        <CounterPill
          icon="👥"
          label="חסידים"
          value={p.followers}
          onChange={(v) => onUpdatePlayer({ ...p, followers: v })}
        />
        <CounterPill
          icon="💰"
          label="כסף"
          value={p.money}
          onChange={(v) => onUpdatePlayer({ ...p, money: v })}
          subtitle="מתאפס בסוף תור"
        />
        <CounterPill
          icon="🥛"
          label='חל"ב'
          value={p.milk}
          onChange={(v) => onUpdatePlayer({ ...p, milk: v })}
        />
        <CounterPill
          icon="🏛️"
          label="תשתית"
          value={p.infrastructure}
          onChange={(v) => onUpdatePlayer({ ...p, infrastructure: v })}
          subtitle="מגיעה רק מהחצר"
        />
        <CounterPill
          icon="⚠️"
          label={faction.dangerName}
          value={p.danger}
          onChange={(v) => onUpdatePlayer({ ...p, danger: v })}
        />
      </div>

      {isOpen && (
        <LegendModal
          faction={faction}
          locked={locked}
          onClose={() => setLocked(false)}
          onPanelMouseEnter={cancelHoverClose}
          onPanelMouseLeave={startHoverClose}
        />
      )}
    </div>
  );
}
