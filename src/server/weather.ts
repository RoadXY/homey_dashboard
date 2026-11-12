import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getHomeyDeviceCapabilityValues } from "./homey.js";

export const WEATHER_CONDITIONS = [
  "sunny", "mostly_sunny", "partly_cloudy", "cloudy", "overcast", "fog",
  "drizzle", "rain", "heavy_rain", "showers", "thunderstorm", "hail",
  "snow", "snow_showers", "sleet", "windy",
] as const;
export type WeatherCategory = typeof WEATHER_CONDITIONS[number] | "unknown";

type WeatherMappingConfig = {
  schemaVersion: number; id: string; enabled: boolean;
  source: { deviceId: string; conditionCapabilities: string[] };
  mappings: Array<{ capabilityId: string; match: { type: "equals"; values: Array<string | number> }; category: WeatherCategory }>;
  defaultCategory: "unknown";
};

export type DashboardWeather = {
  retrievedAt: string;
  category: WeatherCategory;
  conditionText: string | null;
  sourceCapability: string | null;
  source: "homey" | "api";
  receivedAt?: string;
  reason?: string;
};

type StoredWeatherCondition = { condition: WeatherCategory; receivedAt: string };
const conditionFile = join(process.env.DATA_DIR ?? join(process.cwd(), "data"), "weather", "condition.json");

export async function setWeatherCondition(condition: WeatherCategory): Promise<StoredWeatherCondition> {
  if (!(WEATHER_CONDITIONS as readonly string[]).includes(condition)) throw new Error("Unsupported weather condition.");
  const value: StoredWeatherCondition = { condition, receivedAt: new Date().toISOString() };
  await mkdir(dirname(conditionFile), { recursive: true });
  await writeFile(conditionFile, JSON.stringify(value, null, 2) + "\\n", { mode: 0o600 });
  return value;
}

async function getStoredWeatherCondition(): Promise<StoredWeatherCondition | null> {
  try {
    const value = JSON.parse(await readFile(conditionFile, "utf8")) as StoredWeatherCondition;
    if (!(WEATHER_CONDITIONS as readonly string[]).includes(value.condition) || typeof value.receivedAt !== "string") return null;
    return value;
  } catch { return null; }
}

async function loadWeatherConfig(): Promise<WeatherMappingConfig> {
  const configPath = join(process.cwd(), "config", "weather", "weather-mapping.json");
  const config = JSON.parse(await readFile(configPath, "utf8")) as WeatherMappingConfig;
  const validCategories = new Set<string>(WEATHER_CONDITIONS);
  const valid = config.schemaVersion === 1 && typeof config.id === "string" && typeof config.enabled === "boolean" &&
    typeof config.source?.deviceId === "string" && Array.isArray(config.source.conditionCapabilities) && config.source.conditionCapabilities.length > 0 &&
    Array.isArray(config.mappings) && config.mappings.every((mapping) => typeof mapping.capabilityId === "string" &&
      mapping.match?.type === "equals" && Array.isArray(mapping.match.values) && mapping.match.values.length > 0 && validCategories.has(mapping.category)) &&
    config.defaultCategory === "unknown";
  if (!valid) throw new Error("Invalid weather mapping configuration.");
  return config;
}

function valuesMatch(actual: unknown, expected: Array<string | number>): boolean {
  if (typeof actual === "string") {
    const normalizedActual = actual.trim().toLocaleLowerCase("en-US");
    return expected.some((value) => typeof value === "string" && value.trim().toLocaleLowerCase("en-US") === normalizedActual);
  }
  if (typeof actual === "number" && Number.isFinite(actual)) return expected.some((value) => typeof value === "number" && value === actual);
  return false;
}

export async function getDashboardWeather(): Promise<DashboardWeather> {
  const stored = await getStoredWeatherCondition();
  if (stored) return {
    retrievedAt: new Date().toISOString(), category: stored.condition, conditionText: stored.condition,
    sourceCapability: null, source: "api", receivedAt: stored.receivedAt,
  };

  const config = await loadWeatherConfig();
  if (!config.enabled) return { retrievedAt: new Date().toISOString(), category: "unknown", conditionText: null, sourceCapability: null, source: "homey", reason: "mapping_disabled" };
  const sources = config.source.conditionCapabilities.map((capabilityId) => ({ deviceId: config.source.deviceId, capabilityId }));
  let readings: Awaited<ReturnType<typeof getHomeyDeviceCapabilityValues>>["readings"];
  try { readings = (await getHomeyDeviceCapabilityValues(sources)).readings; }
  catch { return { retrievedAt: new Date().toISOString(), category: "unknown", conditionText: null, sourceCapability: null, source: "homey", reason: "source_unavailable" }; }

  const legacyMap: Record<string, WeatherCategory> = { clear: "sunny", wind: "windy", snow: "snow", fog: "fog", rain: "rain", thunderstorm: "thunderstorm", partly_cloudy: "partly_cloudy", cloudy: "cloudy" };
  for (const capabilityId of config.source.conditionCapabilities) {
    const reading = readings.find((item) => item.capabilityId === capabilityId);
    if (!reading || reading.available === false || reading.error || reading.value === null || reading.value === undefined) continue;
    const mapping = config.mappings.find((item) => item.capabilityId === capabilityId && valuesMatch(reading.value, item.match.values));
    if (mapping) return { retrievedAt: new Date().toISOString(), category: legacyMap[mapping.category] ?? mapping.category,
      conditionText: typeof reading.value === "string" ? reading.value : String(reading.value), sourceCapability: capabilityId, source: "homey" };
  }
  const firstValue = config.source.conditionCapabilities.map((capabilityId) => readings.find((item) => item.capabilityId === capabilityId))
    .find((reading) => reading && reading.available !== false && !reading.error && reading.value !== null && reading.value !== undefined);
  return { retrievedAt: new Date().toISOString(), category: "unknown", conditionText: typeof firstValue?.value === "string" ? firstValue.value : null,
    sourceCapability: firstValue?.capabilityId ?? null, source: "homey", reason: firstValue ? "unmapped_condition" : "condition_unavailable" };
}
