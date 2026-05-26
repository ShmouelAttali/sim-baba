import { useState } from "react";
import type { FactionDef, FactionId } from "../types/game";
import type { SetupPlayer } from "../utils/gameSetup";
import { RulesContent } from "./RulesContent";

interface Props {
  factions: FactionDef[];
  hasSavedGame: boolean;
  onStart: (players: SetupPlayer[]) => void;
  onContinue: () => void;
}

const FACTION_STYLES: Record<string, {
  headerBg: string;
  border: string;
  lightBg: string;
  text: string;
  btnBg: string;
  barBg: string;
}> = {
  baba:    { headerBg: "bg-amber-700",  border: "border-amber-400",  lightBg: "bg-amber-50",  text: "text-amber-900",  btnBg: "bg-amber-600 hover:bg-amber-500",  barBg: "bg-amber-500"  },
  breslov: { headerBg: "bg-purple-700", border: "border-purple-400", lightBg: "bg-purple-50", text: "text-purple-900", btnBg: "bg-purple-600 hover:bg-purple-500", barBg: "bg-purple-500" },
  chabad:  { headerBg: "bg-orange-600", border: "border-orange-400", lightBg: "bg-orange-50", text: "text-orange-900", btnBg: "bg-orange-500 hover:bg-orange-400", barBg: "bg-orange-500" },
  litvaks: { headerBg: "bg-slate-700",  border: "border-slate-400",  lightBg: "bg-slate-50",  text: "text-slate-900",  btnBg: "bg-slate-600 hover:bg-slate-500",  barBg: "bg-slate-500"  },
};

const FACTION_ORDER: FactionId[] = ["baba", "breslov", "chabad", "litvaks"];

