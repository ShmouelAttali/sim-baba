export function RulesContent() {
  return (
    <div className="space-y-4 text-xs">

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
  );
}
