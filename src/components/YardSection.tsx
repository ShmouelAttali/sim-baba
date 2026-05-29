import type { CardDef, FactionDef, PlayerState } from "../types/game";
import CardView from "./CardView";

const FACTION_ACCENT: Record<string, { border: string; text: string; bg: string }> = {
  baba:    { border: "#fde68a", text: "#92400e", bg: "#fefce8" },
  breslov: { border: "#ddd6fe", text: "#5b21b6", bg: "#faf5ff" },
  chabad:  { border: "#fed7aa", text: "#9a3412", bg: "#fff7ed" },
  litvaks: { border: "#cbd5e1", text: "#334155", bg: "#f8fafc" },
};

interface Props {
  player: PlayerState;
  allCardDefs: CardDef[];
  factions: FactionDef[];
  onReturnFromYard: (instanceId: string) => void;
}

export default function YardSection({ player, allCardDefs, factions, onReturnFromYard }: Props) {
  const accent = FACTION_ACCENT[player.factionId] ?? { border: "#e5e7eb", text: "#374151", bg: "#f9fafb" };
  const factionName = factions.find((f) => f.id === player.factionId)?.name ?? "";

  function getDef(defId: string): CardDef | undefined {
    return allCardDefs.find((d) => d.id === defId);
  }

  function handleAction(action: string, instanceId: string) {
    if (action === "returnFromYard") onReturnFromYard(instanceId);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: accent.bg, borderInlineStart: `2px solid ${accent.border}` }}>
      {/* Header */}
      <div
        style={{
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${accent.border}`,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>{factionName}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: accent.text }}>החצר</span>
          <span
            style={{
              fontSize: "11px",
              padding: "1px 7px",
              borderRadius: "9999px",
              backgroundColor: accent.border,
              color: accent.text,
              fontWeight: 600,
            }}
          >
            {player.yard.length}
          </span>
        </div>
      </div>

      {/* 3×2 compact landscape grid */}
      {player.yard.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              border: "2px dashed #e5e7eb",
              borderRadius: "12px",
              padding: "24px 32px",
              color: "#d1d5db",
              fontSize: "13px",
            }}
          >
            ריק
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "8px",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gridAutoRows: "min-content",
            gap: "6px",
            alignContent: "start",
          }}
          className="yard-zone-scroll"
        >
          {player.yard.map((inst) => {
            const def = getDef(inst.defId);
            if (!def) return null;
            return (
              <div key={inst.instanceId} style={{ display: "flex", justifyContent: "center" }}>
                <CardView
                  instance={inst}
                  def={def}
                  location="yard"
                  onAction={handleAction}
                  cardSize="compact"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
