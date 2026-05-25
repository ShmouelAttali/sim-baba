import { useState } from "react";
import type { FactionDef, FactionId } from "../types/game";
import type { SetupPlayer } from "../utils/gameSetup";

interface Props {
  factions: FactionDef[];
  hasSavedGame: boolean;
  onStart: (players: SetupPlayer[]) => void;
  onContinue: () => void;
}

const FACTION_COLORS: Record<string, string> = {
  baba: "bg-purple-100 border-purple-400",
  breslov: "bg-yellow-100 border-yellow-400",
  chabad: "bg-orange-100 border-orange-400",
  litvaks: "bg-slate-100 border-slate-400",
};

export default function GameSetup({ factions, hasSavedGame, onStart, onContinue }: Props) {
  const [numPlayers, setNumPlayers] = useState(2);
  const [allowDuplicates, setAllowDuplicates] = useState(false);

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

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-stone-800 text-center mb-2">סים־באבא</h1>
        <p className="text-stone-500 text-center mb-8">שולחן פלייטסט</p>

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

        <div className="space-y-4 mb-6">
          {activePlayers.map((p, i) => (
            <div
              key={i}
              className={`border-2 rounded-xl p-4 ${FACTION_COLORS[p.factionId] ?? "bg-gray-50 border-gray-300"}`}
            >
              <div className="flex gap-3 items-center">
                <span className="text-stone-600 font-medium w-16">שחקן {i + 1}</span>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => setPlayerName(i, e.target.value)}
                  placeholder={factions.find((f) => f.id === p.factionId)?.name ?? "שם שחקן"}
                  className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <select
                  value={p.factionId}
                  onChange={(e) => setPlayerFaction(i, e.target.value as FactionId)}
                  className="border border-stone-300 rounded-lg px-3 py-1.5 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  {factions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            id="allowDuplicates"
            checked={allowDuplicates}
            onChange={(e) => setAllowDuplicates(e.target.checked)}
            className="w-4 h-4 accent-stone-700"
          />
          <label htmlFor="allowDuplicates" className="text-stone-700">
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
    </div>
  );
}
