import type { CardDef, CardInstance, FactionId, MarketState, PlayerState } from "../types/game";
import CardView from "./CardView";

interface Props {
  market: MarketState;
  allCardDefs: CardDef[];
  players: PlayerState[];
  currentPlayerFaction: FactionId;
  currentPlayerMoney: number;
  currentPlayerMilk: number;
  mofetUsedThisTurn: boolean;
  onBuyMofet: (instance: CardInstance) => void;
  curseDeckCount?: number;
  buyAndMofetBlocked?: boolean;
}

const FACTION_TAKEN_COLORS: Record<string, { bg: string; text: string }> = {
  baba:    { bg: "#92400e", text: "#fef3c7" },
  breslov: { bg: "#5b21b6", text: "#f3e8ff" },
  chabad:  { bg: "#9a3412", text: "#fff7ed" },
  litvaks: { bg: "#334155", text: "#f1f5f9" },
};

export default function MofetSection({
  market,
  allCardDefs,
  players,
  currentPlayerMoney,
  currentPlayerMilk,
  mofetUsedThisTurn,
  onBuyMofet,
  curseDeckCount,
  buyAndMofetBlocked = false,
}: Props) {
  function getDef(defId: string) {
    return allCardDefs.find((d) => d.id === defId);
  }

  function handleAction(_action: string, instanceId: string) {
    const inst = market.mofetVisible.find((c) => c.instanceId === instanceId);
    if (inst) onBuyMofet(inst);
  }

  const takenMofets = new Map<string, PlayerState>();
  for (const player of players) {
    for (const mofet of player.mofets) {
      takenMofets.set(mofet.instanceId, player);
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fdf4ff", borderTop: "2px solid #e9d5ff" }}>
      {/* Header */}
      <div
        style={{
          padding: "6px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e9d5ff",
          background: "#faf5ff",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {curseDeckCount !== undefined && (
            <span
              style={{
                fontSize: "11px",
                background: "#4c1d95",
                color: "#e9d5ff",
                padding: "2px 8px",
                borderRadius: "9999px",
                fontWeight: 600,
              }}
            >
              💀 דינים: {curseDeckCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#374151" }}>מופתים</span>
      </div>

      {/* Cards — centered horizontal scroll */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflowX: "auto",
          overflowY: "hidden",
          padding: "8px 16px",
        }}
        className="no-scrollbar"
      >
        {market.mofetVisible.length === 0 ? (
          <span style={{ color: "#9ca3af", fontSize: "14px" }}>אין מופתים</span>
        ) : (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {market.mofetVisible.map((inst) => {
              const def = getDef(inst.defId);
              if (!def) return null;
              const takenByPlayer = takenMofets.get(inst.instanceId);

              if (takenByPlayer) {
                const colors = FACTION_TAKEN_COLORS[takenByPlayer.factionId] ?? { bg: "#374151", text: "#f9fafb" };
                return (
                  <div key={inst.instanceId} style={{ position: "relative", flexShrink: 0 }}>
                    <CardView
                      instance={inst}
                      def={def}
                      location="market-mofet"
                      playerMoney={currentPlayerMoney}
                      playerMilk={currentPlayerMilk}
                      cardSize="compact"
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(120,113,108,0.52)",
                        borderRadius: "10px",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        insetInline: "4px",
                        bottom: "4px",
                        background: colors.bg,
                        color: colors.text,
                        borderRadius: "6px",
                        padding: "2px 4px",
                        textAlign: "center",
                        fontSize: "9px",
                        fontWeight: 700,
                        zIndex: 10,
                        lineHeight: 1.3,
                        pointerEvents: "none",
                      }}
                    >
                      נלקח: {takenByPlayer.name}
                    </div>
                  </div>
                );
              }

              return (
                <CardView
                  key={inst.instanceId}
                  instance={inst}
                  def={def}
                  location="market-mofet"
                  playerMoney={currentPlayerMoney}
                  playerMilk={currentPlayerMilk}
                  onAction={handleAction}
                  mofetDisabled={mofetUsedThisTurn}
                  buyAndMofetBlocked={buyAndMofetBlocked}
                  cardSize="compact"
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
