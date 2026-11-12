import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type QuickActionType = "flow" | "device";
export type QuickAction = {
  id: string;
  name: string;
  icon: string;
  type: QuickActionType;
  flowId: string;
  flowType: "standard" | "advanced";
  deviceId: string;
  capabilityId: string;
  value: boolean | number | string | null;
};

const defaults: QuickAction[] = [
  { id: "qmusic", name: "", icon: "♫", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "foute-uur", name: "", icon: "♫", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "blinds", name: "", icon: "⌃", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "birthday", name: "", icon: "✦", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "living-lights", name: "", icon: "◌", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "mood-lights", name: "", icon: "✧", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "tv", name: "", icon: "▣", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
  { id: "bedtime", name: "", icon: "☾", type: "flow", flowId: "", flowType: "standard", deviceId: "", capabilityId: "", value: null },
];

const settingsFile = join(process.env.DATA_DIR ?? join(process.cwd(), "data"), "dashboard-actions.json");
const validIds = new Set(defaults.map((item) => item.id));
const icons = new Set(["♫", "⌃", "✦", "◌", "✧", "▣", "☾", "♧", "⌂", "▤", "⚡", "💡", "🏠", "🚗", "🎬", "🍴", "🛡", "⏻", "•••"]);

function normalizeAction(input: unknown, index: number): QuickAction {
  if (!input || typeof input !== "object") throw new Error("Ongeldige quick action.");
  const item = input as Partial<QuickAction>;
  if (typeof item.id !== "string" || !validIds.has(item.id)) throw new Error("Onbekende quick action.");
  if (typeof item.name !== "string" || item.name.length > 40) throw new Error("Naam moet maximaal 40 tekens bevatten.");
  if (typeof item.icon !== "string" || !icons.has(item.icon)) throw new Error("Ongeldig pictogram.");
  if (item.type !== "flow" && item.type !== "device") throw new Error("Ongeldig actietype.");
  if (item.flowType !== "standard" && item.flowType !== "advanced") throw new Error("Ongeldig Flow-type.");
  for (const key of ["flowId", "deviceId", "capabilityId"] as const) {
    if (typeof item[key] !== "string" || item[key]!.length > 128) throw new Error("Ongeldige Homey-selectie.");
  }
  if (item.value !== null && typeof item.value !== "boolean" && typeof item.value !== "number" && typeof item.value !== "string") {
    throw new Error("Ongeldige actiewaarde.");
  }
  return {
    id: item.id, name: item.name.trim(), icon: item.icon, type: item.type,
    flowId: item.flowId ?? "", flowType: item.flowType,
    deviceId: item.deviceId ?? "", capabilityId: item.capabilityId ?? "", value: item.value ?? null,
  };
}

export async function readQuickActions(): Promise<QuickAction[]> {
  try {
    const parsed = JSON.parse(await readFile(settingsFile, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return defaults.map((item) => ({ ...item }));
    const byId = new Map<string, QuickAction>();
    for (const item of parsed) {
      try { const normalized = normalizeAction(item, byId.size); byId.set(normalized.id, normalized); } catch { /* Ignore invalid persisted entries and retain defaults. */ }
    }
    return defaults.map((item) => byId.get(item.id) ?? { ...item });
  } catch {
    return defaults.map((item) => ({ ...item }));
  }
}

export async function saveQuickActions(input: unknown): Promise<QuickAction[]> {
  if (!Array.isArray(input) || input.length !== defaults.length) throw new Error("Er moeten precies acht Quick Actions worden opgeslagen.");
  const actions = input.map(normalizeAction);
  if (new Set(actions.map((item) => item.id)).size !== defaults.length || defaults.some((item) => !actions.some((action) => action.id === item.id))) {
    throw new Error("De acht Quick Actions moeten elk precies één keer voorkomen.");
  }
  await mkdir(dirname(settingsFile), { recursive: true });
  await writeFile(settingsFile, JSON.stringify(actions, null, 2) + "\n", { mode: 0o600 });
  return actions;
}
