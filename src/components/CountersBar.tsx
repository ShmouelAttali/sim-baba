import { useState, useRef, useEffect } from "react";
import type { FactionDef, PlayerState } from "../types/game";

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

export default function CountersBar({ player, faction, onUpdatePlayer, isEndingTurn }: Props) {
  const [abilityExpanded, setAbilityExpanded] = useState(false);
  const p = player;
  const barColor = FACTION_BAR_BG[p.factionId] ?? "bg-stone-900 border-stone-700/30";

  return (
    <div className={`shrink-0 border-b ${barColor} ${isEndingTurn ? "bar-flash" : ""}`}>
      {/* Counter pills row */}
      <div className="px-6 py-2 flex items-start justify-center gap-5 flex-wrap overflow-x-auto">
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

      {/* Collapsible faction ability */}
      <div className="px-6 pb-1.5">
        <button
          onClick={() => setAbilityExpanded((v) => !v)}
          className="text-[11px] text-white/40 hover:text-white/60 transition-colors"
        >
          יכולת: {faction.abilityName ?? faction.abilityText.slice(0, 30)} {abilityExpanded ? "▲" : "▼"}
        </button>
        {abilityExpanded && (
          <div className="mt-1 text-[11px] text-white/50 leading-relaxed space-y-0.5 max-w-2xl">
            <div>{faction.abilityText}</div>
            {faction.outburstText && (
              <div><span className="text-white/35">התפרצות: </span>{faction.outburstText}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
