import type { CardDef, FactionDef, FactionId, GameState, PlayerState } from "../types/game";
import { buildMarket, drawCards, makeInstanceId, shuffle } from "./deck";

export const CURRENT_SCHEMA_VERSION = 2;
const STORAGE_KEY = "simBabaGame";

export function getFaction(id: FactionId, factions: FactionDef[]): FactionDef {
  return factions.find((f) => f.id === id) ?? factions[0];
}

export function createPlayer(
  id: string,
  name: string,
  factionId: FactionId,
  allCards: CardDef[],
  factions: FactionDef[]
): PlayerState {
  const faction = getFaction(factionId, factions);
  const startingCards = allCards.filter(
    (c) => c.source === "starting_deck" && c.faction === factionId
  );

  let instances = [];
  let idx = 0;
  for (const card of startingCards) {
    for (let i = 0; i < card.copies; i++) {
      instances.push({ instanceId: makeInstanceId(card.id, idx++), defId: card.id });
    }
  }
  instances = shuffle(instances);

  return {
    id,
    name,
    factionId,
    deck: instances,
    hand: [],
    discard: [],
    played: [],
    yard: [],
    mofets: [],
    followers: faction.startingFollowers,
    money: 0,
    milk: faction.startingMilk,
    infrastructure: faction.startingInfrastructure,
    danger: 0,
  };
}

export interface SetupPlayer {
  name: string;
  factionId: FactionId;
}

export function createNewGame(
  setupPlayers: SetupPlayer[],
  allCards: CardDef[],
  factions: FactionDef[]
): GameState {
  const players: PlayerState[] = setupPlayers.map((sp, i) =>
    createPlayer(
      `player-${i}`,
      sp.name || getFaction(sp.factionId, factions).name,
      sp.factionId,
      allCards,
      factions
    )
  );

  const market = buildMarket(allCards);
  const log: string[] = ["משחק חדש התחיל!"];

  const drawnPlayers: PlayerState[] = [];
  let currentLog = log;
  for (const p of players) {
    const { player, log: newLog } = drawCards(p, 5, currentLog);
    drawnPlayers.push(player);
    currentLog = newLog;
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    players: drawnPlayers,
    currentPlayerIndex: 0,
    market,
    turnNumber: 1,
    log: currentLog,
  };
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function loadGame(): GameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as GameState;
    if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}
