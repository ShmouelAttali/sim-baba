import type { CardDef, CardInstance, GameState, MarketState, PlayerState } from "../types/game";

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function makeInstanceId(defId: string, index: number): string {
  return `${defId}-${index}-${Math.random().toString(36).slice(2, 7)}`;
}

export function drawCards(
  player: PlayerState,
  count: number,
  log: string[]
): { player: PlayerState; log: string[] } {
  let deck = [...player.deck];
  let discard = [...player.discard];
  let hand = [...player.hand];
  let newLog = [...log];
  let nextDrawOrder = player.nextDrawOrder ?? 0;

  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck = shuffle(discard);
      discard = [];
      newLog = [...newLog, `דק ריק — זרוקים עורבבו לדק (${player.name}).`];
    }
    const drawnCard = { ...deck[0], drawOrder: nextDrawOrder++ };
    hand = [...hand, drawnCard];
    deck = deck.slice(1);
  }

  return {
    player: { ...player, deck, discard, hand, nextDrawOrder },
    log: newLog,
  };
}

export function discardHandAndPlayed(player: PlayerState): PlayerState {
  return {
    ...player,
    discard: [...player.discard, ...player.hand, ...player.played],
    hand: [],
    played: [],
  };
}

export function endTurn(game: GameState): GameState {
  const currentPlayer = game.players[game.currentPlayerIndex];
  const afterDiscard = discardHandAndPlayed(currentPlayer);
  const afterReset: PlayerState = {
    ...afterDiscard,
    money: 0,
    mofetUsedThisTurn: false,
    invertEffectsThisTurn: false,
    blockBuyAndMofetThisTurn: false,
  };

  const baseLog = [...game.log, `סיים תור — ${currentPlayer.name}. כסף אופס.`];

  let afterDraw: PlayerState;
  let newLog: string[];
  if (afterReset.skipDrawThisTurn) {
    afterDraw = { ...afterReset, skipDrawThisTurn: false };
    newLog = [...baseLog, `${currentPlayer.name} — היינו כחולמים: שומר יד לתור הבא`];
  } else {
    const result = drawCards(afterReset, 5, baseLog);
    afterDraw = result.player;
    newLog = result.log;
  }

  const nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
  const updatedPlayers = game.players.map((p, i) =>
    i === game.currentPlayerIndex ? afterDraw : p
  );

  return {
    ...game,
    players: updatedPlayers,
    currentPlayerIndex: nextIndex,
    turnNumber: game.turnNumber + 1,
    log: newLog,
  };
}

export function buyCard(
  game: GameState,
  playerId: string,
  cardInstance: CardInstance,
  fromMarket: "general" | "faction" | "mofet",
  cardDef: CardDef
): GameState {
  const playerIndex = game.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return game;

  let player = { ...game.players[playerIndex] };
  let market = { ...game.market };
  let log = [...game.log];

  if (fromMarket === "general") {
    const cost = cardDef.costMoney ?? 0;
    player = { ...player, money: player.money - cost, discard: [...player.discard, cardInstance] };

    const visibleIdx = market.generalVisible.findIndex(
      (c) => c.instanceId === cardInstance.instanceId
    );
    if (visibleIdx !== -1) {
      const newVisible = [...market.generalVisible];
      if (market.generalDeck.length > 0) {
        newVisible[visibleIdx] = market.generalDeck[0];
        market = { ...market, generalVisible: newVisible, generalDeck: market.generalDeck.slice(1) };
      } else {
        newVisible.splice(visibleIdx, 1);
        market = { ...market, generalVisible: newVisible };
      }
    }
    log = [...log, `${player.name} קנה: ${cardDef.name}`];

  } else if (fromMarket === "faction") {
    const cost = cardDef.costMoney ?? 0;
    player = { ...player, money: player.money - cost, discard: [...player.discard, cardInstance] };

    const factionVis = [...(player.factionMarketVisible ?? [])];
    const factionDeck = [...(player.factionMarketDeck ?? [])];
    const visIdx = factionVis.findIndex((c) => c.instanceId === cardInstance.instanceId);
    if (visIdx !== -1) {
      if (factionDeck.length > 0) {
        factionVis[visIdx] = factionDeck[0];
        player = { ...player, factionMarketVisible: factionVis, factionMarketDeck: factionDeck.slice(1) };
      } else {
        factionVis.splice(visIdx, 1);
        player = { ...player, factionMarketVisible: factionVis };
      }
    }
    log = [...log, `${player.name} קנה: ${cardDef.name}`];

  } else {
    // mofet — do NOT remove from mofetVisible; card stays with overlay
    const cost = cardDef.costMilk ?? 0;
    player = {
      ...player,
      milk: player.milk - cost,
      mofets: [...player.mofets, cardInstance],
      mofetUsedThisTurn: true,
    };
    log = [...log, `${player.name} ביצע מופת: ${cardDef.name}`];
  }

  const updatedPlayers = game.players.map((p, i) => (i === playerIndex ? player : p));
  return { ...game, players: updatedPlayers, market, log };
}

export function buildMarket(allCards: CardDef[], playerCount: number): MarketState {
  const generalCards = allCards.filter((c) => c.source === "general_market");
  let generalInstances: CardInstance[] = [];
  let instIdx = 0;
  for (const card of generalCards) {
    for (let i = 0; i < card.copies; i++) {
      generalInstances.push({ instanceId: makeInstanceId(card.id, instIdx++), defId: card.id });
    }
  }
  generalInstances = shuffle(generalInstances);
  const generalVisible = generalInstances.slice(0, 5);
  const generalDeck = generalInstances.slice(5);

  const mofetCards = allCards.filter((c) => c.source === "mofet_market");
  let mofetInstances: CardInstance[] = [];
  instIdx = 0;
  for (const card of mofetCards) {
    for (let i = 0; i < card.copies; i++) {
      mofetInstances.push({ instanceId: makeInstanceId(card.id, instIdx++), defId: card.id });
    }
  }
  mofetInstances = shuffle(mofetInstances);
  const mofetPoolSize = playerCount * 2 + 1;
  const mofetVisible = mofetInstances.slice(0, mofetPoolSize);
  const mofetDeck: CardInstance[] = [];

  const curseCards = allCards.filter((c) => c.source === "curse_deck");
  let curseInstances: CardInstance[] = [];
  instIdx = 0;
  for (const card of curseCards) {
    for (let i = 0; i < card.copies; i++) {
      curseInstances.push({ instanceId: makeInstanceId(`curse-${card.id}`, instIdx++), defId: card.id });
    }
  }
  const curseDeck = shuffle(curseInstances);

  return { generalDeck, generalVisible, mofetDeck, mofetVisible, curseDeck };
}
