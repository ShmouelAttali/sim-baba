import { useState } from "react";
import type { CardDef, CardInstance, FactionDef, FactionId, MarketState } from "../types/game";
import CardView from "./CardView";

interface Props {
  market: MarketState;
  allCardDefs: CardDef[];
  currentPlayerFaction: FactionId;
  factions: FactionDef[];
  currentPlayerMoney: number;
  currentPlayerMilk: number;
  currentPlayerYard: CardInstance[];
  currentPlayerMofets: CardInstance[];
  onBuyGeneral: (instance: CardInstance) => void;
  onBuyFaction: (instance: CardInstance) => void;
  onBuyMofet: (instance: CardInstance) => void;
  onReturnFromYard: (instanceId: string) => void;
}

const ROW_HEIGHT = 265;

const FACTION_COLORS: Record<string, { bgClass: string; textClass: string; badgeClass: string; cardAreaClass: string }> = {
  baba:    { bgClass: "border-yellow-200 bg-yellow-50",  textClass: "text-yellow-800",  badgeClass: "bg-yellow-100 text-yellow-700",  cardAreaClass: "bg-yellow-50/30"  },
  breslov: { bgClass: "border-purple-100 bg-purple-50",  textClass: "text-purple-700",  badgeClass: "bg-purple-100 text-purple-600",  cardAreaClass: "bg-purple-50/30"  },
  chabad:  { bgClass: "border-orange-100 bg-orange-50",  textClass: "text-orange-700",  badgeClass: "bg-orange-100 text-orange-600",  cardAreaClass: "bg-orange-50/30"  },
  litvaks: { bgClass: "border-slate-200 bg-slate-50",    textClass: "text-slate-700",   badgeClass: "bg-slate-100 text-slate-600",   cardAreaClass: "bg-slate-50/30"   },
};
const CARD_W = 160;
const CARD_H = 200;

function EmptySlot() {
  return (
    <div
      className="shrink-0 border-2 border-dashed border-stone-300 rounded-xl flex items-center justify-center text-stone-300 text-xs"
      style={{ width: `${CARD_W}px`, minHeight: `${CARD_H}px` }}
    >
      ריק
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  count,
  countLabel,
  bgClass,
  textClass,
  badgeClass,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  bgClass: string;
  textClass: string;
  badgeClass: string;
}) {
  return (
    <div className={`shrink-0 px-3 py-2 flex items-center justify-between border-b ${bgClass}`}>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-xs font-semibold uppercase tracking-wide ${textClass}`}>{title}</span>
        {subtitle && <span className={`text-[10px] opacity-60 ${textClass}`}>{subtitle}</span>}
      </div>
      {count !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badgeClass}`}>
          {countLabel ? `${countLabel}: ${count}` : `${count}`}
        </span>
      )}
    </div>
  );
}

