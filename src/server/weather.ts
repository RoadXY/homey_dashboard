import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const WEATHER_CONDITIONS = [
  "sunny", "mostly_sunny", "partly_cloudy", "cloudy", "overcast", "fog",
  "drizzle", "rain", "heavy_rain", "showers", "thunderstorm", "hail",
  "snow", "snow_showers", "sleet", "windy",
] as const;
export type WeatherCategory = typeof WEATHER_CONDITIONS[number] | "unknown";

export type DashboardWeather = {
  retrievedAt: string;
  category: WeatherCategory;
  conditionText: string | null;
  source: "api";
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

export async function getDashboardWeather(): Promise<DashboardWeather> {
  const retrievedAt = new Date().toISOString();
  const stored = await getStoredWeatherCondition();
  if (!stored) {
    return {
      retrievedAt,
      category: "unknown",
      conditionText: null,
      source: "api",
      reason: "condition_not_received",
    };
  }
  return {
    retrievedAt,
    category: stored.condition,
    conditionText: stored.condition,
    source: "api",
    receivedAt: stored.receivedAt,
  };
}
