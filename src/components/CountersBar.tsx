import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { CardDef, FactionDef, PlayerState } from "../types/game";
import { RulesContent } from "./RulesContent";

// ── Legend modal (unchanged) ──────────────────────────────────────────────────

const LEGEND_ROWS = [
  { icon: "💰", name: "כסף", note: "מתאפס בסוף תור" },
  { icon: "👥", name: "חסידים", note: "" },
  { icon: "🥛", name: 'חל"ב', note: "" },
  { icon: "🏛️", name: "תשתית", note: "מגיעה רק מהחצר" },
  { icon: "🃏", name: "שלוף קלף", note: "" },
] as const;

interface LegendModalProps {
  faction: FactionDef;
  locked: boolean;
  onClose: () => void;
  onPanelMouseEnter: () => void;
  onPanelMouseLeave: () => void;
}

function LegendModal({ faction, locked, onClose, onPanelMouseEnter, onPanelMouseLeave }: LegendModalProps) {
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
        position: "fixed", inset: 0, zIndex: 9999,
        background: locked ? "rgba(0,0,0,0.55)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
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
          background: "#1e1e2e", color: "white", borderRadius: 16,
          padding: "24px 28px", width: 360, maxHeight: "80vh",
          overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          direction: "rtl", border: "1px solid rgba(255,255,255,0.08)",
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: "bold" }}>מפתח סמלים ויכולת פלגה</span>
          {locked && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 4px" }} aria-label="סגור">×</button>
          )}
        </div>
        <div style={{ fontSize: 12, fontWeight: "bold", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>סמלים</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, marginBottom: 20 }}>
          {LEGEND_ROWS.map(({ icon, name, note }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 17, minWidth: 26, textAlign: "center" }}>{icon}</span>
              <span style={{ fontWeight: 500 }}>{name}</span>
              {note && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginInlineStart: "auto" }}>{note}</span>}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 17, minWidth: 26, textAlign: "center" }}>⚠️</span>
            <span style={{ fontWeight: 500 }}>{faction.dangerName}</span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginInlineStart: "auto" }}>סכנת הפלגה</span>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }} />
        <div style={{ fontSize: 12, fontWeight: "bold", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>יכולת פלגה</div>
        <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 6 }}>{faction.abilityName}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginBottom: 14 }}>{faction.abilityText}</div>
        {faction.outburstText && (
          <div style={{ background: "rgba(220,60,60,0.1)", border: "1px solid rgba(220,60,60,0.25)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: "bold", color: "rgba(220,100,100,0.7)", marginBottom: 4 }}>התפרצות (6+ סכנה)</div>
            <div style={{ fontSize: 13, color: "rgba(220,120,120,0.9)", lineHeight: 1.6 }}>{faction.outburstText}</div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Counter pill ──────────────────────────────────────────────────────────────

interface PillProps {
  icon: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function CounterPill({ icon, label, value, onChange }: PillProps) {
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
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  return (
    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-full px-2.5 py-1 select-none shrink-0">
      <span className="text-sm leading-none">{icon}</span>
      <span className="text-xs font-medium text-white/75 whitespace-nowrap hidden xl:inline">{label}</span>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-4 h-4 bg-white/15 hover:bg-white/25 active:bg-white/35 text-white rounded-full text-xs font-bold flex items-center justify-center transition-colors shrink-0"
        aria-label={`הפחת ${label}`}
      >
        −
      </button>
      <span
        className="font-bold text-base w-6 text-center tabular-nums text-white"
        style={{
          color: flash === "up" ? "#4ade80" : flash === "down" ? "#f87171" : undefined,
          transition: flash ? "none" : "color 0.55s ease",
        }}
      >
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-4 h-4 bg-white/15 hover:bg-white/25 active:bg-white/35 text-white rounded-full text-xs font-bold flex items-center justify-center transition-colors shrink-0"
        aria-label={`הוסף ${label}`}
      >
        +
      </button>
    </div>
  );
}

// ── Player summary (used inside שחקנים panel) ────────────────────────────────

const FACTION_COLORS: Record<string, string> = {
  baba:    "bg-yellow-700",
  breslov: "bg-purple-700",
  chabad:  "bg-orange-600",
  litvaks: "bg-slate-600",
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1 rounded-full bg-stone-700 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function PlayerSummaryCard({ player, factions, isCurrent, allCardDefs }: { player: PlayerState; factions: FactionDef[]; isCurrent: boolean; allCardDefs: CardDef[] }) {
  const faction = factions.find((f) => f.id === player.factionId);
  const headerColor = FACTION_COLORS[player.factionId] ?? "bg-stone-600";
  return (
    <div className={`rounded-xl border overflow-hidden shrink-0 w-52 ${isCurrent ? "border-amber-400" : "border-stone-600"}`}>
      <div className={`${headerColor} text-white px-3 py-1.5 flex items-center justify-between`}>
        <span className="font-bold text-sm truncate">{player.name}</span>
        {isCurrent && <span className="text-[10px] bg-amber-400 text-stone-900 px-1 py-0.5 rounded font-bold shrink-0 ml-1">עכשיו</span>}
      </div>
      <div className="bg-stone-800 px-3 py-2 text-xs space-y-1.5">
        <div className="text-stone-400">{faction?.name}</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <span className="text-stone-300">👥 <strong className="text-white">{player.followers}</strong></span>
          <span className="text-stone-300">💰 <strong className="text-white">{player.money}</strong></span>
          <span className="text-stone-300">🥛 <strong className="text-white">{player.milk}</strong></span>
          <span className="text-stone-300">🏛️ <strong className="text-white">{player.infrastructure}</strong></span>
          <span className="text-stone-300 col-span-2">⚠️ {faction?.dangerName}: <strong className="text-white">{player.danger}</strong></span>
        </div>
        <div className="border-t border-stone-700 pt-1.5 space-y-1">
          <div className="text-stone-500 text-[10px] font-semibold uppercase tracking-wide mb-0.5">התקדמות לניצחון</div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-stone-400 text-[10px] whitespace-nowrap">🏆 מופתים</span>
            <span className={`text-[10px] font-bold ${player.mofets.length >= 3 ? "text-purple-400" : "text-white"}`}>{player.mofets.length}/3</span>
          </div>
          <ProgressBar value={player.mofets.length} max={3} color="bg-purple-500" />
          <div className="flex items-center justify-between gap-1">
            <span className="text-stone-400 text-[10px] whitespace-nowrap">👥 חסידים</span>
            <span className={`text-[10px] font-bold ${player.followers >= 30 ? "text-green-400" : "text-white"}`}>{player.followers}/30</span>
          </div>
          <ProgressBar value={player.followers} max={30} color="bg-green-500" />
          <div className="flex items-center justify-between gap-1">
            <span className="text-stone-400 text-[10px] whitespace-nowrap">🥛 חל״ב</span>
            <span className={`text-[10px] font-bold ${player.milk >= 25 ? "text-blue-400" : "text-white"}`}>{player.milk}/25</span>
          </div>
          <ProgressBar value={player.milk} max={25} color="bg-blue-400" />
        </div>
        <div className="border-t border-stone-700 pt-1">
          <div className="text-stone-500 text-[10px] mb-1">✡ מופתים ({player.mofets.length}/3):</div>
          {player.mofets.length === 0 ? (
            <div className="text-stone-600 text-[10px]">אין עדיין</div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {player.mofets.map((m) => {
                const name = allCardDefs.find((d) => d.id === m.defId)?.name ?? m.defId;
                return <span key={m.instanceId} className="text-[9px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded-full">{name}</span>;
              })}
            </div>
          )}
        </div>
        <div className="text-stone-500 border-t border-stone-700 pt-1">
          יד {player.hand.length} · דק {player.deck.length} · זרוקים {player.discard.length} · חצר {player.yard.length}
        </div>
      </div>
    </div>
  );
}

// ── Faction bar backgrounds ───────────────────────────────────────────────────

const FACTION_BAR_BG: Record<string, string> = {
  baba:    "bg-yellow-950/90 border-yellow-700/25",
  breslov: "bg-purple-950/90 border-purple-700/25",
  chabad:  "bg-orange-950/90 border-orange-700/25",
  litvaks: "bg-slate-900    border-slate-600/30",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  player: PlayerState;
  faction: FactionDef;
  onUpdatePlayer: (updated: PlayerState) => void;
  isEndingTurn?: boolean;

  turnNumber: number;
  currentPlayerName: string;
  log: string[];
  players: PlayerState[];
  currentPlayerIndex: number;
  factions: FactionDef[];
  allCardDefs: CardDef[];

  onEndTurn: () => void;
  onSave: () => void;
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
  onReloadCards: () => void;
  reloadState: "idle" | "loading" | "success" | "error";
  reloadError?: string; // shown in hamburger menu on error state
  debugJson?: string;

  onOpenMarket: () => void;
  canAffordMarket: boolean;
}

// ── Main component ────────────────────────────────────────────────────────────

type SubPanel = null | "history" | "players" | "rules" | "debug";

export default function CountersBar({
  player, faction, onUpdatePlayer, isEndingTurn,
  turnNumber, currentPlayerName,
  log, players, currentPlayerIndex, factions, allCardDefs,
  onEndTurn, onSave, onUndo, onReset, canUndo,
  onReloadCards, reloadState, reloadError: _reloadError, debugJson,
  onOpenMarket, canAffordMarket,
}: Props) {
  const [legendLocked, setLegendLocked] = useState(false);
  const [legendHovered, setLegendHovered] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [subPanel, setSubPanel] = useState<SubPanel>(null);
  const [confirmEndTurn, setConfirmEndTurn] = useState(false);
  const [barBottom, setBarBottom] = useState(56);
  const [dropdownLeft, setDropdownLeft] = useState(16);

  const legendCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hamburgerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const subPanelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const isLegendOpen = legendLocked || legendHovered;
  const p = player;
  const barColor = FACTION_BAR_BG[p.factionId] ?? "bg-stone-900 border-stone-700/30";

  const startLegendHoverClose = () => {
    legendCloseTimer.current = setTimeout(() => setLegendHovered(false), 150);
  };
  const cancelLegendHoverClose = () => {
    if (legendCloseTimer.current) clearTimeout(legendCloseTimer.current);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inHamburgerBtn = hamburgerRef.current?.contains(target) ?? false;
      const inDropdown = dropdownRef.current?.contains(target) ?? false;
      const inSubPanel = subPanelRef.current?.contains(target) ?? false;

      if (hamburgerOpen && !inHamburgerBtn && !inDropdown) {
        setHamburgerOpen(false);
      }
      if (subPanel && !inSubPanel && !inHamburgerBtn && !inDropdown) {
        setSubPanel(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hamburgerOpen, subPanel]);

  function measureBar() {
    if (barRef.current) {
      setBarBottom(barRef.current.getBoundingClientRect().bottom);
    }
    if (hamburgerRef.current) {
      setDropdownLeft(hamburgerRef.current.getBoundingClientRect().left);
    }
  }

  function openSubPanel(panel: SubPanel) {
    measureBar();
    setHamburgerOpen(false);
    setSubPanel(panel);
  }

  const btnBase: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    color: "white", fontSize: "13px", fontWeight: 500,
    padding: "8px 12px", textAlign: "right", width: "100%",
    borderRadius: "8px", display: "block",
  };

  return (
    <div ref={barRef} className={`shrink-0 border-b ${barColor} ${isEndingTurn ? "bar-flash" : ""}`}>
      <div className="flex items-center px-3 gap-2 no-scrollbar" style={{ minHeight: "56px", overflowX: "auto" }}>

        {/* Turn indicator — far right (first DOM child in RTL) */}
        <div style={{ whiteSpace: "nowrap", color: "white", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
          תור {turnNumber} — {currentPlayerName}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* 5 Counter pills — centered */}
        <CounterPill icon="💰" label="כסף" value={p.money} onChange={(v) => onUpdatePlayer({ ...p, money: v })} />
        <CounterPill icon="👥" label="חסידים" value={p.followers} onChange={(v) => onUpdatePlayer({ ...p, followers: v })} />
        <CounterPill icon="🥛" label='חל"ב' value={p.milk} onChange={(v) => onUpdatePlayer({ ...p, milk: v })} />
        <CounterPill icon="🏛️" label="תשתית" value={p.infrastructure} onChange={(v) => onUpdatePlayer({ ...p, infrastructure: v })} />
        <CounterPill icon="⚠️" label={faction.dangerName} value={p.danger} onChange={(v) => onUpdatePlayer({ ...p, danger: v })} />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* End turn */}
        {!confirmEndTurn ? (
          <button
            onClick={() => setConfirmEndTurn(true)}
            style={{
              background: "#16a34a", color: "white",
              border: "none", borderRadius: "8px",
              padding: "8px 20px", fontSize: "15px", fontWeight: 700,
              cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
            }}
          >
            סיים תור
          </button>
        ) : (
          <div
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(21,128,61,0.25)", border: "1px solid #16a34a",
              borderRadius: "8px", padding: "6px 12px", flexShrink: 0,
            }}
          >
            <span style={{ color: "#86efac", fontSize: "13px", whiteSpace: "nowrap" }}>בטוח?</span>
            <button
              onClick={() => { onEndTurn(); setConfirmEndTurn(false); }}
              style={{ background: "#16a34a", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              כן
            </button>
            <button
              onClick={() => setConfirmEndTurn(false)}
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "none", borderRadius: "6px", padding: "6px 10px", fontSize: "13px", cursor: "pointer" }}
            >
              לא
            </button>
          </div>
        )}

        {/* 🛒 Market button */}
        <button
          onClick={onOpenMarket}
          style={{
            position: "relative",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "white", borderRadius: "8px",
            padding: "8px 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
            flexShrink: 0, whiteSpace: "nowrap",
          }}
          aria-label="שוק"
        >
          🛒 שוק
          {canAffordMarket && (
            <span
              style={{
                position: "absolute", top: "4px", left: "4px",
                width: "8px", height: "8px",
                background: "#22c55e", borderRadius: "50%",
                border: "1.5px solid rgba(0,0,0,0.4)",
              }}
            />
          )}
        </button>

        {/* ? Legend button */}
        <button
          onMouseEnter={() => { cancelLegendHoverClose(); setLegendHovered(true); }}
          onMouseLeave={startLegendHoverClose}
          onClick={() => setLegendLocked((v) => !v)}
          aria-label="מפתח סמלים"
          style={{
            flexShrink: 0, width: 32, height: 32,
            borderRadius: "50%",
            background: legendLocked ? "#6366f1" : isLegendOpen ? "#4b5563" : "#374151",
            color: "white", fontSize: 13, fontWeight: "bold",
            border: legendLocked ? "1px solid #818cf8" : "1px solid #6b7280",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ?
        </button>

        {/* ☰ Hamburger — far left (last DOM child in RTL) */}
        <div ref={hamburgerRef} style={{ flexShrink: 0 }}>
          <button
            onClick={() => { measureBar(); setHamburgerOpen((o) => !o); setSubPanel(null); }}
            style={{
              background: hamburgerOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white", borderRadius: "8px",
              padding: "6px 10px", fontSize: "16px", cursor: "pointer",
            }}
            aria-label="תפריט"
          >
            ☰
          </button>
        </div>
      </div>

      {isLegendOpen && (
        <LegendModal
          faction={faction}
          locked={legendLocked}
          onClose={() => setLegendLocked(false)}
          onPanelMouseEnter={cancelLegendHoverClose}
          onPanelMouseLeave={startLegendHoverClose}
        />
      )}

      {/* Hamburger dropdown — portal so it paints above card stacking contexts */}
      {hamburgerOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: barBottom + 6,
            left: dropdownLeft,
            zIndex: 9000,
            background: "#1c1917",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            minWidth: "180px",
            padding: "6px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            direction: "rtl",
          }}
        >
          <button onClick={() => { onSave(); setHamburgerOpen(false); }} style={btnBase} onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")} onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}>💾 שמור</button>
          <button
            onClick={() => { onReloadCards(); setHamburgerOpen(false); }}
            style={btnBase}
            onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}
          >
            {reloadState === "loading" ? "⏳ טוען…" : reloadState === "success" ? "✅ רועננו" : "🔄 רענן קלפים"}
          </button>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
          <button onClick={() => openSubPanel("history")} style={btnBase} onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")} onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}>📜 היסטוריה</button>
          <button onClick={() => openSubPanel("players")} style={btnBase} onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")} onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}>👥 שחקנים</button>
          <button onClick={() => openSubPanel("rules")} style={btnBase} onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")} onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}>📖 הוראות</button>
          {debugJson !== undefined && (
            <button onClick={() => openSubPanel("debug")} style={btnBase} onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")} onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}>⚙ דיבאג</button>
          )}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
          <button
            onClick={() => { onUndo(); setHamburgerOpen(false); }}
            disabled={!canUndo}
            style={{ ...btnBase, opacity: canUndo ? 1 : 0.35, cursor: canUndo ? "pointer" : "default" }}
            onMouseEnter={(e) => { if (canUndo) (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}
          >
            ↩ בטל פעולה
          </button>
          <button
            onClick={() => { onReset(); setHamburgerOpen(false); }}
            style={{ ...btnBase, color: "#f87171" }}
            onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)")}
            onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}
          >
            🗑 איפוס
          </button>
        </div>,
        document.body
      )}

      {/* Sub-panel — portal so it paints above card stacking contexts */}
      {subPanel && createPortal(
        <div
          ref={subPanelRef}
          style={{
            position: "fixed",
            top: barBottom,
            left: 0,
            right: 0,
            zIndex: 9000,
            background: "#1c1917",
            border: "1px solid rgba(255,255,255,0.1)",
            borderTop: "none",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            maxHeight: "65vh",
            overflowY: "auto",
            direction: "rtl",
          }}
        >
          {subPanel === "history" && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-stone-700">
                <button onClick={() => setSubPanel(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>×</button>
                <span className="text-xs font-bold text-stone-400">יומן משחק ({log.length} רשומות)</span>
              </div>
              <div className="log-scroll overflow-y-auto" style={{ maxHeight: "55vh" }}>
                {log.length === 0 ? (
                  <p className="text-stone-500 text-xs px-4 py-3">אין רשומות עדיין</p>
                ) : (
                  [...log].reverse().map((entry, i) => (
                    <div key={i} className="text-xs text-stone-300 px-4 py-1.5 border-b border-stone-800 last:border-0 hover:bg-stone-800">
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {subPanel === "players" && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-stone-700">
                <button onClick={() => setSubPanel(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>×</button>
                <span className="text-xs font-bold text-stone-400">שחקנים</span>
              </div>
              <div className="p-4 flex gap-3 overflow-x-auto">
                {players.map((pl, i) => (
                  <PlayerSummaryCard key={pl.id} player={pl} factions={factions} isCurrent={i === currentPlayerIndex} allCardDefs={allCardDefs} />
                ))}
              </div>
            </div>
          )}

          {subPanel === "rules" && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-stone-700">
                <button onClick={() => setSubPanel(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>×</button>
                <span className="text-xs font-bold text-amber-400">הוראות משחק</span>
              </div>
              <div className="px-6 py-4 rules-content">
                <RulesContent />
              </div>
            </div>
          )}

          {subPanel === "debug" && debugJson !== undefined && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-stone-700">
                <button onClick={() => setSubPanel(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>×</button>
                <span className="text-xs font-bold text-stone-400">⚙ דיבאג</span>
              </div>
              <div className="overflow-auto" style={{ maxHeight: "55vh" }} dir="ltr">
                <pre className="p-4 text-[10px] text-stone-300">{debugJson}</pre>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
