import { useState, useEffect, useRef } from "react";
import type { CardDef, FactionDef, PlayerState } from "../types/game";
import { RulesContent } from "./RulesContent";

interface Props {
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
  reloadError?: string;
  debugJson?: string;
}

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

function PlayerSummaryCard({
  player,
  factions,
  isCurrent,
  allCardDefs,
}: {
  player: PlayerState;
  factions: FactionDef[];
  isCurrent: boolean;
  allCardDefs: CardDef[];
}) {
  const faction = factions.find((f) => f.id === player.factionId);
  const headerColor = FACTION_COLORS[player.factionId] ?? "bg-stone-600";

  return (
    <div
      className={`rounded-xl border overflow-hidden shrink-0 w-52 ${
        isCurrent ? "border-amber-400" : "border-stone-600"
      }`}
    >
      <div className={`${headerColor} text-white px-3 py-1.5 flex items-center justify-between`}>
        <span className="font-bold text-sm truncate">{player.name}</span>
        {isCurrent && (
          <span className="text-[10px] bg-amber-400 text-stone-900 px-1 py-0.5 rounded font-bold shrink-0 ml-1">
            עכשיו
          </span>
        )}
      </div>
      <div className="bg-stone-800 px-3 py-2 text-xs space-y-1.5">
        <div className="text-stone-400">{faction?.name}</div>

        {/* Counters */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <span className="text-stone-300">👥 <strong className="text-white">{player.followers}</strong></span>
          <span className="text-stone-300">💰 <strong className="text-white">{player.money}</strong></span>
          <span className="text-stone-300">🥛 <strong className="text-white">{player.milk}</strong></span>
          <span className="text-stone-300">🏛️ <strong className="text-white">{player.infrastructure}</strong></span>
          <span className="text-stone-300 col-span-2">
            ⚠️ {faction?.dangerName}: <strong className="text-white">{player.danger}</strong>
          </span>
        </div>

        {/* Victory progress */}
        <div className="border-t border-stone-700 pt-1.5 space-y-1">
          <div className="text-stone-500 text-[10px] font-semibold uppercase tracking-wide mb-0.5">התקדמות לניצחון</div>

          <div className="flex items-center justify-between gap-1">
            <span className="text-stone-400 text-[10px] whitespace-nowrap">🏆 מופתים</span>
            <span className={`text-[10px] font-bold ${player.mofets.length >= 3 ? "text-purple-400" : "text-white"}`}>
              {player.mofets.length}/3
            </span>
          </div>
          <ProgressBar value={player.mofets.length} max={3} color="bg-purple-500" />

          <div className="flex items-center justify-between gap-1">
            <span className="text-stone-400 text-[10px] whitespace-nowrap">👥 חסידים</span>
            <span className={`text-[10px] font-bold ${player.followers >= 30 ? "text-green-400" : "text-white"}`}>
              {player.followers}/30
            </span>
          </div>
          <ProgressBar value={player.followers} max={30} color="bg-green-500" />

          <div className="flex items-center justify-between gap-1">
            <span className="text-stone-400 text-[10px] whitespace-nowrap">🥛 חל״ב</span>
            <span className={`text-[10px] font-bold ${player.milk >= 25 ? "text-blue-400" : "text-white"}`}>
              {player.milk}/25
            </span>
          </div>
          <ProgressBar value={player.milk} max={25} color="bg-blue-400" />
        </div>

        {/* Earned mofets */}
        <div className="border-t border-stone-700 pt-1 mt-1">
          <div className="text-stone-500 text-[10px] mb-1">✡ מופתים שהושגו ({player.mofets.length}/3):</div>
          {player.mofets.length === 0 ? (
            <div className="text-stone-600 text-[10px]">אין עדיין</div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {player.mofets.map((m) => {
                const name = allCardDefs.find((d) => d.id === m.defId)?.name ?? m.defId;
                return (
                  <span key={m.instanceId} className="text-[9px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded-full">
                    {name}
                  </span>
                );
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

export default function AppHeader({
  turnNumber,
  currentPlayerName,
  log,
  players,
  currentPlayerIndex,
  factions,
  allCardDefs,
  onEndTurn,
  onSave,
  onUndo,
  onReset,
  canUndo,
  onReloadCards,
  reloadState,
  reloadError,
  debugJson,
}: Props) {
  const [historyOpen,  setHistoryOpen]  = useState(false);
  const [playersOpen,  setPlayersOpen]  = useState(false);
  const [rulesOpen,    setRulesOpen]    = useState(false);
  const [debugOpen,    setDebugOpen]    = useState(false);
  const [confirmEndTurn, setConfirmEndTurn] = useState(false);

  const historyRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef<HTMLDivElement>(null);
  const rulesRef   = useRef<HTMLDivElement>(null);
  const debugRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (historyOpen && historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
      if (playersOpen && playersRef.current && !playersRef.current.contains(e.target as Node)) {
        setPlayersOpen(false);
      }
      if (rulesOpen && rulesRef.current && !rulesRef.current.contains(e.target as Node)) {
        setRulesOpen(false);
      }
      if (debugOpen && debugRef.current && !debugRef.current.contains(e.target as Node)) {
        setDebugOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [historyOpen, playersOpen, rulesOpen, debugOpen]);

  return (
    <div className="relative shrink-0 z-50">
      <header className="bg-stone-800 text-amber-50 px-4 py-2 flex items-center justify-between gap-2 shadow-lg">
        {/* Right side: title + turn info */}
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-lg font-bold text-amber-300">סים-באבא</h1>
          <span className="text-stone-300 text-sm whitespace-nowrap">
            תור {turnNumber} — {currentPlayerName}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* End turn with confirmation */}
          {!confirmEndTurn ? (
            <button
              onClick={() => setConfirmEndTurn(true)}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow"
            >
              סיים תור
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-green-900/80 border border-green-700 rounded-lg px-2.5 py-1">
              <span className="text-green-200 text-xs font-medium whitespace-nowrap">אתה בטוח?</span>
              <button
                onClick={() => { onEndTurn(); setConfirmEndTurn(false); }}
                className="bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded text-xs font-bold transition-colors"
              >
                כן
              </button>
              <button
                onClick={() => setConfirmEndTurn(false)}
                className="bg-stone-600 hover:bg-stone-500 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                לא
              </button>
            </div>
          )}

          <div className="w-px h-5 bg-stone-600 shrink-0" />

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="bg-blue-700 hover:bg-blue-600 disabled:bg-stone-600 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap"
          >
            בטל פעולה
          </button>

          {/* Rules dropdown */}
          <div ref={rulesRef} className="relative">
            <button
              onClick={() => setRulesOpen((o) => !o)}
              className="bg-stone-600 hover:bg-stone-500 text-white px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap"
            >
              הוראות {rulesOpen ? "▲" : "▼"}
            </button>
            {rulesOpen && (
              <div className="absolute left-0 top-full mt-1 w-96 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="px-4 py-2.5 text-xs font-bold text-amber-400 border-b border-stone-700">
                  סים-באבא — הוראות משחק
                </div>
                <div className="px-4 py-3 overflow-y-auto max-h-[70vh]">
                  <RulesContent />
                </div>
              </div>
            )}
          </div>

          {/* History dropdown */}
          <div ref={historyRef} className="relative">
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="bg-stone-600 hover:bg-stone-500 text-white px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap"
            >
              היסטוריה {historyOpen ? "▲" : "▼"}
            </button>
            {historyOpen && (
              <div className="absolute left-0 top-full mt-1 w-96 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="px-3 py-2 text-xs font-bold text-stone-400 border-b border-stone-700">
                  יומן משחק ({log.length} רשומות)
                </div>
                <div className="overflow-y-auto max-h-72 log-scroll">
                  {log.length === 0 ? (
                    <p className="text-stone-500 text-xs px-3 py-2">אין רשומות עדיין</p>
                  ) : (
                    [...log].reverse().map((entry, i) => (
                      <div key={i} className="text-xs text-stone-300 px-3 py-1.5 border-b border-stone-800 last:border-0 hover:bg-stone-800">
                        {entry}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Players dropdown */}
          <div ref={playersRef} className="relative">
            <button
              onClick={() => setPlayersOpen((o) => !o)}
              className="bg-stone-600 hover:bg-stone-500 text-white px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap"
            >
              שחקנים {playersOpen ? "▲" : "▼"}
            </button>
            {playersOpen && (
              <div className="absolute left-0 top-full mt-1 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl p-3 flex gap-3 overflow-x-auto max-w-[90vw]">
                {players.map((p, i) => (
                  <PlayerSummaryCard
                    key={p.id}
                    player={p}
                    factions={factions}
                    isCurrent={i === currentPlayerIndex}
                    allCardDefs={allCardDefs}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-stone-600 shrink-0" />

          {/* Reload */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onReloadCards}
              disabled={reloadState === "loading"}
              className="bg-stone-600 hover:bg-stone-500 disabled:bg-stone-700 disabled:cursor-wait text-white px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              {reloadState === "loading" && (
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              רענן קלפים
            </button>
            {reloadState === "success" && <span className="text-emerald-400 text-xs">✓ עודכנו</span>}
            {reloadState === "error" && reloadError && (
              <span className="text-red-400 text-xs max-w-28 truncate" title={reloadError}>✗ שגיאה</span>
            )}
          </div>

          <button
            onClick={onSave}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap"
          >
            שמור משחק
          </button>

          <button
            onClick={onReset}
            className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap"
          >
            איפוס משחק
          </button>

          {/* Debug dropdown — only rendered when debugJson is provided */}
          {debugJson !== undefined && (
            <div ref={debugRef} className="relative">
              <button
                onClick={() => setDebugOpen((o) => !o)}
                className="bg-stone-700 hover:bg-stone-600 text-stone-400 hover:text-stone-200 px-2 py-1.5 rounded text-xs transition-colors"
              >
                ⚙
              </button>
              {debugOpen && (
                <div className="absolute left-0 top-full mt-1 w-96 max-h-72 bg-stone-900 border border-stone-700 rounded-lg overflow-auto shadow-2xl" dir="ltr">
                  <pre className="p-3 text-[10px] text-stone-300">{debugJson}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
