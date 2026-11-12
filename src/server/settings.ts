import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type DashboardSettings = {
  language: string;
  dateFormat: string;
  timeFormat: "24h" | "12h";
  firstDayOfWeek: "monday" | "sunday";
};

export const defaultSettings: DashboardSettings = {
  language: "automatic",
  dateFormat: "short",
  timeFormat: "24h",
  firstDayOfWeek: "monday",
};

const settingsFile = join(process.env.DATA_DIR ?? join(process.cwd(), "data"), "settings.json");

export async function readDashboardSettings(): Promise<DashboardSettings> {
  try {
    const parsed = JSON.parse(await readFile(settingsFile, "utf8")) as Partial<DashboardSettings>;
    return {
      language: typeof parsed.language === "string" ? parsed.language : defaultSettings.language,
      dateFormat: typeof parsed.dateFormat === "string" ? parsed.dateFormat : defaultSettings.dateFormat,
      timeFormat: parsed.timeFormat === "12h" ? "12h" : "24h",
      firstDayOfWeek: parsed.firstDayOfWeek === "sunday" ? "sunday" : "monday",
    };
  } catch {
    return { ...defaultSettings };
  }
}

export async function saveDashboardSettings(input: unknown): Promise<DashboardSettings> {
  if (!input || typeof input !== "object") throw new Error("Ongeldige instellingen.");
  const value = input as Partial<DashboardSettings>;
  if (typeof value.language !== "string" || !["automatic", "nl-NL", "en"].includes(value.language)) {
    throw new Error("Ongeldige dashboardtaal.");
  }
  if (typeof value.dateFormat !== "string" || !["short", "iso", "long"].includes(value.dateFormat)) {
    throw new Error("Ongeldige datumnotatie.");
  }
  if (value.timeFormat !== "12h" && value.timeFormat !== "24h") throw new Error("Ongeldige tijdnotatie.");
  if (value.firstDayOfWeek !== "monday" && value.firstDayOfWeek !== "sunday") throw new Error("Ongeldige eerste weekdag.");
  const settings: DashboardSettings = {
    language: value.language,
    dateFormat: value.dateFormat,
    timeFormat: value.timeFormat,
    firstDayOfWeek: value.firstDayOfWeek,
  };
  await mkdir(dirname(settingsFile), { recursive: true });
  await writeFile(settingsFile, JSON.stringify(settings, null, 2) + "\n", { mode: 0o600 });
  return settings;
}
