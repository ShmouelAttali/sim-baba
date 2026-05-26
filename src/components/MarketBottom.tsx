import { useState } from "react";
import type { CardDef, CardInstance, FactionDef, FactionId, MarketState, PlayerState } from "../types/game";
import CardView from "./CardView";

const CARD_W = 160;
const CARD_H = 200;

const FACTION_COLORS: Record<string, { bgClass: string; textClass: string; badgeClass: string }> = {
  baba:    { bgClass: "bg-yellow-50 border-yellow-200",  textClass: "text-yellow-800",  badgeClass: "bg-yellow-100 text-yellow-700"  },
  breslov: { bgClass: "bg-purple-50 border-purple-100",  textClass: "text-purple-700",  badgeClass: "bg-purple-100 text-purple-600"  },
  chabad:  { bgClass: "bg-orange-50 border-orange-100",  textClass: "text-orange-700",  badgeClass: "bg-orange-100 text-orange-600"  },
  litvaks: { bgClass: "bg-slate-50 border-slate-200",    textClass: "text-slate-700",   badgeClass: "bg-slate-100 text-slate-600"    },
};

const FACTION_TAKEN_COLORS: Record<string, string> = {
  baba:    "bg-yellow-700/90 text-yellow-50",
  breslov: "bg-purple-700/90 text-purple-50",
  chabad:  "bg-orange-600/90 text-orange-50",
  litvaks: "bg-slate-600/90 text-slate-50",
};

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
  className,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  className?: string;
}) {
  return (
    <div className={`px-3 py-1 flex items-center justify-between border-b ${className ?? "bg-stone-50 border-stone-200"}`} style={{ minHeight: "32px" }}>
      <div className="flex items-baseline gap-1.5">
        {subtitle && <span className="text-[10px] text-stone-500">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-stone-700">{title}</span>
        {count !== undefined && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
            {countLabel ? `${countLabel}: ${count}` : count}
          </span>
        )}
      </div>
    </div>
  );
}

// ── שוק כללי ─────────────────────────────────────────────────────────────────

interface GeneralProps {
  market: MarketState;
  allCardDefs: CardDef[];
  currentPlayerMoney: number;
  currentPlayerMilk: number;
  onBuyGeneral: (instance: CardInstance) => void;
}

export function GeneralMarketSection({
  market,
  allCardDefs,
  currentPlayerMoney,
  currentPlayerMilk,
  onBuyGeneral,
}: GeneralProps) {
  function getDef(defId: string) {
    return allCardDefs.find((d) => d.id === defId);
  }

  function handleAction(_action: string, instanceId: string) {
    const inst = market.generalVisible.find((c) => c.instanceId === instanceId);
    if (inst) onBuyGeneral(inst);
  }

  const emptySlots = Math.max(0, 5 - market.generalVisible.length);

  return (
    <div className="border-b border-stone-200">
      <SectionHeader
        title="שוק כללי"
        count={market.generalDeck.length}
        countLabel="נותרו"
        className="bg-amber-50 border-amber-100"
      />
      <div className="flex items-start gap-2 p-2 overflow-x-auto no-scrollbar bg-amber-50/30" style={{ minHeight: "200px" }}>
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
              onAction={handleAction}
              compact={true}
            />
          );
        })}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <EmptySlot key={`gen-empty-${i}`} />
        ))}
      </div>
    </div>
  );
}

// ── שוק פרטי ─────────────────────────────────────────────────────────────────

interface FactionProps {
  player: PlayerState;
  allCardDefs: CardDef[];
  factions: FactionDef[];
  currentPlayerMoney: number;
  currentPlayerMilk: number;
  onBuyFaction: (instance: CardInstance) => void;
}

