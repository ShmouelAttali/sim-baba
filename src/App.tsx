import { useState, useEffect, useCallback, useRef } from "react";
import type { CardDef, CardInstance, FactionDef, GameState, PlayerState } from "./types/game";
import { loadCards, loadFactions } from "./utils/loadSheetData";
import {
  createNewGame,
  loadGame,
  saveGame,
  clearSave,
} from "./utils/gameSetup";
import type { SetupPlayer } from "./utils/gameSetup";
import { buyCard, endTurn } from "./utils/deck";
import { applyCardEffects, buildEffectLogSuffix } from "./utils/cardEffects";
import { Toast } from "./components/Toast";
import type { ToastData } from "./components/Toast";
import AppHeader from "./components/AppHeader";
import CountersBar from "./components/CountersBar";
import GameSetup from "./components/GameSetup";
import PlayerBoard from "./components/PlayerBoard";
import YardSection from "./components/YardSection";
import {
  GeneralMarketSection,
  FactionMarketSection,
  MofetMarketSection,
} from "./components/MarketBottom";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; cards: CardDef[]; factions: FactionDef[] };

type ReloadState = "idle" | "loading" | "success" | "error";

const MAX_HISTORY = 10;

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [game, setGame] = useState<GameState | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [history, setHistory] = useState<GameState[]>([]);
  const [reloadState, setReloadState] = useState<ReloadState>("idle");
  const [reloadError, setReloadError] = useState<string | undefined>();
  const [endTurnFlash, setEndTurnFlash] = useState(false);
  const [isEndingTurn, setIsEndingTurn] = useState(false);
  const [victory, setVictory] = useState<{ playerName: string; factionName: string; type: string; icon: string } | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const toastKeyRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const [cards, factions] = await Promise.all([loadCards(), loadFactions()]);
      setLoadState({ status: "ready", cards, factions });
      setHasSavedGame(loadGame() !== null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
      setLoadState({ status: "error", message: msg });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleReloadCards() {
    setReloadState("loading");
    setReloadError(undefined);
    try {
      const [cards, factions] = await Promise.all([loadCards(), loadFactions()]);
      setLoadState((prev) =>
        prev.status === "ready" ? { ...prev, cards, factions } : prev
      );
      setReloadState("success");
      setTimeout(() => setReloadState("idle"), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
      setReloadState("error");
      setReloadError(msg);
      setTimeout(() => setReloadState("idle"), 4000);
    }
  }

  // ── Loading / error screens ───────────────────────────────────────────────
  if (loadState.status === "loading") {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-stone-400 border-t-stone-800 rounded-full animate-spin mx-auto" />
          <p className="text-stone-600 text-lg">טוען קלפים מ-Google Sheets...</p>
        </div>
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-2xl font-bold text-red-700">שגיאה בטעינת קלפים</h2>
          <p className="text-stone-600">
            לא ניתן לטעון את הקלפים מ-Google Sheets.
            <br />
            ודא שה-Sheet מפורסם כ-CSV ושכתובת ה-URL נכונה.
          </p>
          <details className="text-right">
            <summary className="cursor-pointer text-stone-500 text-sm hover:text-stone-700">
              פרטים טכניים
            </summary>
            <pre className="mt-2 p-3 bg-stone-50 border border-stone-200 rounded text-xs text-stone-700 text-left overflow-auto max-h-32" dir="ltr">
              {loadState.message}
            </pre>
          </details>
          <button
            onClick={fetchData}
            className="bg-stone-800 hover:bg-stone-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  const { cards: allCardDefs, factions } = loadState;

  // ── Victory checks ────────────────────────────────────────────────────────

  function checkTorahVictory(player: PlayerState): boolean {
    const yardDefs = player.yard.map((c) => allCardDefs.find((d) => d.id === c.defId));
    const lomdim = yardDefs.filter((d) => d?.tags?.includes("לומד")).length;
    const mosadotLimud = yardDefs.filter((d) => d?.tags?.includes("מוסד לימוד")).length;
    return lomdim >= 4 && mosadotLimud >= 2 && player.milk >= 25;
  }

  function checkMachineVictory(player: PlayerState): boolean {
    const yardDefs = player.yard.map((c) => allCardDefs.find((d) => d.id === c.defId));
    const anashim = yardDefs.filter((d) => d?.type === "person").length;
    const mosadot = yardDefs.filter((d) => d?.type === "institution").length;
    return anashim >= 3 && mosadot >= 2 && player.followers >= 30;
  }

  // ── State helpers ─────────────────────────────────────────────────────────

  function pushHistory(state: GameState) {
    setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), state]);
  }

  function applyGameState(newState: GameState) {
    setGame(newState);
    saveGame(newState);
  }

  function applyWithHistory(newState: GameState) {
    if (game) pushHistory(game);
    applyGameState(newState);
  }

  function updateCurrentPlayer(updated: PlayerState, logMsgs?: string[]) {
    if (!game) return;
    const newLog = logMsgs ? [...game.log, ...logMsgs] : game.log;
    applyWithHistory({
      ...game,
      players: game.players.map((p, i) =>
        i === game.currentPlayerIndex ? updated : p
      ),
      log: newLog,
    });
  }

  // ── Game setup handlers ───────────────────────────────────────────────────

  function handleStart(players: SetupPlayer[]) {
    const newGame = createNewGame(players, allCardDefs, factions);
    setHistory([]);
    applyGameState(newGame);
    setHasSavedGame(true);
  }

  function handleContinue() {
    const saved = loadGame();
    if (saved) {
      setGame(saved);
      setHasSavedGame(true);
    }
  }

  function handleUndo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setGame(prev);
    saveGame(prev);
  }

  function handleReset() {
    if (!confirm("לאפס את המשחק? הנתונים הנוכחיים יאבדו.")) return;
    clearSave();
    setGame(null);
    setHistory([]);
    setHasSavedGame(false);
  }

  function handleSave() {
    if (game) saveGame(game);
  }

  function handleEndTurn() {
    if (!game) return;
    const snapshot = game;
    setEndTurnFlash(true);
    setIsEndingTurn(true);
    setTimeout(() => setEndTurnFlash(false), 400);
    setTimeout(() => {
      setIsEndingTurn(false);
      pushHistory(snapshot);
      const newGame = endTurn(snapshot);
      applyGameState(newGame);
      const nextPlayer = newGame.players[newGame.currentPlayerIndex];
      const factionName = factions.find((f) => f.id === nextPlayer.factionId)?.name ?? "";
      if (checkTorahVictory(nextPlayer)) {
        setVictory({ playerName: nextPlayer.name, factionName, type: "עולם התורה", icon: "📚" });
      } else if (checkMachineVictory(nextPlayer)) {
        setVictory({ playerName: nextPlayer.name, factionName, type: "המכונה המשומנת", icon: "⚙️" });
      }
    }, 180);
  }

  // ── Market handlers ───────────────────────────────────────────────────────

  function handleBuyGeneral(instance: CardInstance) {
    if (!game) return;
    if (game.players[game.currentPlayerIndex].blockBuyAndMofetThisTurn) return;
    const def = allCardDefs.find((d) => d.id === instance.defId);
    if (!def) return;
    const playerId = game.players[game.currentPlayerIndex].id;
    pushHistory(game);
    applyGameState(buyCard(game, playerId, instance, "general", def));
  }

  function handleBuyFaction(instance: CardInstance) {
    if (!game) return;
    if (game.players[game.currentPlayerIndex].blockBuyAndMofetThisTurn) return;
    const def = allCardDefs.find((d) => d.id === instance.defId);
    if (!def) return;
    const playerId = game.players[game.currentPlayerIndex].id;
    pushHistory(game);
    applyGameState(buyCard(game, playerId, instance, "faction", def));
  }

  function handleBuyMofet(instance: CardInstance) {
    if (!game) return;
    if (game.players[game.currentPlayerIndex].blockBuyAndMofetThisTurn) return;
    const def = allCardDefs.find((d) => d.id === instance.defId);
    if (!def) return;
    const playerId = game.players[game.currentPlayerIndex].id;
    pushHistory(game);

    const afterBuy = buyCard(game, playerId, instance, "mofet", def);
    const playerIndex = afterBuy.players.findIndex((p) => p.id === playerId);
    const boughtPlayer = afterBuy.players[playerIndex];

    const { updatedPlayer, effects, extraLogs } = applyCardEffects(
      boughtPlayer, def, allCardDefs, { skipMilkCost: true }
    );
    const suffix = buildEffectLogSuffix(effects);

    // Draw curse card — place on top of player's deck
    const newCurseDeck = [...afterBuy.market.curseDeck];
    let playerWithCurse = updatedPlayer;
    let curseCardName: string | undefined;
    if (newCurseDeck.length > 0) {
      const [curseCard, ...restCurse] = newCurseDeck;
      newCurseDeck.splice(0, newCurseDeck.length, ...restCurse);
      const curseDef = allCardDefs.find((d) => d.id === curseCard.defId);
      curseCardName = curseDef?.name ?? curseCard.defId;
      playerWithCurse = { ...playerWithCurse, deck: [curseCard, ...playerWithCurse.deck] };
    }

    const mofetLog = suffix
      ? [`${playerWithCurse.name} ביצע מופת: ${def.name}${suffix} (+ אפקט ידני)`]
      : [];
    const curseLog = curseCardName
      ? [`${playerWithCurse.name} קיבל קלף דינים: ${curseCardName}`]
      : [];

    const finalGame = {
      ...afterBuy,
      market: { ...afterBuy.market, curseDeck: newCurseDeck },
      players: afterBuy.players.map((p, i) => (i === playerIndex ? playerWithCurse : p)),
      log: [...afterBuy.log, ...extraLogs, ...mofetLog, ...curseLog],
    };
    applyGameState(finalGame);

    toastKeyRef.current += 1;
    setToast({
      cardName: def.name,
      effects,
      needsManual: true,
      curseNote: curseCardName ? `💀 קלף דינים: ${curseCardName}` : undefined,
    });

    const factionName = factions.find((f) => f.id === playerWithCurse.factionId)?.name ?? "";
    if (playerWithCurse.mofets.length >= 3) {
      setVictory({ playerName: playerWithCurse.name, factionName, type: "בעל-מופת", icon: "🏆" });
    }
  }

  function handleCurseCardDC006(updatedCurrentPlayer: PlayerState, followerGain: number, logs: string[]) {
    if (!game) return;
    const gainLogs = game.players
      .filter((_, i) => i !== game.currentPlayerIndex)
      .map((p) => `${p.name} קיבל ${followerGain} חסידים (שדות זרים)`);
    applyWithHistory({
      ...game,
      players: game.players.map((p, i) => {
        if (i === game.currentPlayerIndex) return updatedCurrentPlayer;
        return { ...p, followers: p.followers + followerGain };
      }),
      log: [...game.log, ...logs, ...gainLogs],
    });
  }

  function handleReturnFromYard(instanceId: string) {
    if (!game) return;
    const player = game.players[game.currentPlayerIndex];
    const card = player.yard.find((c) => c.instanceId === instanceId);
    if (!card) return;
    const def = allCardDefs.find((d) => d.id === card.defId);
    const cardName = def?.name ?? instanceId;
    updateCurrentPlayer(
      {
        ...player,
        yard: player.yard.filter((c) => c.instanceId !== instanceId),
        discard: [...player.discard, card],
      },
      [`${player.name} החזיר מחצר לזרוקים: ${cardName}`]
    );
  }

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (!game) {
    return (
      <GameSetup
        factions={factions}
        hasSavedGame={hasSavedGame}
        onStart={handleStart}
        onContinue={handleContinue}
      />
    );
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  const currentFaction = factions.find((f) => f.id === currentPlayer.factionId) ?? factions[0];

  // ── Game screen ───────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <Toast key={toastKeyRef.current} toast={toast} onDismiss={dismissToast} />

      {/* Victory modal */}
      {victory && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="text-5xl">{victory.icon}</div>
            <h2 className="text-2xl font-bold text-amber-300">{victory.type}</h2>
            <p className="text-stone-300 text-lg">
              <strong className="text-white">{victory.playerName}</strong>
              {victory.factionName ? ` (${victory.factionName})` : ""}
            </p>
            <p className="text-stone-400 text-sm">ניצח!</p>
            <button
              onClick={() => setVictory(null)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
            >
              המשך משחק
            </button>
          </div>
        </div>
      )}

      {/* Fixed header */}
      <AppHeader
        turnNumber={game.turnNumber}
        currentPlayerName={currentPlayer.name}
        log={game.log}
        players={game.players}
        currentPlayerIndex={game.currentPlayerIndex}
        factions={factions}
        allCardDefs={allCardDefs}
        onEndTurn={handleEndTurn}
        onSave={handleSave}
        onUndo={handleUndo}
        onReset={handleReset}
        canUndo={history.length > 0}
        onReloadCards={handleReloadCards}
        reloadState={reloadState}
        reloadError={reloadError}
        debugJson={import.meta.env.DEV ? JSON.stringify(game, null, 2) : undefined}
      />

      {/* Fixed counters bar */}
      <CountersBar
        player={currentPlayer}
        faction={currentFaction}
        onUpdatePlayer={updateCurrentPlayer}
        isEndingTurn={endTurnFlash}
      />

      {/* 3-row grid: [Hand | Yard] / [General | Faction] / [Mofet full-width] */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "minmax(278px, auto) auto auto",
          overflow: "auto",
        }}
        className="no-scrollbar"
      >
        {/* Row 1 – Right: Hand zone */}
        <div style={{ overflow: "hidden", borderLeft: "2px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
          <PlayerBoard
            player={currentPlayer}
            allCardDefs={allCardDefs}
            onUpdatePlayer={updateCurrentPlayer}
            isEndingTurn={isEndingTurn}
            onToast={(t) => { toastKeyRef.current += 1; setToast(t); }}
            playerCount={game.players.length}
            onCurseCardDC006={handleCurseCardDC006}
          />
        </div>

        {/* Row 1 – Left: Yard zone */}
        <div style={{ overflow: "hidden", borderBottom: "1px solid #e5e7eb" }}>
          <YardSection
            player={currentPlayer}
            allCardDefs={allCardDefs}
            factions={factions}
            onReturnFromYard={handleReturnFromYard}
          />
        </div>

        {/* Row 2 – Right: שוק כללי */}
        <div style={{ overflow: "hidden", borderLeft: "2px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
          <GeneralMarketSection
            market={game.market}
            allCardDefs={allCardDefs}
            currentPlayerMoney={currentPlayer.money}
            currentPlayerMilk={currentPlayer.milk}
            onBuyGeneral={handleBuyGeneral}
            buyBlocked={currentPlayer.blockBuyAndMofetThisTurn}
          />
        </div>

        {/* Row 2 – Left: שוק פרטי */}
        <div style={{ overflow: "hidden", borderBottom: "1px solid #e5e7eb" }}>
          <FactionMarketSection
            player={currentPlayer}
            allCardDefs={allCardDefs}
            factions={factions}
            currentPlayerMoney={currentPlayer.money}
            currentPlayerMilk={currentPlayer.milk}
            onBuyFaction={handleBuyFaction}
            buyBlocked={currentPlayer.blockBuyAndMofetThisTurn}
          />
        </div>

        {/* Row 3 – שוק מופתים: full width */}
        <div style={{ gridColumn: "1 / 3", overflow: "hidden" }}>
          <MofetMarketSection
            market={game.market}
            allCardDefs={allCardDefs}
            players={game.players}
            currentPlayerFaction={currentPlayer.factionId}
            currentPlayerMoney={currentPlayer.money}
            currentPlayerMilk={currentPlayer.milk}
            mofetUsedThisTurn={currentPlayer.mofetUsedThisTurn}
            onBuyMofet={handleBuyMofet}
            curseDeckCount={game.market.curseDeck.length}
            buyAndMofetBlocked={currentPlayer.blockBuyAndMofetThisTurn}
          />
        </div>

      </div>
    </div>
  );
}