export default function MarketBottom({
  market,
  allCardDefs,
  currentPlayerFaction,
  factions,
  currentPlayerMoney,
  currentPlayerMilk,
  currentPlayerYard,
  currentPlayerMofets,
  onBuyGeneral,
  onBuyFaction,
  onBuyMofet,
  onReturnFromYard,
}: Props) {
  const [pulsingFactionId, setPulsingFactionId] = useState<string | null>(null);

  function getDef(defId: string): CardDef | undefined {
    return allCardDefs.find((d) => d.id === defId);
  }

  const currentFaction = factions.find((f) => f.id === currentPlayerFaction);
  const factionColors = FACTION_COLORS[currentPlayerFaction] ?? { bgClass: "border-blue-100 bg-blue-50", textClass: "text-blue-700", badgeClass: "bg-blue-100 text-blue-600", cardAreaClass: "bg-blue-50/30" };
  const factionVisibleCards = market.factionVisible[currentPlayerFaction] ?? [];
  const factionDeckCount = market.factionDecks[currentPlayerFaction]?.length ?? 0;

  function handleGeneralAction(_action: string, instanceId: string) {
    const inst = market.generalVisible.find((c) => c.instanceId === instanceId);
    if (inst) onBuyGeneral(inst);
  }

  function handleFactionAction(_action: string, instanceId: string) {
    const inst = factionVisibleCards.find((c) => c.instanceId === instanceId);
    if (!inst) return;
    setPulsingFactionId(instanceId);
    setTimeout(() => setPulsingFactionId(null), 260);
    onBuyFaction(inst);
  }

  function handleMofetAction(_action: string, instanceId: string) {
    const inst = market.mofetVisible.find((c) => c.instanceId === instanceId);
    if (inst) onBuyMofet(inst);
  }

  function handleYardAction(_action: string, instanceId: string) {
    onReturnFromYard(instanceId);
  }

  const generalEmptySlots = Math.max(0, 5 - market.generalVisible.length);
  const mofetEmptySlots   = Math.max(0, 3 - market.mofetVisible.length);

  return (
    <div className="shrink-0 border-t-2 border-stone-300">
      {/* ── Row 1: שוק כללי | החצר | מופתים שהושגו ─────────────────────── */}
      <div className="flex border-b border-stone-200" style={{ height: `${ROW_HEIGHT}px` }}>

        {/* Section 1 — שוק כללי (rightmost, fixed 856px) */}
        <div className="flex flex-col border-l border-stone-200 overflow-hidden" style={{ width: "856px", flexShrink: 0 }}>
          <SectionHeader
            title="שוק כללי"
            count={market.generalDeck.length}
            countLabel="נותרו"
            bgClass="border-amber-100 bg-amber-50"
            textClass="text-amber-700"
            badgeClass="bg-amber-100 text-amber-600"
          />
          <div className="flex-1 flex items-start gap-2 p-2 overflow-x-auto bg-amber-50/30">
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
                  onAction={handleGeneralAction}
                  compact={true}
                />
              );
            })}
            {Array.from({ length: generalEmptySlots }).map((_, i) => (
              <EmptySlot key={`gen-empty-${i}`} />
            ))}
          </div>
        </div>

        <div className="w-px shrink-0 bg-stone-200" />

        {/* Section 2 — החצר (middle, flex:2) */}
        <div className="flex flex-col overflow-hidden border-l border-stone-200" style={{ flex: 2 }}>
          <SectionHeader
            title="החצר"
            count={currentPlayerYard.length}
            bgClass={factionColors.bgClass}
            textClass={factionColors.textClass}
            badgeClass={factionColors.badgeClass}
          />
          <div className={`flex-1 flex items-start gap-2 p-2 overflow-x-auto ${factionColors.cardAreaClass}`}>
            {currentPlayerYard.length === 0 ? (
              <div className="flex items-center justify-center w-full text-stone-300 text-sm">ריק</div>
            ) : (
              currentPlayerYard.map((inst) => {
                const def = getDef(inst.defId);
                if (!def) return null;
                return (
                  <CardView
                    key={inst.instanceId}
                    instance={inst}
                    def={def}
                    location="yard"
                    onAction={handleYardAction}
                    compact={true}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="w-px shrink-0 bg-stone-200" />

        {/* Section 3 — מופתים שהושגו (leftmost, flex:1) */}
        <div className="flex flex-col overflow-hidden" style={{ flex: 1 }}>
          <SectionHeader
            title="🏆 מופתים"
            count={currentPlayerMofets.length}
            bgClass="border-yellow-200 bg-yellow-50"
            textClass="text-yellow-800"
            badgeClass="bg-yellow-100 text-yellow-700"
          />
          <div className="flex-1 flex items-start gap-2 p-2 overflow-x-auto bg-yellow-50/20">
            {currentPlayerMofets.length === 0 ? (
              <div className="flex items-center justify-center w-full text-stone-300 text-sm">אין עדיין</div>
            ) : (
              currentPlayerMofets.map((inst) => {
                const def = getDef(inst.defId);
                if (!def) return null;
                return (
                  <CardView
                    key={inst.instanceId}
                    instance={inst}
                    def={def}
                    location="mofets"
                    compact={true}
                  />
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ── Row 2: שוק פרטי | שוק מופתים ──────────────────────────── */}
      <div className="flex" style={{ height: `${ROW_HEIGHT}px` }}>
        {/* שוק פרטי — right section */}
        <div className="flex-1 flex flex-col border-l border-stone-200 overflow-hidden">
          <SectionHeader
            title="שוק פרטי"
            subtitle={currentFaction?.name}
            count={factionDeckCount}
            countLabel="נותרו"
            bgClass={factionColors.bgClass}
            textClass={factionColors.textClass}
            badgeClass={factionColors.badgeClass}
          />
          <div className={`flex-1 flex items-start gap-2 p-2 overflow-x-auto ${factionColors.cardAreaClass}`}>
            {factionVisibleCards.length === 0 && factionDeckCount === 0 ? (
              <div className="flex items-center justify-center w-full text-blue-300 text-sm">אין קלפים</div>
            ) : (
              <>
                {factionVisibleCards.map((inst) => {
                  const def = getDef(inst.defId);
                  if (!def) return null;
                  return (
                    <CardView
                      key={inst.instanceId}
                      instance={inst}
                      def={def}
                      location="market-faction"
                      playerMoney={currentPlayerMoney}
                      playerMilk={currentPlayerMilk}
                      onAction={handleFactionAction}
                      extraClass={pulsingFactionId === inst.instanceId ? "card-buy-pulse" : ""}
                      compact={true}
                    />
                  );
                })}
                {Array.from({ length: Math.max(0, 5 - factionVisibleCards.length) }).map((_, i) => (
                  <EmptySlot key={`faction-empty-${i}`} />
                ))}
              </>
            )}
          </div>
        </div>

        <div className="w-px shrink-0 bg-stone-200" />

        {/* שוק מופתים — left section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <SectionHeader
            title="שוק מופתים"
            count={market.mofetDeck.length}
            countLabel="נותרו"
            bgClass="border-purple-100 bg-purple-50"
            textClass="text-purple-700"
            badgeClass="bg-purple-100 text-purple-600"
          />
          <div className="flex-1 flex items-start gap-2 p-2 overflow-x-auto bg-purple-50/30">
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
                  onAction={handleMofetAction}
                  compact={true}
                />
              );
            })}
            {Array.from({ length: mofetEmptySlots }).map((_, i) => (
              <EmptySlot key={`mofet-empty-${i}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
