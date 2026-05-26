import type { CardDef, CardInstance } from "../types/game";

interface Props {
  instance: CardInstance;
  def: CardDef;
  location: "hand" | "played" | "yard" | "discard" | "market-general" | "market-faction" | "market-mofet" | "mofets";
  playerMoney?: number;
  playerMilk?: number;
  onAction?: (action: string, instanceId: string) => void;
  isNew?: boolean;
  extraClass?: string;
  compact?: boolean;
  mofetDisabled?: boolean;
  isPlayed?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  action:      "פעולה",
  person:      "איש",
  institution: "מוסד",
  trouble:     "צרה",
  mofet:       "מופת",
  helper:      "עזר",
};

const TYPE_BG: Record<string, string> = {
  action:      "#f0f4ff",
  person:      "#f0fdf4",
  institution: "#fefce8",
  trouble:     "#fff1f2",
  mofet:       "#faf5ff",
  helper:      "#f9fafb",
};

const TYPE_BORDER_COLOR: Record<string, string> = {
  action:      "#93c5fd",
  person:      "#86efac",
  institution: "#fde047",
  trouble:     "#fca5a5",
  mofet:       "#d8b4fe",
  helper:      "#d1d5db",
};

const TYPE_BADGE_BG: Record<string, string> = {
  action:      "#3b82f6",
  person:      "#22c55e",
  institution: "#eab308",
  trouble:     "#ef4444",
  mofet:       "#a855f7",
  helper:      "#6b7280",
};

const FACTION_LABELS: Record<string, string> = {
  baba:    "באבא",
  breslov: "ברסלב",
  chabad:  'חב"ד',
  litvaks: "ליטאים",
  general: "כללי",
  all:     "כל הפלגות",
};

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  "נס":           { bg: "#fef3c7", text: "#92400e" },
  "מבצע":         { bg: "#dbeafe", text: "#1e40af" },
  "לימוד":        { bg: "#dcfce7", text: "#166534" },
  "לומד":         { bg: "#bbf7d0", text: "#14532d" },
  "מוסד לימוד":   { bg: "#a7f3d0", text: "#065f46" },
  "שליח":         { bg: "#e0e7ff", text: "#3730a3" },
  "חברותא":       { bg: "#ede9fe", text: "#5b21b6" },
  "ריקוד":        { bg: "#fce7f3", text: "#9d174d" },
  "שמחה":         { bg: "#fdf2f8", text: "#86198f" },
  "התבודדות":     { bg: "#f0fdf4", text: "#166534" },
  "גבאי":         { bg: "#fafafa", text: "#374151" },
  "תורם":         { bg: "#fff7ed", text: "#9a3412" },
  "הפצה":         { bg: "#eff6ff", text: "#1d4ed8" },
  "ניגון":        { bg: "#fdf4ff", text: "#7e22ce" },
  "ניהול":        { bg: "#f8fafc", text: "#475569" },
  "כסף":          { bg: "#fefce8", text: "#713f12" },
  "חסד":          { bg: "#f0fdf4", text: "#15803d" },
  "צרה":          { bg: "#fff1f2", text: "#9f1239" },
  "מופת":         { bg: "#faf5ff", text: "#7c3aed" },
  "הילולה":       { bg: "#fff7ed", text: "#c2410c" },
  "נסיעה":        { bg: "#eff6ff", text: "#1e40af" },
  "סיפור":        { bg: "#fdf4ff", text: "#6d28d9" },
  "הנהגה":        { bg: "#f1f5f9", text: "#334155" },
  "מוסר":         { bg: "#f0fdf4", text: "#166534" },
  "קאמבק":        { bg: "#fff1f2", text: "#be123c" },
  "ציפיות":       { bg: "#fffbeb", text: "#b45309" },
};

// ── Effect badge ──────────────────────────────────────────────────────────────

type BadgeVariant = "gain" | "cost" | "danger";

interface BadgeProps {
  icon: string;
  label: string;
  variant: BadgeVariant;
  small?: boolean;
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  gain:   { bg: "#dcfce7", color: "#166534" },
  cost:   { bg: "#fef3c7", color: "#92400e" },
  danger: { bg: "#fee2e2", color: "#991b1b" },
};

function EffectBadge({ icon, label, variant, small = false }: BadgeProps) {
  const { bg, color } = BADGE_STYLES[variant];
  return (
    <span
      style={{
        backgroundColor: bg,
        color,
        borderRadius: "9999px",
        padding: small ? "1px 5px" : "2px 8px",
        fontSize: small ? "10px" : "12px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
      }}
    >
      {icon} {label}
    </span>
  );
}

// ── Effect section ────────────────────────────────────────────────────────────