export function FactionMarketSection({
  player,
  allCardDefs,
  factions,
  currentPlayerMoney,
  currentPlayerMilk,
  onBuyFaction,
}: FactionProps) {
  const [pulsingId, setPulsingId] = useState<string | null>(null);

  const factionId = player.factionId as string;
  const factionColors = FACTION_COLORS[factionId] ?? {
    bgClass: "bg-blue-50 border-blue-100",
    textClass: "text-blue-700",
    badgeClass: "bg-blue-100 text-blue-600",
  };
  const factionName = factions.find((f) => f.id === player.factionId)?.name ?? "";

  function getDef(defId: string) {
    return allCardDefs.find((d) => d.id === defId);
  }

  function handleAction(_action: string, instanceId: string) {
    const inst = player.factionMarketVisible.find((c) => c.instanceId === instanceId);
    if (!inst) return;
    setPulsingId(instanceId);
    setTimeout(() => setPulsingId(null), 260);
    onBuyFaction(inst);
  }

  const visible = player.factionMarketVisible ?? [];
  const emptySlots = Math.max(0, 5 - visible.length);

  return (
    <div className="border-b border-stone-200">
      <div className={`px-3 py-1 flex items-center justify-between border-b ${factionColors.bgClass}`} style={{ minHeight: "32px" }}>
        <span className={`text-[10px] opacity-70 ${factionColors.textClass}`}>
          נותרו: {player.factionMarketDeck?.length ?? 0}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${factionColors.textClass}`}>
            {factionName} — שוק פרטי
          </span>
        </div>
      </div>
      <div className={`flex items-start gap-2 p-2 overflow-x-auto no-scrollbar`} style={{ minHeight: "200px" }}>
        {visible.map((inst) => {
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
              onAction={handleAction}
              extraClass={pulsingId === inst.instanceId ? "card-buy-pulse" : ""}
              compact={true}
            />
          );
        })}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <EmptySlot key={`fac-empty-${i}`} />
        ))}
      </div>
    </div>
  );
}

// ── שוק מופתים ────────────────────────────────────────────────────────────────

interface MofetProps {
  market: MarketState;
  allCardDefs: CardDef[];
  players: PlayerState[];
  currentPlayerFaction: FactionId;
  currentPlayerMoney: number;
  currentPlayerMilk: number;
  mofetUsedThisTurn: boolean;
  onBuyMofet: (instance: CardInstance) => void;
}

export function MofetMarketSection({
  market,
  allCardDefs,
  players,
  currentPlayerMoney,
  currentPlayerMilk,
  mofetUsedThisTurn,
  onBuyMofet,
}: MofetProps) {
  function getDef(defId: string) {
    return allCardDefs.find((d) => d.id === defId);
  }

  function handleAction(_action: string, instanceId: string) {
    const inst = market.mofetVisible.find((c) => c.instanceId === instanceId);
    if (inst) onBuyMofet(inst);
  }

  // Build taken map from all players' mofets
  const takenMofets = new Map<string, PlayerState>();
  for (const player of players) {
    for (const mofet of player.mofets) {
      takenMofets.set(mofet.instanceId, player);
    }
  }

  return (
    <div>
      <SectionHeader
        title="מופתים"
        count={market.mofetVisible.length}
        countLabel="זמינים"
        className="bg-purple-50 border-purple-100"
      />
      <div className="p-3">
        {market.mofetVisible.length === 0 ? (
          <div className="text-center text-stone-400 text-sm py-8">אין מופתים</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {market.mofetVisible.map((inst) => {
              const def = getDef(inst.defId);
              if (!def) return null;
              const takenByPlayer = takenMofets.get(inst.instanceId);

              if (takenByPlayer) {
                return (
                  <div key={inst.instanceId} className="relative shrink-0" style={{ width: `${CARD_W}px`, minHeight: `${CARD_H}px` }}>
                    <CardView
                      instance={inst}
                      def={def}
                      location="market-mofet"
                      playerMoney={currentPlayerMoney}
                      playerMilk={currentPlayerMilk}
                      compact={true}
                    />
                    {/* Grey overlay */}
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: "rgba(120,113,108,0.45)", filter: "grayscale(60%)" }}
                    />
                    {/* Taken banner */}
                    <div
                      className={`absolute inset-x-0 bottom-2 mx-1 rounded-lg px-2 py-1.5 text-center text-xs font-bold z-10 ${
                        FACTION_TAKEN_COLORS[takenByPlayer.factionId] ?? "bg-stone-700 text-white"
                      }`}
                    >
                      <div className="text-[10px] opacity-80">✓ נלקח על ידי:</div>
                      <div>{takenByPlayer.name}</div>
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
                  compact={true}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
