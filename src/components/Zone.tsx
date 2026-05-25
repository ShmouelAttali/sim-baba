import { useState } from "react";
import type { CardDef, CardInstance } from "../types/game";
import CardView from "./CardView";

interface Props {
  title: string;
  cards: CardInstance[];
  allCardDefs: CardDef[];
  location: "hand" | "played" | "yard" | "discard" | "mofets";
  playerMoney?: number;
  playerMilk?: number;
  onAction?: (action: string, instanceId: string) => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
  countOnly?: boolean;
  className?: string;
}

export default function Zone({
  title,
  cards,
  allCardDefs,
  location,
  playerMoney,
  playerMilk,
  onAction,
  collapsible = false,
  defaultOpen = true,
  countOnly = false,
  className = "",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  function getDef(defId: string): CardDef | undefined {
    return allCardDefs.find((d) => d.id === defId);
  }

  return (
    <div className={`rounded-xl border border-stone-200 bg-stone-50 ${className}`}>
      <button
        onClick={() => collapsible && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 ${collapsible ? "cursor-pointer hover:bg-stone-100" : "cursor-default"} rounded-t-xl`}
      >
        <span className="font-medium text-stone-700 text-sm">{title}</span>
        <span className="text-stone-500 text-xs bg-stone-200 px-2 py-0.5 rounded-full">{cards.length}</span>
      </button>

      {(!collapsible || open) && !countOnly && (
        <div className="px-3 pb-3">
          {cards.length === 0 ? (
            <p className="text-stone-400 text-xs text-center py-2">ריק</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cards.map((inst) => {
                const def = getDef(inst.defId);
                if (!def) return null;
                return (
                  <CardView
                    key={inst.instanceId}
                    instance={inst}
                    def={def}
                    location={location}
                    playerMoney={playerMoney}
                    playerMilk={playerMilk}
                    onAction={onAction}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
