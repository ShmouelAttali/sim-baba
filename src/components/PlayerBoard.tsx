import { useState } from "react";
import type { CardDef, CardInstance, PlayerState } from "../types/game";
import { drawCards, shuffle } from "../utils/deck";
import { applyCardEffects, applyCurseCardEffect, buildEffectLogSuffix, shouldAutoApply } from "../utils/cardEffects";
import type { ToastData } from "./Toast";
import CardView from "./CardView";

interface Props {
  player: PlayerState;
  allCardDefs: CardDef[];
  onUpdatePlayer: (updated: PlayerState, logMsgs?: string[]) => void;
  isEndingTurn?: boolean;
  onToast?: (t: ToastData) => void;
  playerCount?: number;
  onCurseCardDC006?: (updatedCurrentPlayer: PlayerState, followerGain: number, logs: string[]) => void;
}

export default function PlayerBoard({
  player,
  allCardDefs,
  onUpdatePlayer,
  isEndingTurn = false,
  onToast,
  playerCount = 1,
  onCurseCardDC006,
}: Props) {
  const [discardOpen, setDiscardOpen] = useState(false);

  function getDef(defId: string): CardDef | undefined {
    return allCardDefs.find((d) => d.id === defId);
  }

  function findCard(instanceId: string): CardInstance | undefined {
    return [...player.hand, ...player.played, ...player.discard].find(
      (c) => c.instanceId === instanceId
    );
  }

  // Stable hand: combine hand + played, preserve original draw order
  const allHandCards = [...player.hand, ...player.played].sort(
    (a, b) => (a.drawOrder ?? 0) - (b.drawOrder ?? 0)
  );
  const playedIds = new Set(player.played.map((c) => c.instanceId));

  function handleCardAction(action: string, instanceId: string) {
    const def = getDef(findCard(instanceId)?.defId ?? "");
    const cardName = def?.name ?? instanceId;

    switch (action) {
      case "play": {
        const card = player.hand.find((c) => c.instanceId === instanceId);
        if (!card) return;
        const playedPlayer: PlayerState = {
          ...player,
          hand: player.hand.filter((c) => c.instanceId !== instanceId),
          played: [...player.played, card],
        };

        // Curse card — special handling per card ID
        if (def?.source === "curse_deck") {
          const otherCount = Math.max(0, playerCount - 1);
          const result = applyCurseCardEffect(playedPlayer, def, otherCount);
          const suffix = buildEffectLogSuffix(result.effects);
          const logs = [
            ...result.extraLogs,
            `${player.name} שיחק קלף דינים: ${cardName}${suffix}`,
          ];
          if (result.otherPlayersFollowerGain !== undefined && onCurseCardDC006) {
            onCurseCardDC006(result.updatedPlayer, result.otherPlayersFollowerGain, logs);
          } else {
            onUpdatePlayer(result.updatedPlayer, logs);
          }
          if (result.effects.length > 0) {
            onToast?.({ cardName, effects: result.effects, needsManual: result.extraLogs.some(l => l.includes("ידנית")) });
          }
          break;
        }

        if (def && shouldAutoApply(def)) {
          const { updatedPlayer, effects, extraLogs } = applyCardEffects(playedPlayer, def, allCardDefs);
          const needsManual = def.effectDisplay === "icons_text";
          const suffix = buildEffectLogSuffix(effects);
          const manualNote = needsManual ? " (+ אפקט ידני)" : "";
          onUpdatePlayer(updatedPlayer, [
            ...extraLogs,
            `${player.name} שיחק: ${cardName}${suffix}${manualNote}`,
          ]);
          if (effects.length > 0) {
            onToast?.({ cardName, effects, needsManual });
          }
        } else {
          const manualNote =
            def?.type === "trouble" || def?.effectDisplay === "text"
              ? " — יש להחיל אפקט ידנית"
              : "";
          onUpdatePlayer(playedPlayer, [`${player.name} שיחק: ${cardName}${manualNote}`]);
        }
        break;
      }
      case "yard": {
        const card = player.hand.find((c) => c.instanceId === instanceId);
        if (!card) return;
        let yardedPlayer: PlayerState = {
          ...player,
          hand: player.hand.filter((c) => c.instanceId !== instanceId),
          yard: [...player.yard, card],
        };
        if (def?.yardInfra) {
          yardedPlayer = { ...yardedPlayer, infrastructure: yardedPlayer.infrastructure + def.yardInfra };
          onUpdatePlayer(yardedPlayer, [`${player.name} העמיד בחצר: ${cardName}: 🏛️+${def.yardInfra}`]);
          onToast?.({
            cardName,
            subtitle: "הועמד בחצר",
            effects: [{ icon: "🏛️", label: "תשתית", delta: def.yardInfra }],
            needsManual: false,
          });
        } else {
          onUpdatePlayer(yardedPlayer, [`${player.name} העמיד בחצר: ${cardName}`]);
        }
        break;
      }
      case "discard": {
        const card = player.hand.find((c) => c.instanceId === instanceId);
        if (!card) return;
        onUpdatePlayer({
          ...player,
          hand: player.hand.filter((c) => c.instanceId !== instanceId),
          discard: [...player.discard, card],
        });
        break;
      }
      case "returnToHand": {
        const card = player.played.find((c) => c.instanceId === instanceId);
        if (!card) return;
        onUpdatePlayer(
          { ...player, played: player.played.filter((c) => c.instanceId !== instanceId), hand: [...player.hand, card] },
          [`${player.name} החזיר לידו: ${cardName}`]
        );
        break;
      }
      case "discardFromPlayed": {
        const card = player.played.find((c) => c.instanceId === instanceId);
        if (!card) return;
        onUpdatePlayer({
          ...player,
          played: player.played.filter((c) => c.instanceId !== instanceId),
          discard: [...player.discard, card],
        });
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
    }
  }

  function handleDrawOne() {
    const { player: updated, log: reshuffleMsgs } = drawCards(player, 1, []);
    onUpdatePlayer(updated, [...reshuffleMsgs, `${player.name} שלף קלף.`]);
  }

  function handleShuffleDiscardToDeck() {
    const newDeck = shuffle([...player.deck, ...player.discard]);
    onUpdatePlayer({ ...player, deck: newDeck, discard: [] }, [`${player.name} ערבב זרוקים לדק.`]);
  }

  return (
    <div
      className="bg-white border-b border-stone-200"
      style={{ opacity: isEndingTurn ? 0 : 1, transition: isEndingTurn ? "opacity 150ms ease" : "none" }}
    >
      {/* Header */}
      <div className="px-3 py-1 flex items-center justify-between border-b border-stone-100 bg-amber-50/60" style={{ minHeight: "32px" }}>
        <div className="flex gap-1.5">
          <button
            onClick={handleDrawOne}
            className="bg-stone-500 hover:bg-stone-400 text-white text-xs px-2 py-1 rounded transition-colors"
          >
            שלוף קלף
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
          <span className="text-xs text-stone-500 font-semibold">יד</span>
          <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{player.hand.length}</span>
          {player.played.length > 0 && (
            <>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-stone-500 font-semibold">שוחקו</span>
              <span className="text-xs text-stone-400 bg-green-100 px-1.5 py-0.5 rounded-full">{player.played.length}</span>
            </>
          )}
          <span className="text-xs text-stone-400">
            דק: <strong className="text-stone-600">{player.deck.length}</strong>
          </span>
        </div>
      </div>

      {/* Card area — horizontal scroll, natural height */}
      <div
        className="flex items-start gap-2 px-2 pt-2 pb-1 overflow-x-auto"
        style={{ minHeight: "230px" }}
      >
        {allHandCards.length === 0 ? (
          <div className="flex items-center justify-center w-full text-stone-300 text-sm" style={{ minHeight: "200px" }}>
            ריק
          </div>
        ) : (
          allHandCards.map((inst) => {
            const def = getDef(inst.defId);
            if (!def) return null;
            const isPlayed = playedIds.has(inst.instanceId);
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
                isPlayed={isPlayed}
                invertEffects={player.invertEffectsThisTurn}
              />
            );
          })
        )}
      </div>

      {/* Discard modal */}
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
