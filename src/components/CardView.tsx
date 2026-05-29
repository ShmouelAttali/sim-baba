import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  cardSize?: "large" | "landscape" | "compact";
  mofetDisabled?: boolean;
  isPlayed?: boolean;
  invertEffects?: boolean;
  buyAndMofetBlocked?: boolean;
  fillWidth?: boolean;
  truncateText?: boolean;
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

const BANNER_GRADIENT: Record<string, string> = {
  action:      "linear-gradient(135deg, #1e3a8a, #2563eb)",
  person:      "linear-gradient(135deg, #14532d, #16a34a)",
  institution: "linear-gradient(135deg, #78350f, #d97706)",
  trouble:     "linear-gradient(135deg, #7f1d1d, #dc2626)",
  mofet:       "linear-gradient(135deg, #581c87, #9333ea)",
  helper:      "linear-gradient(135deg, #1f2937, #4b5563)",
};

const COST_CIRCLE_BG: Record<string, string> = {
  action:      "#2563eb",
  person:      "#16a34a",
  institution: "#ca8a04",
  trouble:     "#dc2626",
  mofet:       "#9333ea",
  helper:      "#4b5563",
};

const CONTENT_BG: Record<string, string> = {
  action:      "#f0f7ff",
  person:      "#f0fdf4",
  institution: "#fefce8",
  trouble:     "#fff5f5",
  mofet:       "#fdf4ff",
  helper:      "#f9fafb",
};

