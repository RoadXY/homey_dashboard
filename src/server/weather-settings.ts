import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type WeatherSource =
  | { type: "device"; deviceId: string; capabilityId: string }
  | { type: "logic"; variableId: string }
  | null;

export type WeatherSettingId =
  | "outdoorTemperature" | "feelsLike" | "humidity" | "pressure"
  | "windSpeed" | "windDirection" | "precipitation" | "sunrise" | "sunset";

export type WeatherSettings = {
  sources: Record<WeatherSettingId, WeatherSource>;
  iconPack: "animated" | "color3d" | "outline" | "flat";
};

export const WEATHER_SETTING_IDS: WeatherSettingId[] = [
  "outdoorTemperature", "feelsLike", "humidity", "pressure",
  "windSpeed", "windDirection", "precipitation", "sunrise", "sunset",
];

const emptySources = Object.fromEntries(WEATHER_SETTING_IDS.map(id => [id, null])) as WeatherSettings["sources"];
const defaults: WeatherSettings = { sources: emptySources, iconPack: "animated" };
const file = join(process.env.DATA_DIR ?? join(process.cwd(), "data"), "weather-settings.json");

function normalizeSource(value: unknown): WeatherSource {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (source.type === "device" && typeof source.deviceId === "string" && source.deviceId.length > 0 && source.deviceId.length <= 128
    && typeof source.capabilityId === "string" && source.capabilityId.length > 0 && source.capabilityId.length <= 128) {
    return { type: "device", deviceId: source.deviceId, capabilityId: source.capabilityId };
  }
  if (source.type === "logic" && typeof source.variableId === "string" && source.variableId.length > 0 && source.variableId.length <= 128) {
    return { type: "logic", variableId: source.variableId };
  }
  return null;
}

export function normalizeWeatherSettings(value: unknown): WeatherSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const input = value as Record<string, unknown>;
  const incomingSources = input.sources && typeof input.sources === "object" && !Array.isArray(input.sources)
    ? input.sources as Record<string, unknown> : {};
  const sources = Object.fromEntries(WEATHER_SETTING_IDS.map(id => [id, normalizeSource(incomingSources[id])])) as WeatherSettings["sources"];
  const allowedPacks: WeatherSettings["iconPack"][] = ["animated", "color3d", "outline", "flat"];
  const iconPack = allowedPacks.includes(input.iconPack as WeatherSettings["iconPack"])
    ? input.iconPack as WeatherSettings["iconPack"] : "animated";
  return { sources, iconPack };
}

export async function readWeatherSettings(): Promise<WeatherSettings> {
  try { return normalizeWeatherSettings(JSON.parse(await readFile(file, "utf8"))); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return defaults;
  }
}

export async function saveWeatherSettings(input: unknown): Promise<WeatherSettings> {
  const settings = normalizeWeatherSettings(input);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(settings, null, 2) + "\n", "utf8");
  return settings;
}
