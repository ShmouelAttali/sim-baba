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

export interface CurseEffectResult {
  updatedPlayer: PlayerState;
  effects: AppliedEffect[];
  extraLogs: string[];
  otherPlayersFollowerGain?: number;
}

export function applyOverloadCheck(player: PlayerState): { player: PlayerState; dangerAdded: number } {
  const excess = Math.max(0, player.followers - player.infrastructure);
  const dangerToAdd = Math.ceil(excess / 5);
  if (dangerToAdd === 0) return { player, dangerAdded: 0 };
  return { player: { ...player, danger: player.danger + dangerToAdd }, dangerAdded: dangerToAdd };
}

export function applyCurseCardEffect(
  player: PlayerState,
  card: CardDef,
  otherPlayerCount: number
): CurseEffectResult {
  let p = { ...player };
  const effects: AppliedEffect[] = [];
  const extraLogs: string[] = [];

  switch (card.id) {
    case "DC-001": {
      p.milk = Math.max(0, p.milk - 1);
      p.danger += 1;
      effects.push({ icon: "🥛", label: 'חל"ב', delta: -1 });
      effects.push({ icon: "⚠️", label: "סכנה", delta: 1 });
      const { player: c1, dangerAdded: d1 } = applyOverloadCheck(p);
      p = c1;
      if (d1 > 0) effects.push({ icon: "⚠️", label: "עומס", delta: d1 });
      if (p.danger >= 6) {
        effects.push({ icon: "🚨", label: "התפרצות!", delta: 0 });
        extraLogs.push(`⚠️ ${player.name} הגיע ל-${p.danger} סכנה — הפעל התפרצות!`);
      }
      break;
    }
    case "DC-002": {
      p.milk = Math.max(0, p.milk - 2);
      p.danger += 2;
      effects.push({ icon: "🥛", label: 'חל"ב', delta: -2 });
      effects.push({ icon: "⚠️", label: "סכנה", delta: 2 });
      const { player: c2, dangerAdded: d2 } = applyOverloadCheck(p);
      p = c2;
      if (d2 > 0) effects.push({ icon: "⚠️", label: "עומס", delta: d2 });
      if (p.danger >= 6) {
        effects.push({ icon: "🚨", label: "התפרצות!", delta: 0 });
        extraLogs.push(`⚠️ ${player.name} הגיע ל-${p.danger} סכנה — הפעל התפרצות!`);
      }
      break;
    }
    case "DC-003": {
      p.skipDrawThisTurn = true;
      effects.push({ icon: "🎴", label: "שמור יד", delta: 0 });
      extraLogs.push(`${player.name} — היינו כחולמים: לא תשלוף קלפים בסוף התור`);
      break;
    }
    case "DC-004": {
      const dangerToAdd = p.danger >= 3 ? 5 : 3;
      p.danger += dangerToAdd;
      effects.push({ icon: "⚠️", label: "סכנה", delta: dangerToAdd });
      const { player: c4, dangerAdded: d4 } = applyOverloadCheck(p);
      p = c4;
      if (d4 > 0) effects.push({ icon: "⚠️", label: "עומס", delta: d4 });
      if (p.danger >= 6) {
        effects.push({ icon: "🚨", label: "התפרצות!", delta: 0 });
        extraLogs.push(`⚠️ ${player.name} הגיע ל-${p.danger} סכנה — הפעל התפרצות!`);
      }
      break;
    }
    case "DC-005": {
      extraLogs.push(`אבי ואמי עזבוני — ${player.name}: העבר את כל האנשים מהחצר לזרוקים ידנית`);
      break;
    }
    case "DC-006": {
      const loss = 2 * otherPlayerCount;
      p.followers = Math.max(0, p.followers - loss);
      effects.push({ icon: "👥", label: "חסידים", delta: -loss });
      extraLogs.push(`שדות זרים — ${player.name} איבד ${loss} חסידים. כל שאר השחקנים קיבלו 2 חסידים.`);
      return { updatedPlayer: p, effects, extraLogs, otherPlayersFollowerGain: 2 };
    }
    case "DC-007": {
      p.blockBuyAndMofetThisTurn = true;
      effects.push({ icon: "🚫", label: "חנויות נעולות", delta: 0 });
      extraLogs.push(`נועלים את החנויות — ${player.name} לא יכול לקנות קלפים או לבצע מופת התור הזה`);
      break;
    }
    case "DC-008": {
      p.invertEffectsThisTurn = true;
      effects.push({ icon: "🔄", label: "הינדיק!", delta: 0 });
      extraLogs.push(`הרבי שהפך להינדיק — ${player.name}: כל האפקטים הפוכים התור הזה!`);
      break;
    }
    default: {
      extraLogs.push(`${player.name} שיחק קלף דינים: ${card.name} — יש להחיל אפקט ידנית`);
      break;
    }
  }

  return { updatedPlayer: p, effects, extraLogs };
}

export function applyCardEffects(
  player: PlayerState,
  card: CardDef,
  allCards: CardDef[],
  opts: { skipMilkCost?: boolean } = {}
): EffectResult {
  void allCards;
  const effects: AppliedEffect[] = [];
  let p = { ...player };
  const extraLogs: string[] = [];
  const inv = p.invertEffectsThisTurn ? -1 : 1;

  if (!opts.skipMilkCost && card.costMilkPlay) {
    p.milk = Math.max(0, p.milk - card.costMilkPlay);
    effects.push({ icon: "🥛", label: "עלות", delta: -card.costMilkPlay });
  }

  if (card.gainMoney) {
    const delta = card.gainMoney * inv;
    p.money = Math.max(0, p.money + delta);
    effects.push({ icon: inv === -1 ? "🔄💰" : "💰", label: "כסף", delta });
  }

  if (card.gainFollowers) {
    const delta = card.gainFollowers * inv;
    p.followers = Math.max(0, p.followers + delta);
    effects.push({ icon: inv === -1 ? "🔄👥" : "👥", label: "חסידים", delta });
  }

  if (card.gainMilk) {
    const delta = card.gainMilk * inv;
    p.milk = Math.max(0, p.milk + delta);
    effects.push({ icon: inv === -1 ? "🔄🥛" : "🥛", label: 'חל"ב', delta });
  }

  if (card.gainDanger) {
    const delta = card.gainDanger * inv;
    p.danger = Math.max(0, p.danger + delta);
    effects.push({ icon: "⚠️", label: "סכנה", delta });
    if (delta > 0 && p.danger >= 6) {
      effects.push({ icon: "🚨", label: "התפרצות!", delta: 0 });
      extraLogs.push(`⚠️ ${player.name} הגיע ל-${p.danger} סכנה — הפעל התפרצות!`);
    }
  }

  if (card.gainDraw) {
    if (inv === -1) {
      const toDiscard = p.hand.slice(0, card.gainDraw);
      p = { ...p, hand: p.hand.slice(card.gainDraw), discard: [...p.discard, ...toDiscard] };
      effects.push({ icon: "🎴", label: "השלך", delta: -card.gainDraw });
    } else {
      const { player: afterDraw, log: reshuffleMsgs } = drawCards(p, card.gainDraw, []);
      p = afterDraw;
      effects.push({ icon: "🎴", label: "שלף", delta: card.gainDraw });
      extraLogs.push(...reshuffleMsgs);
    }
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
