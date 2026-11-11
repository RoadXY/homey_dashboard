import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getHomeyDeviceCapabilityValues } from "./homey.js";

export type WeatherCategory =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "rain"
  | "thunderstorm"
  | "snow"
  | "fog"
  | "wind"
  | "unknown";

type WeatherMappingConfig = {
  schemaVersion: number;
  id: string;
  enabled: boolean;
  source: {
    deviceId: string;
    conditionCapabilities: string[];
  };
  mappings: Array<{
    capabilityId: string;
    match: {
      type: "equals";
      values: Array<string | number>;
    };
    category: Exclude<WeatherCategory, "unknown">;
  }>;
  defaultCategory: "unknown";
};

export type DashboardWeather = {
  retrievedAt: string;
  category: WeatherCategory;
  conditionText: string | null;
  sourceCapability: string | null;
  reason?: string;
};

async function loadWeatherConfig(): Promise<WeatherMappingConfig> {
  const configPath = join(process.cwd(), "config", "weather", "weather-mapping.json");
  const config = JSON.parse(await readFile(configPath, "utf8")) as WeatherMappingConfig;
  const validCategories = new Set([
    "clear", "partly_cloudy", "cloudy", "rain", "thunderstorm", "snow", "fog", "wind",
  ]);
  const valid =
    config.schemaVersion === 1 &&
    typeof config.id === "string" &&
    typeof config.enabled === "boolean" &&
    typeof config.source?.deviceId === "string" &&
    Array.isArray(config.source.conditionCapabilities) &&
    config.source.conditionCapabilities.length > 0 &&
    Array.isArray(config.mappings) &&
    config.mappings.every((mapping) =>
      typeof mapping.capabilityId === "string" &&
      mapping.match?.type === "equals" &&
      Array.isArray(mapping.match.values) &&
      mapping.match.values.length > 0 &&
      validCategories.has(mapping.category)
    ) &&
    config.defaultCategory === "unknown";
  if (!valid) throw new Error("Invalid weather mapping configuration.");
  return config;
}

function valuesMatch(actual: unknown, expected: Array<string | number>): boolean {
  if (typeof actual === "string") {
    const normalizedActual = actual.trim().toLocaleLowerCase("en-US");
    return expected.some((value) =>
      typeof value === "string" && value.trim().toLocaleLowerCase("en-US") === normalizedActual
    );
  }
  if (typeof actual === "number" && Number.isFinite(actual)) {
    return expected.some((value) => typeof value === "number" && value === actual);
  }
  return false;
}

export async function getDashboardWeather(): Promise<DashboardWeather> {
  const config = await loadWeatherConfig();
  if (!config.enabled) {
    return {
      retrievedAt: new Date().toISOString(),
      category: "unknown",
      conditionText: null,
      sourceCapability: null,
      reason: "mapping_disabled",
    };
  }

  const sources = config.source.conditionCapabilities.map((capabilityId) => ({
    deviceId: config.source.deviceId,
    capabilityId,
  }));

  let readings: Awaited<ReturnType<typeof getHomeyDeviceCapabilityValues>>["readings"];
  try {
    readings = (await getHomeyDeviceCapabilityValues(sources)).readings;
  } catch {
    return {
      retrievedAt: new Date().toISOString(),
      category: "unknown",
      conditionText: null,
      sourceCapability: null,
      reason: "source_unavailable",
    };
  }

  for (const capabilityId of config.source.conditionCapabilities) {
    const reading = readings.find((item) => item.capabilityId === capabilityId);
    if (!reading || reading.available === false || reading.error || reading.value === null || reading.value === undefined) continue;

    const mapping = config.mappings.find((item) =>
      item.capabilityId === capabilityId && valuesMatch(reading.value, item.match.values)
    );
    if (mapping) {
      return {
        retrievedAt: new Date().toISOString(),
        category: mapping.category,
        conditionText: typeof reading.value === "string" ? reading.value : String(reading.value),
        sourceCapability: capabilityId,
      };
    }
  }

  const firstValue = config.source.conditionCapabilities
    .map((capabilityId) => readings.find((item) => item.capabilityId === capabilityId))
    .find((reading) => reading && reading.available !== false && !reading.error && reading.value !== null && reading.value !== undefined);

  return {
    retrievedAt: new Date().toISOString(),
    category: config.defaultCategory,
    conditionText: typeof firstValue?.value === "string" ? firstValue.value : null,
    sourceCapability: firstValue?.capabilityId ?? null,
    reason: firstValue ? "unmapped_condition" : "condition_unavailable",
  };
}
