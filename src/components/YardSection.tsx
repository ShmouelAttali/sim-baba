import type { CardDef, FactionDef, PlayerState } from "../types/game";
import CardView from "./CardView";

const FACTION_ACCENT: Record<string, { border: string; text: string; bg: string }> = {
  baba:    { border: "#fde68a", text: "#92400e", bg: "#fefce8" },
  breslov: { border: "#ddd6fe", text: "#5b21b6", bg: "#faf5ff" },
  chabad:  { border: "#fed7aa", text: "#9a3412", bg: "#fff7ed" },
  litvaks: { border: "#cbd5e1", text: "#334155", bg: "#f8fafc" },
};

interface Props {
  player: PlayerState;
  allCardDefs: CardDef[];
  factions: FactionDef[];
  onReturnFromYard: (instanceId: string) => void;
}

export default function YardSection({ player, allCardDefs, factions, onReturnFromYard }: Props) {
  const accent = FACTION_ACCENT[player.factionId] ?? { border: "#e5e7eb", text: "#374151", bg: "#f9fafb" };
  const factionName = factions.find((f) => f.id === player.factionId)?.name ?? "";

  function getDef(defId: string): CardDef | undefined {
    return allCardDefs.find((d) => d.id === defId);
  }

  function handleAction(action: string, instanceId: string) {
    if (action === "returnFromYard") onReturnFromYard(instanceId);
  }

  return (
    <div className="border-b border-stone-200">
      {/* Header */}
      <div
        className="px-3 py-1 flex items-center justify-between border-b"
        style={{ backgroundColor: accent.bg, borderColor: accent.border, minHeight: "32px" }}
      >
        <span className="text-xs text-stone-500">{factionName}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold" style={{ color: accent.text }}>החצר</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: accent.border, color: accent.text }}
          >
            {player.yard.length}
          </span>
        </div>
      </div>

      {/* Card row */}
      {player.yard.length === 0 ? (
        <div className="p-3">
          <div
            className="flex items-center justify-center rounded-xl text-stone-300 text-sm"
            style={{ minHeight: "220px", border: "2px dashed #e5e7eb" }}
          >
            ריק
          </div>
        </div>
      ) : (
        <div
          className="flex items-start gap-2 px-2 pt-2 pb-1 overflow-x-auto"
          style={{ minHeight: "230px" }}
        >
          {player.yard.map((inst) => {
            const def = getDef(inst.defId);
            if (!def) return null;
            return (
              <CardView
                key={inst.instanceId}
                instance={inst}
                def={def}
                location="yard"
                onAction={handleAction}
                compact={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
