import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type MeasurementTileSource =
  | { type: "device"; deviceId: string; capabilityId: string }
  | { type: "logic"; variableId: string };
export type MeasurementTile = { id: string; name: string; source: MeasurementTileSource | null };
const defaults: MeasurementTile[] = [
  { id: "measurement-1", name: "Woonkamer", source: null },
  { id: "measurement-2", name: "Keuken", source: null },
  { id: "measurement-3", name: "Sem", source: null },
  { id: "measurement-4", name: "Bram", source: null },
];
const file = join(process.env.DATA_DIR ?? join(process.cwd(), "data"), "measurement-tiles.json");
function normalizeSource(input: unknown): MeasurementTileSource | null {
  if (input === null || input === undefined) return null;
  if (!input || typeof input !== "object") throw new Error("Ongeldige meetwaardebron.");
  const source = input as Record<string, unknown>;
  if (source.type === "device" && typeof source.deviceId === "string" && source.deviceId.length <= 128 && typeof source.capabilityId === "string" && source.capabilityId.length <= 128) return { type: "device", deviceId: source.deviceId, capabilityId: source.capabilityId };
  if (source.type === "logic" && typeof source.variableId === "string" && source.variableId.length <= 128) return { type: "logic", variableId: source.variableId };
  throw new Error("Ongeldige meetwaardebron.");
}
function normalize(input: unknown): MeasurementTile[] {
  if (!Array.isArray(input) || input.length !== 4) throw new Error("Er moeten precies vier meetwaardetegels worden opgeslagen.");
  const result = input.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error("Ongeldige meetwaardetegel.");
    const item = entry as Record<string, unknown>;
    if (item.id !== defaults[index].id) throw new Error("De vaste tegel-ID's of volgorde zijn ongeldig.");
    if (typeof item.name !== "string" || !item.name.trim() || item.name.trim().length > 32) throw new Error("Elke tegelnaam moet 1 tot 32 tekens bevatten.");
    return { id: defaults[index].id, name: item.name.trim(), source: normalizeSource(item.source) };
  });
  return result;
}
export async function readMeasurementTiles(): Promise<MeasurementTile[]> {
  try { const parsed = JSON.parse(await readFile(file, "utf8")) as unknown; return normalize(parsed); }
  catch { return defaults.map(tile => ({ ...tile })); }
}
export async function saveMeasurementTiles(input: unknown): Promise<MeasurementTile[]> {
  const tiles = normalize(input);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(tiles, null, 2) + "\n", { mode: 0o600 });
  return tiles;
}
export const defaultMeasurementTiles = defaults;
