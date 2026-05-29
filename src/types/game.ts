export type CardType =
  | "action"
  | "person"
  | "institution"
  | "trouble"
  | "mofet"
  | "helper";

export type FactionId =
  | "baba"
  | "breslov"
  | "chabad"
  | "litvaks"
  | "general"
  | "all";

export type CardSource =
  | "starting_deck"
  | "general_market"
  | "faction_market"
  | "mofet_market"
  | "curse_deck"
  | "helper";

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  faction: FactionId;
  source: CardSource;
  copies: number;
  costMoney?: number;
  costMilk?: number;
  requirements?: string;
  milkText?: string;
  yardText?: string;
  effectText?: string;
  addsDanger?: number;
  notes?: string;
  tags?: string[];
  gainMoney?: number;
  gainFollowers?: number;
  gainMilk?: number;
  gainDanger?: number;
  gainDraw?: number;
  costMilkPlay?: number;
  yardInfra?: number;
  effectDisplay?: "icons" | "icons_text" | "text";
  imageUrl?: string;
}

export interface CardInstance {
  instanceId: string;
  defId: string;
  drawOrder?: number;
}

export interface PlayerState {
  id: string;
  name: string;
  factionId: FactionId;
  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  played: CardInstance[];
  yard: CardInstance[];
  mofets: CardInstance[];
  followers: number;
  money: number;
  milk: number;
  infrastructure: number;
  danger: number;
  mofetUsedThisTurn: boolean;
  invertEffectsThisTurn: boolean;
  skipDrawThisTurn: boolean;
  blockBuyAndMofetThisTurn: boolean;
  nextDrawOrder: number;
  factionMarketDeck: CardInstance[];
  factionMarketVisible: CardInstance[];
}

export interface MarketState {
  generalDeck: CardInstance[];
  generalVisible: CardInstance[];
  mofetDeck: CardInstance[];
  mofetVisible: CardInstance[];
  curseDeck: CardInstance[];
}

export interface FactionDef {
  id: FactionId;
  name: string;
  dangerName: string;
  startingInfrastructure: number;
  startingFollowers: number;
  startingMilk?: number;
  abilityName?: string;
  abilityText: string;
  outburstText: string;
}

export interface GameState {
  schemaVersion: number;
  players: PlayerState[];
  currentPlayerIndex: number;
  market: MarketState;
  turnNumber: number;
  log: string[];
}