export default function GameSetup({ factions, hasSavedGame, onStart, onContinue }: Props) {
  const [numPlayers, setNumPlayers] = useState(2);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [factionModalForPlayer, setFactionModalForPlayer] = useState<number | null>(null);

  const defaultFactionIds = factions.slice(0, 4).map((f) => f.id as FactionId);

  const [players, setPlayers] = useState<SetupPlayer[]>([
    { name: "", factionId: defaultFactionIds[0] ?? "baba" },
    { name: "", factionId: defaultFactionIds[1] ?? "breslov" },
    { name: "", factionId: defaultFactionIds[2] ?? "chabad" },
    { name: "", factionId: defaultFactionIds[3] ?? "litvaks" },
  ]);

  const activePlayers = players.slice(0, numPlayers);
  const selectedFactions = activePlayers.map((p) => p.factionId);
  const hasDuplicates = !allowDuplicates && new Set(selectedFactions).size < selectedFactions.length;

  function setPlayerName(i: number, name: string) {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, name } : p)));
  }

  function setPlayerFaction(i: number, factionId: FactionId) {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, factionId } : p)));
  }

  function handleStart() {
    if (hasDuplicates) return;
    onStart(activePlayers);
  }

  function isFactionTaken(factionId: FactionId, excludePlayerIndex: number): boolean {
    if (allowDuplicates) return false;
    return activePlayers.some((p, i) => i !== excludePlayerIndex && p.factionId === factionId);
  }

  const selectableFactions = (() => {
    const ordered = FACTION_ORDER
      .map((id) => factions.find((f) => f.id === id))
      .filter((f): f is FactionDef => f !== undefined);
    const extras = factions.filter((f) => !FACTION_ORDER.includes(f.id as FactionId));
    return [...ordered, ...extras];
  })();

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">

        {/* Title row + rules button */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">סים־באבא</h1>
            <p className="text-stone-500 text-sm mt-1">שולחן פלייטסט</p>
          </div>
          <button
            onClick={() => setRulesOpen(true)}
            className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 px-4 py-2 rounded-xl font-medium transition-colors text-sm shrink-0"
          >
            📖 הוראות המשחק
          </button>
        </div>

        {hasSavedGame && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-amber-800 font-medium">נמצא משחק שמור</span>
            <button
              onClick={onContinue}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              המשך משחק קיים
            </button>
          </div>
        )}

        {/* Number of players */}
        <div className="mb-6">
          <label className="block text-stone-700 font-medium mb-2">מספר שחקנים</label>
          <div className="flex gap-3">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setNumPlayers(n)}
                className={`px-6 py-2 rounded-lg border-2 font-medium transition-colors ${
                  numPlayers === n
                    ? "bg-stone-800 text-white border-stone-800"
                    : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Player slots */}
        <div className="space-y-4 mb-6">
          {activePlayers.map((p, i) => {
            const faction = factions.find((f) => f.id === p.factionId);
            const style = FACTION_STYLES[p.factionId] ?? {
              headerBg: "bg-stone-700", border: "border-stone-400", lightBg: "bg-stone-50",
              text: "text-stone-900", btnBg: "bg-stone-600 hover:bg-stone-500", barBg: "bg-stone-500",
            };
            return (
              <div key={i} className={`border-2 rounded-xl overflow-hidden ${style.border}`}>
                {/* Name row */}
                <div className={`${style.lightBg} px-4 py-2.5 flex gap-3 items-center border-b border-stone-200/60`}>
                  <span className="text-stone-500 font-medium text-sm w-14 shrink-0">שחקן {i + 1}</span>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => setPlayerName(i, e.target.value)}
                    placeholder={faction?.name ?? "שם שחקן"}
                    className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm"
                  />
                </div>
                {/* Faction summary tile */}
                <div className={`${style.lightBg} px-4 py-3`}>
                  {faction ? (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.barBg}`} />
                          <span className={`font-bold text-base ${style.text}`}>{faction.name}</span>
                        </div>
                        <div className={`text-xs flex flex-wrap gap-x-3 gap-y-0.5 ${style.text} opacity-70 mb-1`}>
                          <span>⚠️ {faction.dangerName}</span>
                          <span>🏛️ {faction.startingInfrastructure}</span>
                          <span>👥 {faction.startingFollowers}</span>
                        </div>
                        {faction.abilityName && (
                          <div className={`text-xs ${style.text} opacity-60 truncate`}>✨ {faction.abilityName}</div>
                        )}
                      </div>
                      <button
                        onClick={() => setFactionModalForPlayer(i)}
                        className="shrink-0 text-xs bg-white border border-stone-300 hover:border-stone-400 hover:bg-stone-50 px-3 py-1.5 rounded-lg transition-colors text-stone-600 font-medium"
                      >
                        שנה חצר
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <button
                        onClick={() => setFactionModalForPlayer(i)}
                        className="bg-stone-800 hover:bg-stone-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
                      >
                        בחר חצר
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Duplicates checkbox */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            id="allowDuplicates"
            checked={allowDuplicates}
            onChange={(e) => setAllowDuplicates(e.target.checked)}
            className="w-4 h-4 accent-stone-700"
          />
          <label htmlFor="allowDuplicates" className="text-stone-700 text-sm">
            אפשר פלגות כפולות
          </label>
        </div>

        {hasDuplicates && (
          <p className="text-red-600 text-sm mb-4">שתי פלגות זהות — אפשר פלגות כפולות או שנה בחירה</p>
        )}

        <button
          onClick={handleStart}
          disabled={hasDuplicates}
          className="w-full bg-stone-800 hover:bg-stone-700 disabled:bg-stone-400 disabled:cursor-not-allowed text-white py-3 rounded-xl text-lg font-bold transition-colors"
        >
          התחל משחק
        </button>
      </div>

      {/* ── Rules modal ─────────────────────────────────────────────────────── */}
      {rulesOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setRulesOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 shrink-0">
              <h2 className="font-bold text-stone-800 text-lg">הוראות המשחק — סים-באבא</h2>
              <button
                onClick={() => setRulesOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
              >
                ✕
              </button>
            </div>
            {/* Dark content area — same styling as in-game rules */}
            <div className="flex-1 overflow-y-auto bg-stone-900 rounded-b-2xl">
              <div className="px-5 py-4">
                <RulesContent />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Faction selection modal ──────────────────────────────────────────── */}
      {factionModalForPlayer !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setFactionModalForPlayer(null)}
        >
          <div
            className="bg-stone-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-stone-200 shrink-0">
              <h2 className="font-bold text-stone-800 text-lg">
                בחר חצר לשחקן {factionModalForPlayer + 1}
              </h2>
              <button
                onClick={() => setFactionModalForPlayer(null)}
                className="text-stone-400 hover:text-stone-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-4">
                {selectableFactions.map((faction) => {
                  const taken = isFactionTaken(faction.id, factionModalForPlayer);
                  const isSelected = players[factionModalForPlayer]?.factionId === faction.id;
                  const style = FACTION_STYLES[faction.id] ?? {
                    headerBg: "bg-stone-700", border: "border-stone-400", lightBg: "bg-white",
                    text: "text-stone-900", btnBg: "bg-stone-600 hover:bg-stone-500", barBg: "bg-stone-500",
                  };
                  return (
                    <div
                      key={faction.id}
                      className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${style.border} ${
                        !taken ? "hover:shadow-lg hover:scale-[1.01] cursor-pointer" : "opacity-60"
                      } ${isSelected ? "ring-2 ring-offset-1 ring-stone-700" : ""}`}
                      onClick={() => {
                        if (taken) return;
                        setPlayerFaction(factionModalForPlayer, faction.id);
                        setFactionModalForPlayer(null);
                      }}
                    >
                      {/* Faction header */}
                      <div className={`${style.headerBg} text-white px-4 py-3 text-center`}>
                        <h3 className="font-bold text-xl">{faction.name}</h3>
                      </div>

                      {/* Stats + ability + outburst */}
                      <div className="px-4 py-3 space-y-2 text-sm">
                        <div className="flex flex-wrap gap-3 text-stone-600 text-xs">
                          <span>🏛️ תשתית: <strong>{faction.startingInfrastructure}</strong></span>
                          <span>👥 חסידים: <strong>{faction.startingFollowers}</strong></span>
                          {faction.startingMilk ? <span>🥛 חל"ב: <strong>{faction.startingMilk}</strong></span> : null}
                        </div>
                        <div className="text-stone-600 text-xs">⚠️ סכנה: <strong>{faction.dangerName}</strong></div>

                        <hr className="border-stone-200" />

                        <div>
                          <div className={`font-semibold text-sm ${style.text}`}>
                            ✨ יכולת{faction.abilityName ? `: ${faction.abilityName}` : ""}
                          </div>
                          <div className="text-stone-500 text-xs mt-0.5 leading-relaxed">{faction.abilityText}</div>
                        </div>

                        <hr className="border-stone-200" />

                        <div>
                          <div className="font-semibold text-xs text-red-700">💥 התפרצות (6+ סכנה):</div>
                          <div className="text-stone-500 text-xs mt-0.5 leading-relaxed">{faction.outburstText}</div>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="px-4 pb-4">
                        {taken ? (
                          <div className="w-full bg-stone-200 text-stone-500 py-2 rounded-lg text-center text-sm font-medium">
                            תפוס
                          </div>
                        ) : (
                          <div
                            className={`w-full ${style.btnBg} text-white py-2 rounded-lg text-sm font-bold text-center transition-colors`}
                          >
                            {isSelected ? "✓ נבחר" : "בחר חצר זו"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
