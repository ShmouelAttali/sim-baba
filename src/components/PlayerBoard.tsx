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

        if (def?.source === "curse_deck") {
          const otherCount = Math.max(0, playerCount - 1);
          const result = applyCurseCardEffect(playedPlayer, def, otherCount);
          const suffix = buildEffectLogSuffix(result.effects);
          const logs = [...result.extraLogs, `${player.name} שיחק קלף דינים: ${cardName}${suffix}`];
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
          onUpdatePlayer(updatedPlayer, [...extraLogs, `${player.name} שיחק: ${cardName}${suffix}${manualNote}`]);
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
          onToast?.({ cardName, subtitle: "הועמד בחצר", effects: [{ icon: "🏛️", label: "תשתית", delta: def.yardInfra }], needsManual: false });
        } else {
          onUpdatePlayer(yardedPlayer, [`${player.name} העמיד בחצר: ${cardName}`]);
        }
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
          [`${player.name} החזיר לידו: ${cardName}`]
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
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        opacity: isEndingTurn ? 0 : 1,
        transition: isEndingTurn ? "opacity 150ms ease" : "none",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f3f4f6",
          background: "#fffbeb",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button
            onClick={handleDrawOne}
            style={{ background: "#6b7280", color: "white", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}
          >
            שלוף קלף
          </button>
          <button
            onClick={handleShuffleDiscardToDeck}
            style={{ background: "#6b7280", color: "white", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}
          >
            ערבב זרוקים לדק
          </button>
          <button
            onClick={() => setDiscardOpen(true)}
            style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}
          >
            זרוקים ({player.discard.length}) 🗂
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280" }}>
          <span>יד ({player.hand.length})</span>
          {player.played.length > 0 && <span>| שוחקו ({player.played.length})</span>}
          <span style={{ color: "#9ca3af" }}>דק: <strong style={{ color: "#374151" }}>{player.deck.length}</strong></span>
        </div>
      </div>

      {/* Large card row — horizontal scroll, 5.5 cards visible */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 16px",
          overflowX: "auto",
          overflowY: "hidden",
        }}
        className="hand-zone"
      >
        {allHandCards.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: "14px" }}>
            ריק
          </div>
        ) : (
          allHandCards.map((inst) => {
            const def = getDef(inst.defId);
            if (!def) return null;
            const isPlayed = playedIds.has(inst.instanceId);
            return (
              <div key={inst.instanceId} className="hand-card-slot">
                <CardView
                  instance={inst}
                  def={def}
                  location="hand"
                  playerMoney={player.money}
                  playerMilk={player.milk}
                  onAction={handleCardAction}
                  cardSize="large"
                  isPlayed={isPlayed}
                  invertEffects={player.invertEffectsThisTurn}
                  fillWidth={true}
                />
              </div>
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
              <h2 className="font-bold text-stone-700">זרוקים של {player.name} ({player.discard.length})</h2>
              <button onClick={() => setDiscardOpen(false)} className="text-stone-400 hover:text-stone-600 text-xl leading-none w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">✕</button>
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
                        onAction={(action, id) => { handleCardAction(action, id); setDiscardOpen(false); }}
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
