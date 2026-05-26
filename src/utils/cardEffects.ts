import type { CardDef, PlayerState } from "../types/game";
import { drawCards } from "./deck";

export interface AppliedEffect {
  icon: string;
  label: string;
  delta: number;
}

export interface EffectResult {
  updatedPlayer: PlayerState;
  effects: AppliedEffect[];
  extraLogs: string[];
}

export function applyCardEffects(
  player: PlayerState,
  card: CardDef,
  allCards: CardDef[],
  opts: { skipMilkCost?: boolean } = {}
): EffectResult {
  // allCards reserved for future card-interaction effects
  void allCards;
  const effects: AppliedEffect[] = [];
  let p = { ...player };
  const extraLogs: string[] = [];

  if (!opts.skipMilkCost && card.costMilkPlay) {
    p.milk = Math.max(0, p.milk - card.costMilkPlay);
    effects.push({ icon: "🥛", label: "עלות", delta: -card.costMilkPlay });
  }

  if (card.gainMoney) {
    p.money += card.gainMoney;
    effects.push({ icon: "💰", label: "כסף", delta: card.gainMoney });
  }

  if (card.gainFollowers) {
    p.followers += card.gainFollowers;
    effects.push({ icon: "👥", label: "חסידים", delta: card.gainFollowers });
  }

  if (card.gainMilk) {
    p.milk += card.gainMilk;
    effects.push({ icon: "🥛", label: 'חל"ב', delta: card.gainMilk });
  }

  if (card.gainDanger) {
    p.danger += card.gainDanger;
    effects.push({
      icon: card.gainDanger > 0 ? "⚠️" : "⚠️",
      label: "סכנה",
      delta: card.gainDanger,
    });
    if (card.gainDanger > 0 && p.danger >= 6) {
      effects.push({ icon: "🚨", label: "התפרצות!", delta: 0 });
      extraLogs.push(`⚠️ ${player.name} הגיע ל-${p.danger} סכנה — הפעל התפרצות!`);
    }
  }

  if (card.gainDraw) {
    const { player: afterDraw, log: reshuffleMsgs } = drawCards(p, card.gainDraw, []);
    p = afterDraw;
    effects.push({ icon: "🎴", label: "שלף", delta: card.gainDraw });
    extraLogs.push(...reshuffleMsgs);
  }

  return { updatedPlayer: p, effects, extraLogs };
}

export function shouldAutoApply(card: CardDef): boolean {
  return card.effectDisplay !== "text" && card.type !== "trouble";
}

export function buildEffectLogSuffix(effects: AppliedEffect[]): string {
  const parts = effects
    .filter(e => e.delta !== 0 && e.label !== "התפרצות!")
    .map(e => `${e.icon}${e.delta > 0 ? "+" : ""}${e.delta}`);
  return parts.length ? `: ${parts.join(", ")}` : "";
}
