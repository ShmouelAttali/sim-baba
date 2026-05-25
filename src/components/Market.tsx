import type { CardDef, CardInstance, FactionId } from "../types/game";
import type { MarketState } from "../types/game";
import CardView from "./CardView";

interface Props {
  market: MarketState;
  allCardDefs: CardDef[];
  currentPlayerFaction: FactionId;
  currentPlayerMoney: number;
  currentPlayerMilk: number;
  onBuyGeneral: (instance: CardInstance) => void;
  onBuyFaction: (instance: CardInstance) => void;
  onBuyMofet: (instance: CardInstance) => void;
}

export default function Market({
  market,
  allCardDefs,
  currentPlayerFaction,
  currentPlayerMoney,
  currentPlayerMilk,
  onBuyGeneral,
  onBuyFaction,
  onBuyMofet,
}: Props) {
  function getDef(defId: string): CardDef | undefined {
    return allCardDefs.find((d) => d.id === defId);
  }

  // Faction market cards for current player's faction
  const factionMarketCards = allCardDefs.filter(
    (c) => c.source === "faction_market" && c.faction === currentPlayerFaction
  );

  function makeFactonInstance(def: CardDef): CardInstance {
    return { instanceId: `faction-market-${def.id}`, defId: def.id };
  }

  function handleAction(_action: string, instanceId: string, source: "general" | "faction" | "mofet") {
    const instance =
      source === "general"
        ? market.generalVisible.find((c) => c.instanceId === instanceId)
        : source === "mofet"
        ? market.mofetVisible.find((c) => c.instanceId === instanceId)
        : { instanceId, defId: instanceId.replace("faction-market-", "") };

    if (!instance) return;

    if (source === "general") onBuyGeneral(instance);
    else if (source === "faction") onBuyFaction(instance);
    else onBuyMofet(instance);
  }

  return (
    <div className="space-y-4">
      {/* General Market */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-amber-800">שוק כללי</h3>
          <span className="text-xs text-amber-600">דק: {market.generalDeck.length} קלפים</span>
        </div>
        {market.generalVisible.length === 0 ? (
          <p className="text-amber-600 text-sm">השוק הכללי ריק</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {market.generalVisible.map((inst) => {
              const def = getDef(inst.defId);
              if (!def) return null;
              return (
                <CardView
                  key={inst.instanceId}
                  instance={inst}
                  def={def}
                  location="market-general"
                  playerMoney={currentPlayerMoney}
                  playerMilk={currentPlayerMilk}
                  onAction={(action, id) => handleAction(action, id, "general")}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Faction Market */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-blue-800">שוק פרטי</h3>
          <span className="text-xs text-blue-600">קלפים ללא הגבלה</span>
        </div>
        {factionMarketCards.length === 0 ? (
          <p className="text-blue-600 text-sm">אין קלפי שוק פרטי לפלגה זו</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {factionMarketCards.map((def) => {
              const inst = makeFactonInstance(def);
              return (
                <CardView
                  key={def.id}
                  instance={inst}
                  def={def}
                  location="market-faction"
                  playerMoney={currentPlayerMoney}
                  playerMilk={currentPlayerMilk}
                  onAction={(action, id) => handleAction(action, id, "faction")}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Mofet Market */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-purple-800">שוק מופתים</h3>
          <span className="text-xs text-purple-600">דק: {market.mofetDeck.length} קלפים</span>
        </div>
        {market.mofetVisible.length === 0 ? (
          <p className="text-purple-600 text-sm">אין מופתים זמינים</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {market.mofetVisible.map((inst) => {
              const def = getDef(inst.defId);
              if (!def) return null;
              return (
                <CardView
                  key={inst.instanceId}
                  instance={inst}
                  def={def}
                  location="market-mofet"
                  playerMoney={currentPlayerMoney}
                  playerMilk={currentPlayerMilk}
                  onAction={(action, id) => handleAction(action, id, "mofet")}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
