import { createPortal } from "react-dom";
import type { CardDef, CardInstance, FactionDef, MarketState, PlayerState } from "../types/game";
import CardView from "./CardView";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  market: MarketState;
  allCardDefs: CardDef[];
  player: PlayerState;
  factions: FactionDef[];
  onBuyGeneral: (instance: CardInstance) => void;
  onBuyFaction: (instance: CardInstance) => void;
  buyBlocked?: boolean;
}

function EmptySlot() {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      border: "2px dashed #d1d5db",
      borderRadius: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#d1d5db",
      fontSize: "13px",
    }}>
      ריק
    </div>
  );
}

interface SidePanelProps {
  title: string;
  subtitle?: string;
  count: number;
  onClose?: () => void;
  money?: number;
}

function SidePanel({ title, subtitle, count, onClose, money }: SidePanelProps) {
  return (
    <div style={{
      width: 108,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "10px 8px",
      background: "#f9fafb",
      borderLeft: "1px solid #e5e7eb",
      gap: "8px",
      textAlign: "center",
    }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            padding: "5px 10px",
            fontSize: "13px",
            cursor: "pointer",
            color: "#374151",
            width: "100%",
          }}
        >
          ✕ סגור
        </button>
      )}
      {money !== undefined && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: "11px", color: "#a16207", fontWeight: 600 }}>כסף</span>
          <span style={{
            fontSize: "15px",
            fontWeight: 800,
            color: "#78350f",
            background: "#fef9c3",
            border: "1px solid #fde047",
            borderRadius: "9999px",
            padding: "2px 12px",
            whiteSpace: "nowrap",
          }}>
            💰 {money}
          </span>
        </div>
      )}
      <span style={{ fontSize: "13px", fontWeight: 700, color: "#374151", lineHeight: 1.3 }}>
        {title}
      </span>
      {subtitle && (
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>{subtitle}</span>
      )}
      <span style={{
        fontSize: "12px",
        background: "#e5e7eb",
        borderRadius: "9999px",
        padding: "2px 10px",
        color: "#6b7280",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}>
        נותרו: {count}
      </span>
    </div>
  );
}

export default function MarketModal({
  isOpen,
  onClose,
  market,
  allCardDefs,
  player,
  factions,
  onBuyGeneral,
  onBuyFaction,
  buyBlocked = false,
}: Props) {
  if (!isOpen) return null;

  const factionName = factions.find((f) => f.id === player.factionId)?.name ?? "";

  function getDef(defId: string) {
    return allCardDefs.find((d) => d.id === defId);
  }

  function handleGeneralAction(_action: string, instanceId: string) {
    const inst = market.generalVisible.find((c) => c.instanceId === instanceId);
    if (inst) onBuyGeneral(inst);
  }

  function handleFactionAction(_action: string, instanceId: string) {
    const inst = player.factionMarketVisible.find((c) => c.instanceId === instanceId);
    if (inst) onBuyFaction(inst);
  }

  const generalEmptySlots = Math.max(0, 5 - market.generalVisible.length);
  const factionCards = player.factionMarketVisible ?? [];

  const cardSlotStyle: React.CSSProperties = {
    aspectRatio: "2/3",
    flexShrink: 0,
    minWidth: 0,
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          width: "min(1640px, 98vw)",
          height: "min(92vh, 860px)",
          direction: "rtl",
          boxShadow: "0 32px 96px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Body: two equal rows, no scroll */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>

          {/* ── General market row ─────────────────────────────── */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "row",
            borderBottom: "1px solid #e5e7eb",
          }}>
            <SidePanel title="שוק כללי" count={market.generalDeck.length} onClose={onClose} money={player.money} />
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "row",
              alignItems: "stretch",
              gap: "10px",
              padding: "12px 16px",
              overflow: "hidden",
            }}>
              {market.generalVisible.map((inst) => {
                const def = getDef(inst.defId);
                if (!def) return null;
                return (
                  <div key={inst.instanceId} style={cardSlotStyle}>
                    <CardView
                      instance={inst}
                      def={def}
                      location="market-general"
                      playerMoney={player.money}
                      playerMilk={player.milk}
                      onAction={handleGeneralAction}
                      cardSize="large"
                      buyAndMofetBlocked={buyBlocked}
                      fillWidth={true}
                    />
                  </div>
                );
              })}
              {Array.from({ length: generalEmptySlots }).map((_, i) => (
                <div key={`gen-empty-${i}`} style={cardSlotStyle}>
                  <EmptySlot />
                </div>
              ))}
            </div>
          </div>

          {/* ── Faction market row ─────────────────────────────── */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "row",
          }}>
            <SidePanel
              title={factionName}
              subtitle="שוק פרטי"
              count={player.factionMarketDeck?.length ?? 0}
            />
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "row",
              alignItems: "stretch",
              gap: "10px",
              padding: "12px 16px",
              overflow: "hidden",
            }}>
              {factionCards.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: "14px",
                }}>
                  שוק ריק
                </div>
              ) : (
                factionCards.map((inst) => {
                  const def = getDef(inst.defId);
                  if (!def) return null;
                  return (
                    <div key={inst.instanceId} style={cardSlotStyle}>
                      <CardView
                        instance={inst}
                        def={def}
                        location="market-faction"
                        playerMoney={player.money}
                        playerMilk={player.milk}
                        onAction={handleFactionAction}
                        cardSize="large"
                        buyAndMofetBlocked={buyBlocked}
                        fillWidth={true}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
