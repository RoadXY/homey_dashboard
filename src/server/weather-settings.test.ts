import { describe, expect, it } from "vitest";
import { normalizeWeatherSettings } from "./weather-settings";

describe("weather settings normalization", () => {
  it("uses Standard when the stored icon pack is missing or invalid", () => {
    expect(normalizeWeatherSettings({}).iconPack).toBe("animated");
    expect(normalizeWeatherSettings({ iconPack: "unknown-pack" }).iconPack).toBe("animated");
  });

  it("preserves each supported icon pack and the independent animation preference", () => {
    for (const iconPack of ["animated", "color3d", "outline", "flat"] as const) {
      expect(normalizeWeatherSettings({ iconPack, animateIcons: false }).iconPack).toBe(iconPack);
      expect(normalizeWeatherSettings({ iconPack, animateIcons: false }).animateIcons).toBe(false);
    }
  });

  it("defaults animation to enabled when the preference is absent", () => {
    expect(normalizeWeatherSettings({ iconPack: "color3d" }).animateIcons).toBe(true);
  });
});