function EffectSection({ def, compact }: { def: CardDef; compact: boolean }) {
  const isTrouble = def.type === "trouble";
  const isHelper  = def.type === "helper";

  const sm = compact;
  const sectionLabelStyle = { fontSize: "11px", fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" } as const;
  const proseClass     = compact ? "text-[11px] leading-tight text-stone-600 line-clamp-3 mt-0.5" : "text-xs leading-tight text-stone-600 mt-0.5";
  const yardProseClass = compact ? "text-[11px] leading-tight text-emerald-700 line-clamp-3 mt-0.5" : "text-xs leading-tight text-emerald-700 mt-0.5";

  // Trouble: always prose
  if (isTrouble) {
    return def.effectText ? (
      <div
        className={compact ? "text-[11px] text-red-800 bg-red-50 rounded px-1.5 py-1 leading-tight line-clamp-4" : "text-xs text-red-800 bg-red-50 rounded px-1.5 py-1 leading-tight"}
        title={def.effectText}
      >
        <span style={{ fontWeight: 600 }}>⚠️ כשנחשף: </span>{def.effectText}
      </div>
    ) : null;
  }

  // Helper: effectText prose only
  if (isHelper) {
    return def.effectText ? (
      <div
        className={compact ? "text-[11px] text-stone-600 leading-tight line-clamp-3" : "text-xs text-stone-600 leading-tight"}
        title={def.effectText}
      >
        {def.effectText}
      </div>
    ) : null;
  }

  const hasBadges =
    def.costMilkPlay !== undefined ||
    def.gainMoney    !== undefined ||
    def.gainFollowers !== undefined ||
    def.gainMilk     !== undefined ||
    (def.gainDanger !== undefined && def.gainDanger !== 0) ||
    def.gainDraw     !== undefined;

  const hasPlaySection = hasBadges || !!def.milkText || !!def.effectText;
  const hasYardSection = def.yardInfra !== undefined || !!def.yardText;

  if (!hasPlaySection && !hasYardSection) return null;

  return (
    <div className="space-y-1.5">
      {hasPlaySection && (
        <div>
          <div className="flex flex-wrap items-center gap-1">
            <span style={sectionLabelStyle}>🎯 לשחק:</span>
            {def.costMilkPlay !== undefined && (
              <EffectBadge icon="🥛" label={`עלות: ${def.costMilkPlay}`} variant="cost" small={sm} />
            )}
            {def.gainMoney !== undefined && (
              <EffectBadge icon="💰" label={`+${def.gainMoney}`} variant="gain" small={sm} />
            )}
            {def.gainFollowers !== undefined && (
              <EffectBadge icon="👥" label={`+${def.gainFollowers}`} variant="gain" small={sm} />
            )}
            {def.gainMilk !== undefined && (
              <EffectBadge icon="🥛" label={`+${def.gainMilk}`} variant="gain" small={sm} />
            )}
            {def.gainDanger !== undefined && def.gainDanger !== 0 && (
              def.gainDanger > 0
                ? <EffectBadge icon="⚠️" label={`+${def.gainDanger}`} variant="danger" small={sm} />
                : <EffectBadge icon="⚠️" label={`${def.gainDanger}`} variant="gain" small={sm} />
            )}
            {def.gainDraw !== undefined && (
              <EffectBadge icon="🎴" label={`+${def.gainDraw}`} variant="gain" small={sm} />
            )}
          </div>
          {def.milkText && (
            <div className={proseClass} title={def.milkText}>{def.milkText}</div>
          )}
          {!hasBadges && !def.milkText && def.effectText && (
            <div
              className={compact ? "text-[11px] text-amber-800 leading-tight line-clamp-5" : "text-xs text-stone-700 bg-amber-50 rounded px-1.5 py-1 leading-tight"}
              title={def.effectText}
            >
              {def.effectText}
            </div>
          )}
        </div>
      )}

      {hasYardSection && (
        <div>
          <div className="flex flex-wrap items-center gap-1">
            <span style={sectionLabelStyle}>🏡 לחצר:</span>
            {def.yardInfra !== undefined && (
              <EffectBadge icon="🏛️" label={`+${def.yardInfra}`} variant="gain" small={sm} />
            )}
          </div>
          {def.yardText && (
            <div className={yardProseClass} title={def.yardText}>{def.yardText}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main CardView ─────────────────────────────────────────────────────────────

export default function CardView({
  instance,
  def,
  location,
  playerMoney = 0,
  playerMilk = 0,
  onAction,
  isNew = false,
  extraClass = "",
  compact = false,
  mofetDisabled = false,
  isPlayed = false,
}: Props) {
  const isTrouble     = def.type === "trouble";
  const isMofet       = def.type === "mofet";
  const inHandTrouble = isTrouble && location === "hand";
  const isMarket      = location === "market-general" || location === "market-faction" || location === "market-mofet";
  const isMofetMarket = location === "market-mofet";

  const canAffordMoney = (def.costMoney ?? 0) <= playerMoney;
  const canAffordMilk  = (def.costMilk  ?? 0) <= playerMilk;

  const bg          = TYPE_BG[def.type]           ?? "#f9fafb";
  const borderColor = TYPE_BORDER_COLOR[def.type] ?? "#d1d5db";
  const badgeBg     = TYPE_BADGE_BG[def.type]     ?? "#6b7280";

  const moneyShortage = (def.costMoney ?? 0) - playerMoney;
  const milkShortage  = (def.costMilk  ?? 0) - playerMilk;

  // First tag pill
  const tagPill = def.tags?.[0] ? (() => {
    const c = TAG_COLORS[def.tags![0]] ?? { bg: "#f3f4f6", text: "#374151" };
    return { bg: c.bg, text: c.text, label: def.tags![0] };
  })() : null;

  // ── Shared action buttons ────────────────────────────────────────────────
  const actionButtons = onAction ? (
    <div className="mt-auto pt-1 flex flex-col gap-1">
      {location === "hand" && (
        isPlayed ? (
          <button
            onClick={() => onAction("returnToHand", instance.instanceId)}
            className="bg-stone-500 hover:bg-stone-400 text-white px-1.5 py-1 rounded transition-colors text-xs"
          >
            החזר
          </button>
        ) : (
          <>
            <button
              onClick={() => onAction("play", instance.instanceId)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-1 rounded transition-colors text-xs"
            >
              שחק
            </button>
            {def.yardText && (
              <button
                onClick={() => onAction("yard", instance.instanceId)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-1.5 py-1 rounded transition-colors text-xs"
              >
                העמד בחצר
              </button>
            )}
          </>
        )
      )}
      {location === "played" && (
        <>
          <button
            onClick={() => onAction("returnToHand", instance.instanceId)}
            className="bg-stone-500 hover:bg-stone-400 text-white px-1.5 py-1 rounded transition-colors text-xs"
          >
            החזר ליד
          </button>
          <button
            onClick={() => onAction("discardFromPlayed", instance.instanceId)}
            className="bg-stone-300 hover:bg-stone-400 text-stone-700 px-1.5 py-1 rounded transition-colors text-xs"
          >
            השלך
          </button>
        </>
      )}
      {isMarket && (
        isMofetMarket && mofetDisabled ? (
          <button
            disabled
            title="כבר ביצעת מופת בתור זה"
            className="px-1.5 py-1 rounded text-stone-400 bg-stone-600 cursor-not-allowed leading-none text-xs"
          >
            כבר ביצעת מופת בתור זה
          </button>
        ) : (
          <button
            onClick={() => {
              if (location === "market-general") onAction("buy-general", instance.instanceId);
              else if (location === "market-faction") onAction("buy-faction", instance.instanceId);
              else onAction("buy-mofet", instance.instanceId);
            }}
            className={`px-1.5 py-1 rounded transition-colors text-white leading-none text-xs ${
              isMofetMarket
                ? canAffordMilk  ? "bg-purple-600 hover:bg-purple-500" : "bg-red-700 hover:bg-red-600"
                : canAffordMoney ? "bg-amber-600 hover:bg-amber-500"   : "bg-red-700 hover:bg-red-600"
            }`}
          >
            {isMofetMarket
              ? canAffordMilk  ? `בצע מופת (${def.costMilk} 🥛)`  : `חסר ${milkShortage} 🥛`
              : canAffordMoney ? `קנה (${def.costMoney} 💰)`       : `חסר ${moneyShortage} 💰`}
          </button>
        )
      )}
      {location === "yard" && (
        <button
          onClick={() => onAction("returnFromYard", instance.instanceId)}
          className="bg-stone-500 hover:bg-stone-400 text-white px-1.5 py-1 rounded transition-colors text-xs"
        >
          החזר לזרוקים
        </button>
      )}
      {location === "discard" && (
        <button
          onClick={() => onAction("returnFromDiscard", instance.instanceId)}
          className="bg-stone-400 hover:bg-stone-500 text-white px-1.5 py-1 rounded transition-colors text-xs"
        >
          החזר ליד
        </button>
      )}
      {location === "mofets" && (
        <button
          onClick={() => onAction("returnMofetToDiscard", instance.instanceId)}
          className="bg-stone-300 hover:bg-stone-400 text-stone-700 px-1.5 py-1 rounded transition-colors text-xs"
        >
          החזר לזרוקים
        </button>
      )}
    </div>
  ) : null;

  // ── COMPACT MODE ───────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className={`rounded-xl p-2 flex flex-col gap-1 shrink-0 card-hover ${inHandTrouble ? "danger-pulse" : ""} ${isNew ? "card-enter" : ""} ${extraClass}`}
        style={{
          width: "160px",
          minHeight: "200px",
          backgroundColor: bg,
          border: `${inHandTrouble ? "3px" : "2px"} solid ${borderColor}`,
          ...(isPlayed ? { opacity: 0.6, filter: "grayscale(80%)" } : {}),
        }}
      >
        {isPlayed && (
          <div className="text-center text-[10px] font-bold text-green-700 bg-green-100 rounded px-1 py-0.5 leading-none">
            שוחק ✓
          </div>
        )}

        {/* Name */}
        <div className="font-bold text-stone-800 leading-tight line-clamp-2" style={{ fontSize: "15px" }} title={def.name}>
          {def.name}
        </div>

        {/* Type badge + tag + cost */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-white px-1 py-0.5 rounded leading-none" style={{ fontSize: "11px", backgroundColor: badgeBg }}>
            {TYPE_LABELS[def.type]}
          </span>
          {tagPill && (
            <span style={{ backgroundColor: tagPill.bg, color: tagPill.text, fontSize: "10px", padding: "2px 6px", borderRadius: "9999px" }}>
              {tagPill.label}
            </span>
          )}
          {def.costMoney !== undefined && (
            <span className={`font-medium ${isMarket && !canAffordMoney ? "text-red-500" : "text-stone-600"}`} style={{ fontSize: "12px" }}>
              💰{def.costMoney}
            </span>
          )}
          {def.costMilk !== undefined && (
            <span className={`font-medium ${isMofetMarket && !canAffordMilk ? "text-red-500" : "text-stone-600"}`} style={{ fontSize: "12px" }}>
              🥛{def.costMilk}
            </span>
          )}
        </div>

        {/* Requirements */}
        {def.requirements && (
          <div className="text-stone-600 leading-tight line-clamp-2" style={{ fontSize: "12px" }} title={def.requirements}>
            {def.requirements}
          </div>
        )}

        {/* Effect */}
        <EffectSection def={def} compact={true} />

        {actionButtons}
      </div>
    );
  }

  // ── STANDARD MODE ──────────────────────────────────────────────────────────
  return (
    <div
      className={`rounded-xl p-3 flex flex-col gap-1.5 shrink-0 card-hover ${inHandTrouble ? "danger-pulse" : ""} ${isNew ? "card-enter" : ""} ${extraClass}`}
      style={{
        width: "200px",
        minHeight: "230px",
        backgroundColor: bg,
        border: `${inHandTrouble ? "3px" : "2px"} solid ${borderColor}`,
        ...(isPlayed ? { opacity: 0.6, filter: "grayscale(80%)" } : {}),
      }}
    >
      {isPlayed && (
        <div className="text-center text-[10px] font-bold text-green-700 bg-green-100 rounded px-1 py-0.5 leading-none">
          שוחק ✓
        </div>
      )}

      {/* Name + special badges */}
      <div className="flex items-start justify-between gap-0.5">
        <div className="font-bold text-stone-800 leading-tight line-clamp-2 flex-1" style={{ fontSize: "15px" }} title={def.name}>
          {def.name}
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          {inHandTrouble && <span className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded font-bold leading-none">⚠</span>}
          {isMofet && <span className="bg-purple-500 text-white text-[9px] px-1 py-0.5 rounded font-bold leading-none">✡</span>}
        </div>
      </div>

      {/* Type badge + faction + tag + cost */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-white text-[9px] px-1 py-0.5 rounded leading-none" style={{ backgroundColor: badgeBg }}>
          {TYPE_LABELS[def.type]}
        </span>
        <span className="bg-stone-100 text-stone-500 text-[9px] px-1 py-0.5 rounded leading-none">
          {FACTION_LABELS[def.faction]}
        </span>
        {tagPill && (
          <span style={{ backgroundColor: tagPill.bg, color: tagPill.text, fontSize: "9px", padding: "2px 5px", borderRadius: "9999px" }}>
            {tagPill.label}
          </span>
        )}
        {def.costMoney !== undefined && (
          <span className={`text-[10px] font-medium ${isMarket && !canAffordMoney ? "text-red-500" : "text-stone-600"}`}>
            💰{def.costMoney}
          </span>
        )}
        {def.costMilk !== undefined && (
          <span className={`text-[10px] font-medium ${isMofetMarket && !canAffordMilk ? "text-red-500" : "text-stone-600"}`}>
            🥛{def.costMilk}
          </span>
        )}
      </div>

      {/* Requirements */}
      {def.requirements && (
        <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-1 leading-tight" title={def.requirements}>
          {def.requirements}
        </div>
      )}

      {/* Effect */}
      <EffectSection def={def} compact={false} />

      {actionButtons}
    </div>
  );
}
