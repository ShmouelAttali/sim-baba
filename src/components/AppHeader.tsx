import { useState, useEffect, useRef } from "react";
import type { CardDef, FactionDef, PlayerState } from "../types/game";

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
                <div className="px-4 py-3 space-y-4 text-xs overflow-y-auto max-h-[70vh]">

                  {/* מהלך התור */}
                  <div>
                    <div className="text-amber-500 text-[11px] font-bold mb-2">━━━ מהלך התור ━━━</div>
                    <ol className="space-y-2 text-stone-300 list-none">
                      <li><span className="text-stone-400 font-semibold">1. פתיחת צרות</span>
                        <div className="text-stone-500 mt-0.5 space-y-0.5 pr-2">
                          <div>אם יש קלף צרה ביד — הוא נחשף ומופעל מיד.</div>
                          <div>אם חסידים &gt; תשתית: קבל 1 סכנה.</div>
                          <div>אם חסידים ≥ תשתית + 5: קבל 2 סכנה במקום.</div>
                          <div>אם הגעת ל-6+ סכנה — הפעל התפרצות (ראה להלן).</div>
                        </div>
                      </li>
                      <li><span className="text-stone-400 font-semibold">2. משחק קלפים</span>
                        <div className="text-stone-500 mt-0.5 space-y-0.5 pr-2">
                          <div>שחק קלפים מהיד: לחלוב (קבל את אפקט "לחלוב") או להעמיד בחצר.</div>
                          <div>קלפי איש ומוסד ניתן להעמיד בחצר — נשארים שם לכל המשחק ומוסיפים תשתית.</div>
                        </div>
                      </li>
                      <li><span className="text-stone-400 font-semibold">3. ניסים ויכולות</span>
                        <div className="text-stone-500 mt-0.5 pr-2">הפעל יכולות חצר ידנית לפי הטקסט על הקלפים.</div>
                      </li>
                      <li><span className="text-stone-400 font-semibold">4. ביצוע מופת</span>
                        <div className="text-stone-500 mt-0.5 space-y-0.5 pr-2">
                          <div>ניתן לבצע מופת אחד לכל היותר בתור.</div>
                          <div>בדוק את הדרישה — אם עומד בה, שלם את עלות החל״ב וקח את קלף המופת.</div>
                          <div>קלף המופת עובר לאזור המופתים שלך (לא לזרוקים).</div>
                        </div>
                      </li>
                      <li><span className="text-stone-400 font-semibold">5. קנייה</span>
                        <div className="text-stone-500 mt-0.5 space-y-0.5 pr-2">
                          <div>קנה קלפים מהשוק הכללי, השוק הפרטי של החצר שלך, או שוק המופתים.</div>
                          <div>קלפים שנקנו הולכים לזרוקים — לא ניתן להשתמש בהם באותו תור.</div>
                        </div>
                      </li>
                      <li><span className="text-stone-400 font-semibold">6. סיום תור</span>
                        <div className="text-stone-500 mt-0.5 space-y-0.5 pr-2">
                          <div>כסף מתאפס ל-0.</div>
                          <div>קלפים מהיד ומהשוחקו עוברים לזרוקים.</div>
                          <div>שלוף 5 קלפים חדשים.</div>
                          <div>אם הדק ריק — ערבב את הזרוקים לדק ואז שלוף.</div>
                        </div>
                      </li>
                    </ol>
                  </div>

                  {/* ניצחון */}
                  <div>
                    <div className="text-amber-500 text-[11px] font-bold mb-2">━━━ ניצחון ━━━</div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 text-base">🏆</span>
                        <div>
                          <div className="font-semibold text-purple-300">בעל-מופת</div>
                          <div className="text-stone-500 mt-0.5">הגע ל-3 מופתים. מנצח מיד עם המופת השלישי.</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 text-base">📚</span>
                        <div>
                          <div className="font-semibold text-blue-300">עולם התורה</div>
                          <div className="text-stone-500 mt-0.5">בתחילת תורך: 4 לומדים בחצר + 2 מוסדות לימוד בחצר + 25 חל״ב.</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 text-base">⚙️</span>
                        <div>
                          <div className="font-semibold text-amber-300">המכונה המשומנת</div>
                          <div className="text-stone-500 mt-0.5">בתחילת תורך: 3 אנשים בחצר + 2 מוסדות בחצר + 30 חסידים.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* מופתים */}
                  <div>
                    <div className="text-amber-500 text-[11px] font-bold mb-2">━━━ מופתים ━━━</div>
                    <div className="text-stone-500 space-y-1">
                      <div>בתחילת המשחק חושפים (מספר שחקנים × 2 + 1) מופתים.</div>
                      <div>המופתים אינם מתחדשים — אלה המופתים היחידים במשחק.</div>
                      <div>מותר לבצע מופת אחד לכל היותר בתור.</div>
                      <div>דרישות מופת הן בדיקה בלבד — לא תשלום.</div>
                      <div>עלות חל״ב של מופת משולמת בפועל.</div>
                    </div>
                  </div>

                  {/* סכנה */}
                  <div>
                    <div className="text-amber-500 text-[11px] font-bold mb-2">━━━ סכנה והתפרצות ━━━</div>
                    <div className="text-stone-500 space-y-1">
                      <div>אין בדיקת עומס בסוף תור.</div>
                      <div>רק קלפי צרה בודקים עומס — כשנחשפים בתחילת התור.</div>
                      <div className="pt-1 text-stone-400 font-medium">התפרצות (6+ סכנה):</div>
                      <div className="pr-2">אבד חסידים = חסידים פחות תשתית, עד מקסימום 8.</div>
                      <div className="pr-2">לאחר מכן סכנה חוזרת ל-3.</div>
                    </div>
                  </div>

                  {/* משאבים */}
                  <div>
                    <div className="text-amber-500 text-[11px] font-bold mb-2">━━━ משאבים ━━━</div>
                    <div className="text-stone-500 space-y-1">
                      <div><span className="text-stone-400 font-medium w-20 inline-block">כסף</span> — זמני. מתאפס בסוף כל תור.</div>
                      <div><span className="text-stone-400 font-medium w-20 inline-block">חל״ב</span> — קבוע. נשמר בין תורות. עלות מרכזית למופתים וניסים.</div>
                      <div><span className="text-stone-400 font-medium w-20 inline-block">חסידים</span> — קבוע. מנוע הניצחון.</div>
                      <div><span className="text-stone-400 font-medium w-20 inline-block">תשתית</span> — קבועה. מגיעה רק מקלפים בחצר. מגינה מפני סכנה.</div>
                      <div><span className="text-stone-400 font-medium w-20 inline-block">סכנה</span> — קבועה. מצטברת מצרות ואפקטים. שם הסכנה שונה לפי חצר.</div>
                    </div>
                  </div>

                  {/* ניסים */}
                  <div>
                    <div className="text-amber-500 text-[11px] font-bold mb-2">━━━ ניסים ━━━</div>
                    <div className="text-stone-500 space-y-1">
                      <div>נס הוא תגית על קלפים.</div>
                      <div>כל קלף נס כותב בטקסט שלו כמה חל״ב לשלם.</div>
                      <div>ליטאים אינם רשאים לשחק קלפי נס בכלל.</div>
                      <div>באבא: לפני תשלום נס, רשאי להסיר 1 ציפיות לנס כדי להפחית 1 חל״ב מעלות הנס. פעם אחת לנס.</div>
                    </div>
                  </div>

                  {/* יכולות חצר */}
                  <div>
                    <div className="text-amber-500 text-[11px] font-bold mb-2">━━━ יכולות חצר ━━━</div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-yellow-600 font-semibold">באבא — צינור פתוח</div>
                        <div className="text-stone-500 pr-2 mt-0.5">כשמשחקים נס, לפני תשלום, ניתן להסיר 1 ציפיות לנס להפחתת 1 חל״ב. פעם אחת לנס.</div>
                      </div>
                      <div>
                        <div className="text-purple-400 font-semibold">ברסלב — כאוס הוא דלק</div>
                        <div className="text-stone-500 pr-2 mt-0.5">קלפי ברסלב ממירים כאוס לחסידים, חל״ב ושליפה.</div>
                      </div>
                      <div>
                        <div className="text-orange-400 font-semibold">חב״ד — מבצע גורר מבצע</div>
                        <div className="text-stone-500 pr-2 mt-0.5 space-y-0.5">
                          <div>בפעם הראשונה בכל תור שמבצע נותן חסיד — שלוף קלף.</div>
                          <div>עם 2+ שליחים בחצר — יכולת זו יכולה לפעול פעם נוספת.</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-300 font-semibold">ליטאים — חברותא</div>
                        <div className="text-stone-500 pr-2 mt-0.5 space-y-0.5">
                          <div>בפעם הראשונה בכל תור שמשחקים קלף לימוד שני — קבל 2 חל״ב.</div>
                          <div>עם 2+ תלמידי חכמים בחצר — שלוף קלף גם כן.</div>
                          <div>ליטאים אינם רשאים לשחק קלפי נס.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* תגיות */}
                  <div>
                    <div className="text-amber-500 text-[11px] font-bold mb-2">━━━ תגיות חשובות ━━━</div>
                    <div className="text-stone-500 space-y-1">
                      <div><span className="text-stone-400 font-medium">נס</span> — קלף עם עלות חל״ב. ליטאים לא משחקים.</div>
                      <div><span className="text-stone-400 font-medium">מבצע</span> — קלף חב״די שמגייס חסידים. מפעיל שליפה.</div>
                      <div><span className="text-stone-400 font-medium">לימוד</span> — קלף תורני. משתלב עם חברותא וכולל.</div>
                      <div><span className="text-stone-400 font-medium">לומד</span> — כינוי לאיש שנחשב לומד (רלוונטי לעולם התורה).</div>
                      <div><span className="text-stone-400 font-medium">מוסד לימוד</span> — מוסד שנחשב מוסד לימוד (רלוונטי לעולם התורה).</div>
                      <div><span className="text-stone-400 font-medium">שליח</span> — כינוי לאיש שנחשב שליח (רלוונטי ליכולת חב״ד).</div>
                    </div>
                  </div>

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
