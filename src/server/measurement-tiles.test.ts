import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDirectory = "";

beforeEach(async () => {
  dataDirectory = await mkdtemp(join(tmpdir(), "homey-measurement-tiles-"));
  vi.stubEnv("DATA_DIR", dataDirectory);
  vi.resetModules();
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dataDirectory, { recursive: true, force: true });
});

describe("measurement tile settings", () => {
  it("defaults to four visible tiles while preparing six fixed configurations", async () => {
    const { readMeasurementTiles } = await import("./measurement-tiles.js");
    const settings = await readMeasurementTiles();

    expect(settings.count).toBe(4);
    expect(settings.tiles).toHaveLength(6);
    expect(settings.tiles.map(tile => tile.id)).toEqual([
      "measurement-1", "measurement-2", "measurement-3",
      "measurement-4", "measurement-5", "measurement-6",
    ]);
  });

  it.each([2, 4, 6] as const)("accepts %i visible tiles and preserves all six configurations", async count => {
    const { defaultMeasurementTiles, readMeasurementTiles, saveMeasurementTiles } = await import("./measurement-tiles.js");
    const tiles = defaultMeasurementTiles.map(tile => ({ ...tile }));
    tiles[5] = { ...tiles[5], name: "Zolder CO2", source: { type: "logic", variableId: "logic-123" } };

    await saveMeasurementTiles({ count, tiles });
    const saved = await readMeasurementTiles();
    const persisted = JSON.parse(await readFile(join(dataDirectory, "measurement-tiles.json"), "utf8"));

    expect(saved.count).toBe(count);
    expect(saved.tiles).toHaveLength(6);
    expect(saved.tiles[5]).toEqual(tiles[5]);
    expect(persisted.count).toBe(count);
  });

  it("rejects unsupported counts and incomplete tile collections", async () => {
    const { defaultMeasurementTiles, saveMeasurementTiles } = await import("./measurement-tiles.js");
    const tiles = defaultMeasurementTiles.map(tile => ({ ...tile }));

    await expect(saveMeasurementTiles({ count: 3, tiles })).rejects.toThrow("2, 4 of 6");
    await expect(saveMeasurementTiles({ count: 4, tiles: tiles.slice(0, 4) })).rejects.toThrow("precies zes");
  });
});
