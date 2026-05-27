import { parseCSV } from "./parseCSV";
import type { CardDef, FactionDef, FactionId } from "../types/game";
import { SHEETS_CONFIG } from "../config/sheets";

async function fetchCSV(url: string): Promise<string[][]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`שגיאת רשת: HTTP ${res.status} — ${url}`);
  }
  const text = await res.text();
  const rows = parseCSV(text);
  return rows.slice(1); // remove header row
}

export async function loadCards(): Promise<CardDef[]> {
  const rows = await fetchCSV(SHEETS_CONFIG.urls.cards);

  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const source = mapSource(row[5]?.trim());
      if (source === "helper") return null;

      return {
        id: row[0].trim(),
        name: row[1]?.trim() ?? "",
        type: mapCardType(row[2]?.trim()),
        faction: mapFaction(row[4]?.trim()),
        source,
        copies: parseInt(row[6]) || 1,
        costMoney: row[7]?.trim() ? parseInt(row[7]) : undefined,
        costMilk: row[8]?.trim() ? parseInt(row[8]) : undefined,
        requirements: row[9]?.trim() || undefined,
        milkText: row[10]?.trim() || undefined,
        yardText: row[11]?.trim() || undefined,
        effectText: row[12]?.trim() || undefined,
        addsDanger: row[13]?.trim() ? parseInt(row[13]) : undefined,
        tags: row[14]?.trim() ? row[14].split(',').map(t => t.trim()).filter(Boolean) : undefined,
        gainMoney:     row[17]?.trim() ? parseInt(row[17]) : undefined,
        gainFollowers: row[18]?.trim() ? parseInt(row[18]) : undefined,
        gainMilk:      row[19]?.trim() ? parseInt(row[19]) : undefined,
        gainDanger:    row[20]?.trim() ? parseInt(row[20]) : undefined,
        gainDraw:      row[21]?.trim() ? parseInt(row[21]) : undefined,
        costMilkPlay:  row[22]?.trim() ? parseInt(row[22]) : undefined,
        yardInfra:     row[23]?.trim() ? parseInt(row[23]) : undefined,
        effectDisplay: (row[24]?.trim() as CardDef["effectDisplay"]) || undefined,
      } as CardDef;
    })
    .filter((c): c is CardDef => c !== null);
}

export async function loadFactions(): Promise<FactionDef[]> {
  const rows = await fetchCSV(SHEETS_CONFIG.urls.factions);

  const abilityNames: Record<string, string> = {
    baba: "בעל ישועות",
    breslov: "אין ייאוש",
    chabad: "שליחות",
    litvaks: "אין סומכין על הנס",
  };

  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const id = mapFaction(row[0]?.trim()) as FactionId;
      return {
        id,
        name: row[0].trim(),
        startingFollowers: parseInt(row[1]) || 0,
        startingInfrastructure: parseInt(row[2]) || 0,
        dangerName: row[3]?.trim() || "סכנה",
        abilityName: abilityNames[id] ?? "",
        abilityText: row[4]?.trim() || "",
        outburstText: row[5]?.trim() || "",
      } as FactionDef;
    });
}

function mapCardType(val: string): CardDef["type"] {
  const map: Record<string, CardDef["type"]> = {
    "בסיס": "action",
    "פעולה": "action",
    "איש": "person",
    "מוסד": "institution",
    "צרה": "trouble",
    "מופת": "mofet",
    "עזר": "helper",
  };
  return map[val] ?? "action";
}

function mapFaction(val: string): CardDef["faction"] {
  // Normalize Hebrew gershayim (U+05F4) and right double quotation mark (U+201D)
  // to ASCII double quote so spreadsheet variants of 'חב"ד' all resolve correctly.
  const normalized = val.replace(/[״“”]/g, '"');
  const map: Record<string, CardDef["faction"]> = {
    "באבא": "baba",
    'חב"ד': "chabad",
    "ברסלב": "breslov",
    "ליטאים": "litvaks",
    "כללי": "general",
  };
  return map[normalized] ?? "general";
}

function mapSource(val: string): CardDef["source"] {
  const map: Record<string, CardDef["source"]> = {
    "דק פתיחה": "starting_deck",
    "שוק כללי": "general_market",
    "מאגר חצר פרטי": "faction_market",
    "שוק מופתים": "mofet_market",
    "חפיסת דינים": "curse_deck",
    "קלף עזר": "helper",
  };
  return map[val] ?? "helper";
}
