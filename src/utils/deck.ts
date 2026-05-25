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

  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck = shuffle(discard);
      discard = [];
      newLog = [...newLog, `דק ריק — זרוקים עורבבו לדק (${player.name}).`];
    }
    hand = [...hand, deck[0]];
    deck = deck.slice(1);
  }

  return {
    player: { ...player, deck, discard, hand },
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
  const afterMoney = { ...afterDiscard, money: 0 };

  const { player: afterDraw, log: newLog } = drawCards(afterMoney, 5, [
    ...game.log,
    `סיים תור — ${currentPlayer.name}. כסף אופס.`,
  ]);

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

  if (fromMarket === "general" || fromMarket === "faction") {
    const cost = cardDef.costMoney ?? 0;
    player = { ...player, money: player.money - cost };
    player = { ...player, discard: [...player.discard, cardInstance] };

    if (fromMarket === "general") {
      const visibleIdx = market.generalVisible.findIndex(
        (c) => c.instanceId === cardInstance.instanceId
      );
      if (visibleIdx !== -1) {
        const newVisible = [...market.generalVisible];
        if (market.generalDeck.length > 0) {
          newVisible[visibleIdx] = market.generalDeck[0];
          market = {
            ...market,
            generalVisible: newVisible,
            generalDeck: market.generalDeck.slice(1),
          };
        } else {
          newVisible.splice(visibleIdx, 1);
          market = { ...market, generalVisible: newVisible };
        }
      }
    } else {
      const playerFaction = game.players[playerIndex].factionId;
      const factionVis = [...(market.factionVisible[playerFaction] ?? [])];
      const factionDeck = [...(market.factionDecks[playerFaction] ?? [])];
      const visIdx = factionVis.findIndex((c) => c.instanceId === cardInstance.instanceId);
      if (visIdx !== -1) {
        if (factionDeck.length > 0) {
          factionVis[visIdx] = factionDeck[0];
          market = {
            ...market,
            factionVisible: { ...market.factionVisible, [playerFaction]: factionVis },
            factionDecks: { ...market.factionDecks, [playerFaction]: factionDeck.slice(1) },
          };
        } else {
          factionVis.splice(visIdx, 1);
          market = {
            ...market,
            factionVisible: { ...market.factionVisible, [playerFaction]: factionVis },
          };
        }
      }
    }
    log = [...log, `${player.name} קנה: ${cardDef.name}`];
  } else {
    const cost = cardDef.costMilk ?? 0;
    player = { ...player, milk: player.milk - cost };
    player = { ...player, mofets: [...player.mofets, cardInstance] };

    const visibleIdx = market.mofetVisible.findIndex(
      (c) => c.instanceId === cardInstance.instanceId
    );
    if (visibleIdx !== -1) {
      const newVisible = [...market.mofetVisible];
      if (market.mofetDeck.length > 0) {
        newVisible[visibleIdx] = market.mofetDeck[0];
        market = {
          ...market,
          mofetVisible: newVisible,
          mofetDeck: market.mofetDeck.slice(1),
        };
      } else {
        newVisible.splice(visibleIdx, 1);
        market = { ...market, mofetVisible: newVisible };
      }
    }
    log = [...log, `${player.name} ביצע מופת: ${cardDef.name}`];
  }

  const updatedPlayers = game.players.map((p, i) =>
    i === playerIndex ? player : p
  );

  return { ...game, players: updatedPlayers, market, log };
}

export function playCard(player: PlayerState, instanceId: string): PlayerState {
  const card = player.hand.find((c) => c.instanceId === instanceId);
  if (!card) return player;
  return {
    ...player,
    hand: player.hand.filter((c) => c.instanceId !== instanceId),
    played: [...player.played, card],
  };
}

export function placeInYard(player: PlayerState, instanceId: string): PlayerState {
  const card = player.hand.find((c) => c.instanceId === instanceId);
  if (!card) return player;
  return {
    ...player,
    hand: player.hand.filter((c) => c.instanceId !== instanceId),
    yard: [...player.yard, card],
  };
}

export function discardFromHand(player: PlayerState, instanceId: string): PlayerState {
  const card = player.hand.find((c) => c.instanceId === instanceId);
  if (!card) return player;
  return {
    ...player,
    hand: player.hand.filter((c) => c.instanceId !== instanceId),
    discard: [...player.discard, card],
  };
}

export function returnToHand(
  player: PlayerState,
  instanceId: string,
  from: "played" | "yard" | "discard"
): PlayerState {
  let sourceArr: CardInstance[];
  if (from === "played") sourceArr = player.played;
  else if (from === "yard") sourceArr = player.yard;
  else sourceArr = player.discard;

  const card = sourceArr.find((c) => c.instanceId === instanceId);
  if (!card) return player;

  const filtered = sourceArr.filter((c) => c.instanceId !== instanceId);

  if (from === "played") return { ...player, played: filtered, hand: [...player.hand, card] };
  if (from === "yard") return { ...player, yard: filtered, hand: [...player.hand, card] };
  return { ...player, discard: filtered, hand: [...player.hand, card] };
}

export function returnToDiscard(
  player: PlayerState,
  instanceId: string,
  from: "yard" | "mofets"
): PlayerState {
  let sourceArr = from === "yard" ? player.yard : player.mofets;
  const card = sourceArr.find((c) => c.instanceId === instanceId);
  if (!card) return player;
  const filtered = sourceArr.filter((c) => c.instanceId !== instanceId);
  if (from === "yard") return { ...player, yard: filtered, discard: [...player.discard, card] };
  return { ...player, mofets: filtered, discard: [...player.discard, card] };
}

export function buildMarket(allCards: CardDef[]): MarketState {
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
  const mofetVisible = mofetInstances.slice(0, 3);
  const mofetDeck = mofetInstances.slice(3);

  const factionIds = ["baba", "breslov", "chabad", "litvaks"] as const;
  const factionDecks: Partial<Record<string, CardInstance[]>> = {};
  const factionVisible: Partial<Record<string, CardInstance[]>> = {};
  for (const factionId of factionIds) {
    const cards = allCards.filter((c) => c.source === "faction_market" && c.faction === factionId);
    let instances: CardInstance[] = [];
    let fi = 0;
    for (const card of cards) {
      for (let i = 0; i < card.copies; i++) {
        instances.push({ instanceId: makeInstanceId(`${factionId}-${card.id}`, fi++), defId: card.id });
      }
    }
    instances = shuffle(instances);
    factionVisible[factionId] = instances.slice(0, 5);
    factionDecks[factionId] = instances.slice(5);
  }

  return { generalDeck, generalVisible, mofetDeck, mofetVisible, factionDecks, factionVisible };
}
