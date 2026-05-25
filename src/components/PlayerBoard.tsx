import { useState, useEffect, useRef } from "react";
import type { CardDef, CardInstance, PlayerState } from "../types/game";
import { drawCards, shuffle } from "../utils/deck";
import CardView from "./CardView";

interface Props {
  player: PlayerState;
  allCardDefs: CardDef[];
  onUpdatePlayer: (updated: PlayerState, logMsgs?: string[]) => void;
  isEndingTurn?: boolean;
}

export default function PlayerBoard({ player, allCardDefs, onUpdatePlayer, isEndingTurn = false }: Props) {
  const [discardOpen, setDiscardOpen] = useState(false);

  const prevPlayedIdsRef = useRef<Set<string>>(new Set(player.played.map((c) => c.instanceId)));
  const [newPlayedIds, setNewPlayedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(player.played.map((c) => c.instanceId));
    const newOnes = [...currentIds].filter((id) => !prevPlayedIdsRef.current.has(id));
    prevPlayedIdsRef.current = currentIds;
    if (newOnes.length === 0) return;
    setNewPlayedIds(new Set(newOnes));
    const t = setTimeout(() => setNewPlayedIds(new Set()), 280);
    return () => clearTimeout(t);
  }, [player.played]);

  function getDef(defId: string): CardDef | undefined {
    return allCardDefs.find((d) => d.id === defId);
  }

  function findInstance(instanceId: string): CardInstance | undefined {
    return [
      ...player.hand,
      ...player.played,
      ...player.yard,
      ...player.discard,
      ...player.mofets,
      ...player.deck,
    ].find((c) => c.instanceId === instanceId);
  }

  function handleCardAction(action: string, instanceId: string) {
    const def = getDef(findInstance(instanceId)?.defId ?? "");
    const cardName = def?.name ?? instanceId;

    switch (action) {
      case "play": {
        const card = player.hand.find((c) => c.instanceId === instanceId);
        if (!card) return;
        onUpdatePlayer(
          { ...player, hand: player.hand.filter((c) => c.instanceId !== instanceId), played: [...player.played, card] },
          [`${player.name} שיחק: ${cardName}`]
        );
        break;
      }
      case "yard": {
        const card = player.hand.find((c) => c.instanceId === instanceId);
        if (!card) return;
        onUpdatePlayer(
          { ...player, hand: player.hand.filter((c) => c.instanceId !== instanceId), yard: [...player.yard, card] },
          [`${player.name} העמיד בחצר: ${cardName}`]
        );
        break;
      }
      case "discard": {
        const card = player.hand.find((c) => c.instanceId === instanceId);
        if (!card) return;
        onUpdatePlayer({ ...player, hand: player.hand.filter((c) => c.instanceId !== instanceId), discard: [...player.discard, card] });
        break;
      }
      case "returnToHand": {
        const card = player.played.find((c) => c.instanceId === instanceId);
        if (!card) return;
        onUpdatePlayer(
          { ...player, played: player.played.filter((c) => c.instanceId !== instanceId), hand: [...player.hand, card] },
          [`${player.name} החזיר ליד: ${cardName}`]
        );
        break;
      }
      case "discardFromPlayed": {
        const card = player.played.find((c) => c.instanceId === instanceId);
        if (!card) return;
        onUpdatePlayer({ ...player, played: player.played.filter((c) => c.instanceId !== instanceId), discard: [...player.discard, card] });
        break;
      }
      case "returnFromDiscard": {
        const card = player.discard.find((c) => c.instanceId === instanceId);
        if (!card) return;
        onUpdatePlayer(
          { ...player, discard: player.discard.filter((c) => c.instanceId !== instanceId), hand: [...player.hand, card] },
          [`${player.name} החזיר מזרוקים ליד: ${cardName}`]
        );
        break;
      }
      case "returnMofetToDiscard": {
        const card = player.mofets.find((c) => c.instanceId === instanceId);
        if (!card) return;
        onUpdatePlayer({ ...player, mofets: player.mofets.filter((c) => c.instanceId !== instanceId), discard: [...player.discard, card] });
        break;
      }
    }
  }

  function handleDraw5() {
    const { player: updated, log: reshuffleMsgs } = drawCards(player, 5, []);
    onUpdatePlayer(updated, [...reshuffleMsgs, `${player.name} שלף 5 קלפים.`]);
  }

  function handleShuffleDiscardToDeck() {
    const newDeck = shuffle([...player.deck, ...player.discard]);
    onUpdatePlayer({ ...player, deck: newDeck, discard: [] }, [`${player.name} ערבב זרוקים לדק.`]);
  }

  return (
    <div className="h-full flex overflow-hidden bg-white">
      {/* ── Hand column (right in RTL, flex-1) ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Hand zone header */}
        <div className="shrink-0 px-3 py-2 flex items-center justify-end border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-semibold">יד</span>
            <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{player.hand.length}</span>
          </div>
        </div>
        <div
          className="flex-1 min-h-0 relative overflow-hidden"
          style={{
            opacity: isEndingTurn ? 0 : 1,
            transition: isEndingTurn ? "opacity 150ms ease" : "none",
          }}
        >
          <div className="absolute inset-0 flex items-start gap-2 px-2 pt-1 pb-3 overflow-x-auto overflow-y-hidden">
            {player.hand.length === 0 ? (
              <div className="flex items-center justify-center w-full h-full text-stone-300 text-sm">ריק</div>
            ) : (
              player.hand.map((inst) => {
                const def = getDef(inst.defId);
                if (!def) return null;
                return (
                  <CardView
                    key={inst.instanceId}
                    instance={inst}
                    def={def}
                    location="hand"
                    playerMoney={player.money}
                    playerMilk={player.milk}
                    onAction={handleCardAction}
                    compact={true}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px shrink-0 bg-stone-200" />

      {/* ── Played column (left in RTL, fixed 1080px) ─────────────────────── */}
      <div className="flex flex-col overflow-hidden" style={{ width: "1080px", flexShrink: 0 }}>
        {/* Played zone header */}
        <div className="shrink-0 px-3 py-2 flex items-center justify-between border-b border-stone-100">
          <div className="flex gap-1.5">
            <button
              onClick={handleDraw5}
              className="bg-stone-500 hover:bg-stone-400 text-white text-xs px-2 py-1 rounded transition-colors"
            >
              שלוף 5
            </button>
            <button
              onClick={handleShuffleDiscardToDeck}
              className="bg-stone-500 hover:bg-stone-400 text-white text-xs px-2 py-1 rounded transition-colors"
            >
              ערבב זרוקים לדק
            </button>
            <button
              onClick={() => setDiscardOpen(true)}
              className="text-xs text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded transition-colors"
            >
              זרוקים ({player.discard.length}) 🗂
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-semibold">ששוחקו</span>
            <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{player.played.length}</span>
            <span className="text-xs text-stone-400">דק: <strong className="text-stone-600">{player.deck.length}</strong></span>
          </div>
        </div>

        {/* Played cards */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <div className="absolute inset-0 flex items-start gap-2 px-3 pt-2 pb-2 overflow-x-auto overflow-y-hidden">
            {player.played.length === 0 ? (
              <div className="flex items-center justify-center w-full h-full text-stone-300 text-sm">ריק</div>
            ) : (
              player.played.map((inst) => {
                const def = getDef(inst.defId);
                if (!def) return null;
                return (
                  <CardView
                    key={inst.instanceId}
                    instance={inst}
                    def={def}
                    location="played"
                    isNew={newPlayedIds.has(inst.instanceId)}
                    onAction={handleCardAction}
                    compact={true}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Discard modal ────────────────────────────────────────────────────── */}
      {discardOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setDiscardOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 shrink-0">
              <h2 className="font-bold text-stone-700">
                זרוקים של {player.name} ({player.discard.length})
              </h2>
              <button
                onClick={() => setDiscardOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xl leading-none w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {player.discard.length === 0 ? (
                <div className="text-center text-stone-400 py-10">הערימה ריקה</div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {[...player.discard].reverse().map((inst) => {
                    const def = getDef(inst.defId);
                    if (!def) return null;
                    return (
                      <CardView
                        key={inst.instanceId}
                        instance={inst}
                        def={def}
                        location="discard"
                        onAction={(action, id) => {
                          handleCardAction(action, id);
                          setDiscardOpen(false);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
