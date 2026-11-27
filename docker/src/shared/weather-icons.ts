export const WEATHER_ICON_CATEGORIES = [
  "sunny", "mostly_sunny", "partly_cloudy", "cloudy", "overcast", "fog",
  "drizzle", "rain", "heavy_rain", "showers", "thunderstorm", "hail",
  "snow", "snow_showers", "sleet", "windy", "unknown",
] as const;

export type WeatherIconCategory = typeof WEATHER_ICON_CATEGORIES[number];

export const WEATHER_ICON_PACKS = [
  { id: "animated", labelKey: "weatherSettings.packAnimated", descriptionKey: "weatherSettings.packAnimatedDescription" },
  { id: "color3d", labelKey: "weatherSettings.packColor3d", descriptionKey: "weatherSettings.packColor3dDescription" },
  { id: "outline", labelKey: "weatherSettings.packOutline", descriptionKey: "weatherSettings.packOutlineDescription" },
  { id: "flat", labelKey: "weatherSettings.packFlat", descriptionKey: "weatherSettings.packFlatDescription" },
] as const;

export type WeatherIconPackId = typeof WEATHER_ICON_PACKS[number]["id"];

export const DEFAULT_WEATHER_ICON_PACK: WeatherIconPackId = "animated";
export const DEFAULT_WEATHER_ICON_ANIMATION = true;

export function normalizeWeatherIconPack(value: unknown): WeatherIconPackId {
  return WEATHER_ICON_PACKS.some((pack) => pack.id === value)
    ? value as WeatherIconPackId
    : DEFAULT_WEATHER_ICON_PACK;
}

export function weatherIconClassName(
  category: WeatherIconCategory,
  packValue: unknown,
  animate: boolean,
): string {
  const pack = normalizeWeatherIconPack(packValue);
  return `weather-symbol weather-${category} weather-pack-${pack}${animate ? " is-animated" : " is-static"}`;
}
