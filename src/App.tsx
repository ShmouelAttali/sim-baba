import { useState, useEffect, useCallback } from "react";
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
import AppHeader from "./components/AppHeader";
import CountersBar from "./components/CountersBar";
import GameSetup from "./components/GameSetup";
import PlayerBoard from "./components/PlayerBoard";
import MarketBottom from "./components/MarketBottom";

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
      applyGameState(endTurn(snapshot));
    }, 180);
  }

  // ── Market handlers ───────────────────────────────────────────────────────

  function handleBuyGeneral(instance: CardInstance) {
    if (!game) return;
    const def = allCardDefs.find((d) => d.id === instance.defId);
    if (!def) return;
    const playerId = game.players[game.currentPlayerIndex].id;
    pushHistory(game);
    applyGameState(buyCard(game, playerId, instance, "general", def));
  }

  function handleBuyFaction(instance: CardInstance) {
    if (!game) return;
    const def = allCardDefs.find((d) => d.id === instance.defId);
    if (!def) return;
    const playerId = game.players[game.currentPlayerIndex].id;
    pushHistory(game);
    applyGameState(buyCard(game, playerId, instance, "faction", def));
  }

  function handleBuyMofet(instance: CardInstance) {
    if (!game) return;
    const def = allCardDefs.find((d) => d.id === instance.defId);
    if (!def) return;
    const playerId = game.players[game.currentPlayerIndex].id;
    pushHistory(game);
    applyGameState(buyCard(game, playerId, instance, "mofet", def));
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
    <div className="overflow-hidden" style={{ height: "100vh", display: "grid", gridTemplateRows: "auto auto 1fr auto" }}>
      <AppHeader
        turnNumber={game.turnNumber}
        currentPlayerName={currentPlayer.name}
        log={game.log}
        players={game.players}
        currentPlayerIndex={game.currentPlayerIndex}
        factions={factions}
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

      <CountersBar
        player={currentPlayer}
        faction={currentFaction}
        onUpdatePlayer={updateCurrentPlayer}
        isEndingTurn={endTurnFlash}
      />

      {/* Main area — grid 1fr row gives PlayerBoard a definite pixel height */}
      <div className="overflow-hidden">
        <PlayerBoard
          player={currentPlayer}
          allCardDefs={allCardDefs}
          onUpdatePlayer={updateCurrentPlayer}
          isEndingTurn={isEndingTurn}
        />
      </div>

      <MarketBottom
        market={game.market}
        allCardDefs={allCardDefs}
        currentPlayerFaction={currentPlayer.factionId}
        factions={factions}
        currentPlayerMoney={currentPlayer.money}
        currentPlayerMilk={currentPlayer.milk}
        currentPlayerYard={currentPlayer.yard}
        currentPlayerMofets={currentPlayer.mofets}
        onBuyGeneral={handleBuyGeneral}
        onBuyFaction={handleBuyFaction}
        onBuyMofet={handleBuyMofet}
        onReturnFromYard={handleReturnFromYard}
      />

    </div>
  );
}
