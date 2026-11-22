import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEATHER_ICON_ANIMATION,
  DEFAULT_WEATHER_ICON_PACK,
  WEATHER_ICON_CATEGORIES,
  WEATHER_ICON_PACKS,
  normalizeWeatherIconPack,
  weatherIconClassName,
} from "./weather-icons";

describe("weather icon registry", () => {
  it("keeps the complete canonical weather category list in one place", () => {
    expect(WEATHER_ICON_CATEGORIES).toEqual([
      "sunny", "mostly_sunny", "partly_cloudy", "cloudy", "overcast", "fog",
      "drizzle", "rain", "heavy_rain", "showers", "thunderstorm", "hail",
      "snow", "snow_showers", "sleet", "windy", "unknown",
    ]);
  });

  it("keeps Standard as the first and default icon pack", () => {
    expect(WEATHER_ICON_PACKS.map((pack) => pack.id)).toEqual([
      "animated", "color3d", "outline", "flat",
    ]);
    expect(DEFAULT_WEATHER_ICON_PACK).toBe("animated");
    expect(WEATHER_ICON_PACKS[0].labelKey).toBe("weatherSettings.packAnimated");
  });

  it("defaults animation to enabled", () => {
    expect(DEFAULT_WEATHER_ICON_ANIMATION).toBe(true);
  });

  it("normalizes missing and unknown pack IDs to Standard", () => {
    expect(normalizeWeatherIconPack(undefined)).toBe("animated");
    expect(normalizeWeatherIconPack(null)).toBe("animated");
    expect(normalizeWeatherIconPack("not-a-pack")).toBe("animated");
    expect(normalizeWeatherIconPack("color3d")).toBe("color3d");
    expect(normalizeWeatherIconPack("outline")).toBe("outline");
    expect(normalizeWeatherIconPack("flat")).toBe("flat");
  });

  it("uses one shared class contract for animated and static render states", () => {
    expect(weatherIconClassName("rain", "color3d", true))
      .toBe("weather-symbol weather-rain weather-pack-color3d is-animated");
    expect(weatherIconClassName("sunny", "animated", false))
      .toBe("weather-symbol weather-sunny weather-pack-animated is-static");
    expect(weatherIconClassName("unknown", "invalid", true))
      .toBe("weather-symbol weather-unknown weather-pack-animated is-animated");
  });
});
