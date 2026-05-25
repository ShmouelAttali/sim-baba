import { useState } from "react";

interface Props {
  currentPlayerName: string;
  turnNumber: number;
  log: string[];
  onEndTurn: () => void;
  onDraw5: () => void;
  onShuffleDiscardToDeck: () => void;
}

const TURN_STEPS = [
  { num: 1, label: "פתיחת צרות", desc: "קלפי צרה ביד מודגשים — טפל בהם ידנית" },
  { num: 2, label: "משחק קלפים", desc: "שחק / לחלוב / העמד בחצר" },
  { num: 3, label: "ניסים ויכולות", desc: "הפעל יכולות פלגה ידנית" },
  { num: 4, label: "ביצוע מופתים", desc: "לחץ \"בצע מופת\" על קלפי מופת בשוק" },
  { num: 5, label: "קנייה", desc: "קנה מהשוק הכללי, הפרטי, ומופתים" },
  { num: 6, label: "סיום תור", desc: "לחץ \"סיים תור\" למטה" },
];

export default function TurnControls({ currentPlayerName, turnNumber, log, onEndTurn, onDraw5, onShuffleDiscardToDeck }: Props) {
  const [stepsOpen, setStepsOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Turn steps collapsible */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setStepsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-stone-100 transition-colors"
        >
          <span className="font-medium text-stone-700 text-sm">שלבי התור</span>
          <span className="text-stone-400">{stepsOpen ? "▲" : "▼"}</span>
        </button>
        {stepsOpen && (
          <div className="px-3 pb-3 space-y-1">
            {TURN_STEPS.map((s) => (
              <div key={s.num} className="flex gap-2 items-start text-sm">
                <span className="bg-stone-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  {s.num}
                </span>
                <div>
                  <span className="font-medium text-stone-700">{s.label}</span>
                  <span className="text-stone-500 text-xs mr-2">— {s.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onDraw5}
          className="bg-stone-600 hover:bg-stone-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          שלוף 5
        </button>
        <button
          onClick={onShuffleDiscardToDeck}
          className="bg-stone-600 hover:bg-stone-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          ערבב זרוקים לדק
        </button>
      </div>

      {/* End turn */}
      <button
        onClick={onEndTurn}
        className="w-full bg-stone-800 hover:bg-stone-700 text-amber-100 py-3 rounded-xl text-lg font-bold transition-colors shadow-md"
      >
        סיים תור — {currentPlayerName} (תור {turnNumber})
      </button>

      {/* Log */}
      <div className="bg-stone-900 rounded-xl p-3 h-40 overflow-y-auto log-scroll">
        <div className="text-xs text-stone-400 mb-1 font-medium">יומן משחק</div>
        {[...log].reverse().map((entry, i) => (
          <div key={i} className="text-xs text-stone-300 py-0.5 border-b border-stone-800 last:border-0">
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}