const TYPE_PLACEHOLDERS: Record<string, { bg: string; emoji: string }> = {
  action:      { bg: "#dbeafe", emoji: "⚡" },
  person:      { bg: "#dcfce7", emoji: "👤" },
  institution: { bg: "#fef9c3", emoji: "🏛️" },
  trouble:     { bg: "#fee2e2", emoji: "⚠️" },
  mofet:       { bg: "#f3e8ff", emoji: "✨" },
  helper:      { bg: "#f3f4f6", emoji: "📋" },
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
        padding: small ? "1px 5px" : "3px 8px",
        fontSize: small ? "10px" : "12px",
        fontWeight: 700,
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

function EffectSection({ def, compact }: { def: CardDef; compact: boolean }) {
  const isTrouble = def.type === "trouble";
  const isHelper  = def.type === "helper";

  const sm = compact;
  const sectionLabelStyle = { fontSize: "11px", fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" } as const;
  const proseClass     = compact ? "text-[11px] leading-tight text-stone-600 line-clamp-3 mt-0.5" : "text-xs leading-tight text-stone-600 mt-0.5";
  const yardProseClass = compact ? "text-[11px] leading-tight text-emerald-700 line-clamp-3 mt-0.5" : "text-xs leading-tight text-emerald-700 mt-0.5";

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

export function optimizeCloudinaryUrl(url: string | undefined): string | undefined {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/w_600,q_80,f_auto/');
}

function CardImage({ def, large }: { def: CardDef; large: boolean }) {
  const placeholder = TYPE_PLACEHOLDERS[def.type] ?? { bg: "#f3f4f6", emoji: "🃏" };
  if (def.imageUrl) {
    return (
      <img
        src={optimizeCloudinaryUrl(def.imageUrl)}
        alt={def.name}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: placeholder.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: large ? "56px" : "24px",
    }}>
      {placeholder.emoji}
    </div>
  );
}

// ── COMPACT CARD (yard + mofets) ─────────────────────────────────────────────

function CompactCard({
  instance, def, location, playerMoney = 0, playerMilk = 0,
  onAction, mofetDisabled = false, buyAndMofetBlocked = false,
}: {
  instance: CardInstance;
  def: CardDef;
  location: "yard" | "market-mofet" | "mofets";
  playerMoney?: number;
  playerMilk?: number;
  onAction?: (action: string, instanceId: string) => void;
  mofetDisabled?: boolean;
  buyAndMofetBlocked?: boolean;
}) {
  const [hoverVisible, setHoverVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; w: number; h: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  function handleMouseEnter() {
    hoverTimer.current = setTimeout(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      // Match hand-card-slot: (75vw - 32px padding - 5×12px gaps) / 5.5, aspect 2/3
      const previewW = Math.max(160, Math.min(400, (window.innerWidth * 0.75 - 92) / 5.5));
      const previewH = previewW * 1.5;
      const margin = 12;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Horizontal: prefer right side; fall back to left
      let left = rect.right + margin;
      if (left + previewW > vw - margin) {
        left = rect.left - previewW - margin;
      }
      left = Math.max(margin, Math.min(left, vw - previewW - margin));

      // Vertical: card in bottom half of screen → show preview above
      let top: number;
      if (rect.top > vh / 2) {
        top = rect.top - previewH - margin;
      } else {
        top = rect.top;
      }
      top = Math.max(margin, Math.min(top, vh - previewH - margin));

      setTooltipPos({ top, left, w: previewW, h: previewH });
      setHoverVisible(true);
    }, 300);
  }

  function handleMouseLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverVisible(false);
    setTooltipPos(null);
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverVisible(false);
    setModalOpen(true);
  }

  const borderColor = TYPE_BORDER_COLOR[def.type] ?? "#d1d5db";
  const badgeBg     = TYPE_BADGE_BG[def.type]     ?? "#6b7280";
  const isCurse     = def.source === "curse_deck";
  const isMofetMarket = location === "market-mofet";
  const canAffordMilk = (def.costMilk ?? 0) <= playerMilk;

  const iconBadgesCompact: { icon: string; v: string }[] = [];
  if (def.gainMoney     !== undefined) iconBadgesCompact.push({ icon: "💰", v: `+${def.gainMoney}` });
  if (def.gainFollowers !== undefined) iconBadgesCompact.push({ icon: "👥", v: `+${def.gainFollowers}` });
  if (def.gainMilk      !== undefined) iconBadgesCompact.push({ icon: "🥛", v: `+${def.gainMilk}` });
  if (def.gainDanger !== undefined && def.gainDanger !== 0) iconBadgesCompact.push({ icon: "⚠️", v: `${def.gainDanger > 0 ? "+" : ""}${def.gainDanger}` });
  if (def.gainDraw      !== undefined) iconBadgesCompact.push({ icon: "🎴", v: `+${def.gainDraw}` });
  if (def.yardInfra     !== undefined) iconBadgesCompact.push({ icon: "🏛️", v: `+${def.yardInfra}` });
  const hasTextContent = !!def.milkText || !!def.yardText || !!def.effectText;

  const actionBtn = onAction ? (
    location === "yard" ? (
      <button
        onClick={(e) => { e.stopPropagation(); onAction("returnFromYard", instance.instanceId); }}
        style={{ background: "#78716c", color: "white", borderRadius: "5px", padding: "3px 0", fontSize: "10px", fontWeight: 600, border: "none", cursor: "pointer", width: "100%" }}
      >
        החזר
      </button>
    ) : isMofetMarket ? (
      buyAndMofetBlocked ? (
        <button disabled style={{ background: "#4b5563", color: "#9ca3af", borderRadius: "5px", padding: "3px 0", fontSize: "10px", border: "none", cursor: "not-allowed", width: "100%" }}>נעול</button>
      ) : mofetDisabled ? (
        <button disabled style={{ background: "#4b5563", color: "#9ca3af", borderRadius: "5px", padding: "3px 0", fontSize: "10px", border: "none", cursor: "not-allowed", width: "100%" }}>כבר בוצע</button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onAction("buy-mofet", instance.instanceId); }}
          style={{ background: canAffordMilk ? "#9333ea" : "#b91c1c", color: "white", borderRadius: "5px", padding: "3px 0", fontSize: "10px", fontWeight: 600, border: "none", cursor: "pointer", width: "100%" }}
        >
          {canAffordMilk ? `בצע (${def.costMilk}🥛)` : "חסר 🥛"}
        </button>
      )
    ) : null
  ) : null;

  return (
    <>
      <div
        ref={cardRef}
        className="card-hover"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: "min(130px, 9vw)",
          aspectRatio: "2/3",
          display: "flex",
          flexDirection: "column",
          border: `2px solid ${borderColor}`,
          borderRadius: "10px",
          overflow: "hidden",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        {/* Image section — 55% */}
        <div style={{ flex: "0 0 55%", position: "relative", overflow: "hidden" }}>
          <CardImage def={def} large={false} />

          {/* Cost circle(s) — top-left corner */}
          {(def.costMoney !== undefined || def.costMilk !== undefined) && (
            <div style={{ position: "absolute", top: 3, left: 3, display: "flex", gap: "3px" }}>
              {def.costMoney !== undefined && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: COST_CIRCLE_BG[def.type] ?? "#4b5563", border: "2px solid rgba(255,255,255,0.65)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.8)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)", flexShrink: 0 }}>
                  💰{def.costMoney}
                </div>
              )}
              {def.costMilk !== undefined && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: isMofetMarket && !canAffordMilk ? "#991b1b" : "#0891b2", border: "2px solid rgba(255,255,255,0.65)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.8)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)", flexShrink: 0 }}>
                  🥛{def.costMilk}
                </div>
              )}
            </div>
          )}

          {/* Type badge + tag — top-right */}
          <div style={{ position: "absolute", top: 5, right: 5, display: "flex", alignItems: "center", gap: "3px" }}>
            <div style={{ background: "rgba(0,0,0,0.78)", color: "white", borderRadius: "5px", padding: "2px 6px", fontSize: "9px", fontWeight: 700, border: `1.5px solid ${badgeBg}` }}>
              {TYPE_LABELS[def.type]}{isCurse ? " 💀" : ""}
            </div>
          </div>
        </div>

        {/* Name banner — overlaps image/content boundary */}
        <div style={{
          position: "relative", zIndex: 20,
          margin: "-9px 5px 0 5px", borderRadius: "4px", padding: "3px 8px",
          textAlign: "center", fontSize: "11px", fontWeight: 800,
          color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)", flexShrink: 0,
          background: BANNER_GRADIENT[def.type] ?? "linear-gradient(135deg, #1f2937, #4b5563)",
        }}>
          {def.name}
        </div>

        {/* Content section */}
        <div style={{ flex: 1, padding: "3px 5px 4px", background: CONTENT_BG[def.type] ?? "#f9fafb", borderRadius: "0 0 10px 10px", display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden", minHeight: 0 }}>
          {(iconBadgesCompact.length > 0 || hasTextContent) && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px" }}>
              {iconBadgesCompact.map((b, i) => (
                <span key={i} style={{ background: "rgba(0,0,0,0.07)", color: "#374151", borderRadius: "9999px", padding: "1px 4px", fontSize: "9px", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {b.icon}{b.v}
                </span>
              ))}
              {hasTextContent && (
                <span title="יש טקסט נוסף — לחץ לפרטים" style={{ color: "#9ca3af", fontSize: "9px" }}>•••</span>
              )}
            </div>
          )}
          {actionBtn && <div style={{ marginTop: "auto", flexShrink: 0 }}>{actionBtn}</div>}
        </div>
      </div>

      {/* Hover preview — exact hand-card-slot size */}
      {hoverVisible && tooltipPos && createPortal(
        <div style={{
          position: "fixed",
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: tooltipPos.w,
          height: tooltipPos.h,
          zIndex: 9000,
          pointerEvents: "none",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          direction: "rtl",
        }}>
          <CardView
            instance={instance}
            def={def}
            location={location}
            cardSize="large"
            playerMoney={playerMoney}
            playerMilk={playerMilk}
            fillWidth={true}
          />
        </div>,
        document.body
      )}

      {/* Click modal — full text, auto height */}
      {modalOpen && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9500, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", fontSize: "16px", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
            <CardView
              instance={instance}
              def={def}
              location={location}
              cardSize="large"
              playerMoney={playerMoney}
              playerMilk={playerMilk}
              onAction={onAction ? (action, id) => { onAction(action, id); setModalOpen(false); } : undefined}
              mofetDisabled={mofetDisabled}
              buyAndMofetBlocked={buyAndMofetBlocked}
              truncateText={false}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── MAIN CARD VIEW ────────────────────────────────────────────────────────────

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
  cardSize,
  mofetDisabled = false,
  isPlayed = false,
  invertEffects = false,
  buyAndMofetBlocked = false,
  fillWidth = false,
  truncateText = true,
}: Props) {
  const isTrouble     = def.type === "trouble";
  const isMofet       = def.type === "mofet";
  const isCurse       = def.source === "curse_deck";
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

  const tagPill = def.tags?.[0] ? (() => {
    const c = TAG_COLORS[def.tags![0]] ?? { bg: "#f3f4f6", text: "#374151" };
    return { bg: c.bg, text: c.text, label: def.tags![0] };
  })() : null;

  // ── COMPACT CARD MODE ────────────────────────────────────────────────────────
  if (cardSize === "compact") {
    return (
      <CompactCard
        instance={instance}
        def={def}
        location={location as "yard" | "market-mofet" | "mofets"}
        playerMoney={playerMoney}
        playerMilk={playerMilk}
        onAction={onAction}
        mofetDisabled={mofetDisabled}
        buyAndMofetBlocked={buyAndMofetBlocked}
      />
    );
  }

  // ── LARGE CARD MODE ──────────────────────────────────────────────────────────
  if (cardSize === "large") {
    const marketBuyButton = onAction && isMarket ? (
      buyAndMofetBlocked ? (
        <button disabled style={{ background: "#4b5563", color: "#9ca3af", borderRadius: "7px", padding: "6px 8px", fontSize: "12px", cursor: "not-allowed", width: "100%", border: "none" }}>
          חנויות נעולות
        </button>
      ) : isMofetMarket && mofetDisabled ? (
        <button disabled style={{ background: "#4b5563", color: "#9ca3af", borderRadius: "7px", padding: "6px 8px", fontSize: "12px", cursor: "not-allowed", width: "100%", border: "none" }}>
          כבר ביצעת מופת
        </button>
      ) : (
        <button
          onClick={() => {
            if (location === "market-general") onAction("buy-general", instance.instanceId);
            else if (location === "market-faction") onAction("buy-faction", instance.instanceId);
            else onAction("buy-mofet", instance.instanceId);
          }}
          style={{
            background: isMofetMarket
              ? canAffordMilk ? "#9333ea" : "#b91c1c"
              : canAffordMoney ? "#d97706" : "#b91c1c",
            color: "white", borderRadius: "7px", padding: "6px 8px", fontSize: "12px",
            fontWeight: 700, width: "100%", border: "none", cursor: "pointer",
          }}
        >
          {isMofetMarket
            ? canAffordMilk  ? `בצע מופת (${def.costMilk} 🥛)`  : `חסר ${milkShortage} 🥛`
            : canAffordMoney ? `קנה (${def.costMoney} 💰)`       : `חסר ${moneyShortage} 💰`}
        </button>
      )
    ) : null;

    const yardReturnButton = onAction && location === "yard" ? (
      <button
        onClick={() => onAction("returnFromYard", instance.instanceId)}
        style={{ background: "#78716c", color: "white", borderRadius: "7px", padding: "6px 8px", fontSize: "12px", fontWeight: 700, width: "100%", border: "none", cursor: "pointer" }}
      >
        החזר לזרוקים
      </button>
    ) : null;

    const handButtons = onAction && location === "hand" ? (
      isPlayed ? null : (
        <div style={{ display: "flex", gap: "5px" }}>
          <button
            onClick={() => onAction("play", instance.instanceId)}
            style={{ flex: 2, background: "#2563eb", color: "white", borderRadius: "7px", padding: "6px 0", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}
          >
            שחק
          </button>
          {def.yardText && !invertEffects && !isCurse && (
            <button
              onClick={() => onAction("yard", instance.instanceId)}
              style={{ flex: 1, background: "#059669", color: "white", borderRadius: "7px", padding: "6px 0", fontSize: "11px", fontWeight: 700, border: "none", cursor: "pointer" }}
            >
              העמד בחצר
            </button>
          )}
          {def.yardText && invertEffects && !isCurse && (
            <button
              disabled
              style={{ flex: 1, background: "#d1d5db", color: "#9ca3af", borderRadius: "7px", padding: "6px 0", fontSize: "11px", border: "none", cursor: "not-allowed" }}
            >
              העמד בחצר
            </button>
          )}
        </div>
      )
    ) : null;

    // Effect data for the 3-row layout
    const milkBadges = [
      def.costMilkPlay !== undefined ? { icon: "🥛", label: `עלות:${def.costMilkPlay}`, variant: "cost" as const } : null,
      def.gainMoney    !== undefined ? { icon: "💰", label: `+${def.gainMoney}`,         variant: "gain" as const } : null,
      def.gainFollowers!== undefined ? { icon: "👥", label: `+${def.gainFollowers}`,     variant: "gain" as const } : null,
      def.gainMilk     !== undefined ? { icon: "🥛", label: `+${def.gainMilk}`,          variant: "gain" as const } : null,
      def.gainDanger !== undefined && def.gainDanger !== 0
        ? { icon: "⚠️", label: `${def.gainDanger > 0 ? "+" : ""}${def.gainDanger}`, variant: "danger" as const }
        : null,
      def.gainDraw !== undefined ? { icon: "🎴", label: `+${def.gainDraw}`, variant: "gain" as const } : null,
    ].filter(Boolean) as { icon: string; label: string; variant: BadgeVariant }[];


    // Preview mode: truncateText=false → auto height, full text, no ellipsis
    const isPreview = !fillWidth && !truncateText;
    const textSuffix = (text: string, color = "#374151", noTruncate = false) => (
      <span
        title={text}
        style={{
          fontSize: "11px", color, flex: 1, minWidth: 0,
          ...(isPreview || noTruncate
            ? { whiteSpace: "normal" as const }
            : { whiteSpace: "nowrap" as const, overflow: "hidden" as const, textOverflow: "ellipsis" as const }),
        }}
      >
        {text}
      </span>
    );

    // Image section: percentage for fillWidth/fixed-height cards; fixed px for preview (auto-height)
    const imageSectionStyle: React.CSSProperties = isPreview
      ? { height: "min(220px, 15.4vw)", flexShrink: 0, position: "relative", overflow: "hidden", borderRadius: "14px 14px 0 0" }
      : { flex: "0 0 55%", position: "relative", overflow: "hidden", borderRadius: "14px 14px 0 0" };

    return (
      <div
        className={`card-hover ${fillWidth ? "" : "shrink-0"} ${inHandTrouble ? "danger-pulse" : ""} ${isNew ? "card-enter" : ""} ${extraClass}`}
        style={{
          width: fillWidth ? "100%" : "min(240px, 17vw)",
          ...(fillWidth
            ? { height: "100%" }
            : isPreview
            ? {}
            : { height: "min(400px, 28vw)" }),
          display: "flex",
          flexDirection: "column",
          border: `${inHandTrouble ? "3px" : "2px"} solid ${borderColor}`,
          borderRadius: "14px",
          overflow: isPreview ? "visible" : "hidden",
          flexShrink: fillWidth ? 1 : 0,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          ...(isPlayed ? { filter: "grayscale(75%) brightness(0.75)" } : {}),
        }}
      >
        {/* Image section — 55% */}
        <div style={imageSectionStyle}>
          <CardImage def={def} large={true} />

          {/* Cost circles — top-left */}
          {(def.costMoney !== undefined || def.costMilk !== undefined) && (
            <div style={{ position: "absolute", top: 4, left: 4, display: "flex", gap: "4px" }}>
              {def.costMoney !== undefined && (
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: COST_CIRCLE_BG[def.type] ?? "#4b5563", border: "2px solid rgba(255,255,255,0.65)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 900, color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.8)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)", flexShrink: 0 }}>
                  💰{def.costMoney}
                </div>
              )}
              {def.costMilk !== undefined && (
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: isMofetMarket && !canAffordMilk ? "#991b1b" : "#0891b2", border: "2px solid rgba(255,255,255,0.65)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 900, color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.8)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)", flexShrink: 0 }}>
                  🥛{def.costMilk}
                </div>
              )}
            </div>
          )}

          {/* Type badge + tag — top-right */}
          <div style={{ position: "absolute", top: 6, right: 6, display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ background: "rgba(0,0,0,0.78)", color: "white", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", fontWeight: 700, border: `2px solid ${badgeBg}` }}>
              {TYPE_LABELS[def.type]}{isCurse ? " 💀" : ""}
            </div>
            {tagPill && (
              <span style={{ backgroundColor: tagPill.bg, color: tagPill.text, fontSize: "10px", padding: "2px 7px", borderRadius: "9999px", fontWeight: 500 }}>
                {tagPill.label}
              </span>
            )}
          </div>

          {/* Played stamp — over image */}
          {isPlayed && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%) rotate(-15deg)",
              background: "rgba(0,0,0,0.82)", color: "white", padding: "6px 16px",
              borderRadius: "8px", fontWeight: 800, fontSize: "16px",
              border: "2px solid rgba(255,255,255,0.6)",
              whiteSpace: "nowrap",
            }}>
              שוחק ✓
            </div>
          )}
        </div>

        {/* Name banner — overlaps image/content boundary */}
        <div style={{
          position: "relative", zIndex: 20,
          margin: "-12px 10px 0 10px", borderRadius: "6px", padding: "5px 14px",
          textAlign: "center", fontSize: "14px", fontWeight: 800,
          color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          boxShadow: "0 2px 8px rgba(0,0,0,0.35)", flexShrink: 0,
          background: BANNER_GRADIENT[def.type] ?? "linear-gradient(135deg, #1f2937, #4b5563)",
        }}>
          {def.name}
        </div>

        {/* Content section — 3 rows max */}
        <div style={{
          ...(isPreview ? {} : { flex: 1, minHeight: 0 }),
          padding: "6px 10px 8px",
          background: CONTENT_BG[def.type] ?? "#f9fafb",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          overflow: isPreview ? "visible" : "hidden",
          borderRadius: "0 0 14px 14px",
        }}>
          {/* Effect rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", overflow: "hidden" }}>
            {/* Row: play badges */}
            {milkBadges.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", minHeight: 22, overflow: "hidden" }}>
                <span style={{ fontSize: "13px", flexShrink: 0 }}>🎯</span>
                <div style={{ display: "flex", gap: "3px", flexShrink: 0, flexWrap: "nowrap" }}>
                  {milkBadges.map((b, i) => (
                    <EffectBadge key={i} icon={b.icon} label={b.label} variant={b.variant} />
                  ))}
                </div>
              </div>
            )}

            {/* Row: milkText */}
            {def.milkText && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", minHeight: 20, overflow: "hidden", paddingInlineStart: milkBadges.length > 0 ? "18px" : undefined }}>
                {milkBadges.length === 0 && <span style={{ fontSize: "13px", flexShrink: 0 }}>🎯</span>}
                {textSuffix(def.milkText, "#374151", true)}
              </div>
            )}

            {/* Row: yard badges */}
            {(def.yardInfra !== undefined) && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", minHeight: 22, overflow: "hidden" }}>
                <span style={{ fontSize: "13px", flexShrink: 0 }}>🏡</span>
                <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                  <EffectBadge icon="🏛️" label={`+${def.yardInfra}`} variant="gain" />
                </div>
              </div>
            )}

            {/* Row: yardText */}
            {def.yardText && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", minHeight: 20, overflow: "hidden", paddingInlineStart: def.yardInfra !== undefined ? "18px" : undefined }}>
                {def.yardInfra === undefined && <span style={{ fontSize: "13px", flexShrink: 0 }}>🏡</span>}
                {textSuffix(def.yardText, "#166534", true)}
              </div>
            )}

            {/* Row 3: trouble effectText */}
            {isTrouble && def.effectText && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", minHeight: 22, overflow: "hidden" }}>
                <span style={{ fontSize: "13px", flexShrink: 0 }}>⚠️</span>
                {textSuffix(def.effectText, "#991b1b", true)}
              </div>
            )}

            {/* Row 3: mofet curse warning */}
            {isMofet && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", minHeight: 22, overflow: "hidden" }}>
                <span style={{ fontSize: "13px", flexShrink: 0 }}>💀</span>
                <span style={{ fontSize: "10px", color: "#7c3aed", fontWeight: 600 }}>קלף דין יתווסף לראש הדק</span>
              </div>
            )}

            {/* Row 3: other effectText (action / person / institution / helper) */}
            {def.effectText && !isTrouble && !isMofet && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", minHeight: 22, overflow: "hidden" }}>
                <span style={{ fontSize: "13px", flexShrink: 0 }}>📌</span>
                {textSuffix(def.effectText)}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {(handButtons !== null || marketBuyButton !== null || yardReturnButton !== null) && (
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
              {handButtons}
              {marketBuyButton}
              {yardReturnButton}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LANDSCAPE CARD MODE ──────────────────────────────────────────────────────
  if (cardSize === "landscape") {
    const landscapeButton = onAction ? (
      location === "yard" ? (
        <button
          onClick={() => onAction("returnFromYard", instance.instanceId)}
          style={{ background: "#78716c", color: "white", borderRadius: "6px", padding: "2px 6px", fontSize: "10px", fontWeight: 600, border: "none", cursor: "pointer", width: "100%" }}
        >
          החזר לזרוקים
        </button>
      ) : isMofetMarket ? (
        buyAndMofetBlocked ? (
          <button disabled style={{ background: "#4b5563", color: "#9ca3af", borderRadius: "6px", padding: "2px 6px", fontSize: "10px", border: "none", cursor: "not-allowed", width: "100%" }}>
            נעול
          </button>
        ) : mofetDisabled ? (
          <button disabled style={{ background: "#4b5563", color: "#9ca3af", borderRadius: "6px", padding: "2px 6px", fontSize: "10px", border: "none", cursor: "not-allowed", width: "100%" }}>
            כבר בוצע
          </button>
        ) : (
          <button
            onClick={() => onAction("buy-mofet", instance.instanceId)}
            style={{
              background: canAffordMilk ? "#9333ea" : "#b91c1c",
              color: "white",
              borderRadius: "6px",
              padding: "2px 6px",
              fontSize: "10px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              width: "100%",
            }}
          >
            {canAffordMilk ? `בצע (${def.costMilk}🥛)` : `חסר ${milkShortage}🥛`}
          </button>
        )
      ) : location === "mofets" ? (
        <button
          onClick={() => onAction("returnMofetToDiscard", instance.instanceId)}
          style={{ background: "#d1d5db", color: "#374151", borderRadius: "6px", padding: "2px 6px", fontSize: "10px", border: "none", cursor: "pointer", width: "100%" }}
        >
          החזר לזרוקים
        </button>
      ) : null
    ) : null;

    return (
      <div
        className={`shrink-0 card-hover ${isNew ? "card-enter" : ""} ${extraClass}`}
        style={{
          width: "min(200px, 15vw)",
          height: "min(133px, 10vw)",
          backgroundColor: bg,
          border: `2px solid ${borderColor}`,
          borderRadius: "10px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "row",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Image strip — 35% width, right side in RTL (first in DOM) */}
        <div style={{ flex: "0 0 35%", overflow: "hidden" }}>
          <CardImage def={def} large={false} />
        </div>

        {/* Content — 65% width */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "5px 6px", gap: "2px", overflow: "hidden", minHeight: 0 }}>
          {/* Name */}
          <div style={{ fontSize: "11px", fontWeight: "bold", lineHeight: 1.2, color: "#1c1917", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
            {def.name}
          </div>

          {/* Type + tag + cost */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px", flexWrap: "wrap" }}>
            <span style={{ backgroundColor: badgeBg, color: "white", borderRadius: "9999px", padding: "1px 5px", fontSize: "9px", fontWeight: 600 }}>
              {TYPE_LABELS[def.type]}
            </span>
            {isCurse && (
              <span style={{ backgroundColor: "#3b0764", color: "#e9d5ff", fontSize: "9px", padding: "1px 4px", borderRadius: "9999px", fontWeight: 600 }}>
                💀
              </span>
            )}
            {tagPill && (
              <span style={{ backgroundColor: tagPill.bg, color: tagPill.text, fontSize: "9px", padding: "1px 4px", borderRadius: "9999px" }}>
                {tagPill.label}
              </span>
            )}
            {def.costMoney !== undefined && (
              <span style={{ fontSize: "10px", color: "#57534e", marginInlineStart: "auto" }}>💰{def.costMoney}</span>
            )}
            {def.costMilk !== undefined && (
              <span style={{ fontSize: "10px", color: isMofetMarket && !canAffordMilk ? "#ef4444" : "#57534e" }}>🥛{def.costMilk}</span>
            )}
          </div>

          {/* Effect — 1 line */}
          <div style={{ flex: 1, overflow: "hidden", fontSize: "10px" }}>
            <EffectSection def={def} compact={true} />
          </div>

          {/* Action button */}
          {landscapeButton && (
            <div style={{ marginTop: "auto", flexShrink: 0 }}>
              {landscapeButton}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── COMPACT MODE ─────────────────────────────────────────────────────────────
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
            {def.yardText && !invertEffects && !isCurse && (
              <button
                onClick={() => onAction("yard", instance.instanceId)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-1.5 py-1 rounded transition-colors text-xs"
              >
                העמד בחצר
              </button>
            )}
            {def.yardText && invertEffects && !isCurse && (
              <button
                disabled
                title="הינדיק — לא ניתן להעמיד בחצר התור הזה"
                className="bg-stone-300 text-stone-400 px-1.5 py-1 rounded text-xs cursor-not-allowed"
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
        buyAndMofetBlocked ? (
          <button
            disabled
            title="נועלים את החנויות — לא ניתן לקנות או לבצע מופת התור הזה"
            className="px-1.5 py-1 rounded text-stone-400 bg-stone-600 cursor-not-allowed leading-none text-xs"
          >
            חנויות נעולות
          </button>
        ) : isMofetMarket && mofetDisabled ? (
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
        <div className="font-bold text-stone-800 leading-tight line-clamp-2" style={{ fontSize: "15px" }} title={def.name}>
          {def.name}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-white px-1 py-0.5 rounded leading-none" style={{ fontSize: "11px", backgroundColor: badgeBg }}>
            {TYPE_LABELS[def.type]}
          </span>
          {isCurse && (
            <span style={{ backgroundColor: "#3b0764", color: "#e9d5ff", fontSize: "10px", padding: "2px 5px", borderRadius: "9999px", fontWeight: 600 }}>
              💀 דינים
            </span>
          )}
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
        {def.requirements && (
          <div className="text-stone-600 leading-tight line-clamp-2" style={{ fontSize: "12px" }} title={def.requirements}>
            {def.requirements}
          </div>
        )}
        <EffectSection def={def} compact={true} />
        {actionButtons}
      </div>
    );
  }

  // ── STANDARD MODE ────────────────────────────────────────────────────────────
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
      <div className="flex items-start justify-between gap-0.5">
        <div className="font-bold text-stone-800 leading-tight line-clamp-2 flex-1" style={{ fontSize: "15px" }} title={def.name}>
          {def.name}
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          {inHandTrouble && <span className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded font-bold leading-none">⚠</span>}
          {isMofet && <span className="bg-purple-500 text-white text-[9px] px-1 py-0.5 rounded font-bold leading-none">✡</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-white text-[9px] px-1 py-0.5 rounded leading-none" style={{ backgroundColor: badgeBg }}>
          {TYPE_LABELS[def.type]}
        </span>
        {isCurse && (
          <span style={{ backgroundColor: "#3b0764", color: "#e9d5ff", fontSize: "9px", padding: "2px 5px", borderRadius: "9999px", fontWeight: 600 }}>
            💀 דינים
          </span>
        )}
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
      {def.requirements && (
        <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-1 leading-tight" title={def.requirements}>
          {def.requirements}
        </div>
      )}
      <EffectSection def={def} compact={false} />
      {actionButtons}
    </div>
  );
}
