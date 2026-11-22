import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createOrLoadInstallationIdentity,
  generateInstallationName,
  isValidInstallationName,
  MDNS_SERVICE_TYPE,
} from "./mdns.js";

const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "homey-dashboard-mdns-"));
  temporaryDirectories.push(directory);
  return directory;
}

describe("mDNS installation identity", () => {
  it("generates a Dutch two-word name", () => {
    expect(generateInstallationName()).toMatch(/^\p{L}+ \p{L}+$/u);
  });

  it("validates names against the DNS-SD instance label limit", () => {
    expect(isValidInstallationName("Woonkamer")).toBe(true);
    expect(isValidInstallationName("")).toBe(false);
    expect(isValidInstallationName("Room / Dashboard")).toBe(false);
    expect(isValidInstallationName("x".repeat(60))).toBe(false);
  });

  it("persists the generated name and installation ID across restarts", async () => {
    const directory = await createTemporaryDirectory();
    const first = await createOrLoadInstallationIdentity(directory);
    const second = await createOrLoadInstallationIdentity(directory);
    expect(second).toEqual(first);
    expect(JSON.parse(await readFile(join(directory, "installation.json"), "utf8"))).toEqual(first);
  });

  it("allows a configured name to change without changing the installation ID", async () => {
    const directory = await createTemporaryDirectory();
    const first = await createOrLoadInstallationIdentity(directory, "Woonkamer");
    const renamed = await createOrLoadInstallationIdentity(directory, "Slaapkamer");
    expect(first.name).toBe("Woonkamer");
    expect(renamed.name).toBe("Slaapkamer");
    expect(renamed.id).toBe(first.id);
  });

  it("uses the documented DNS-SD service type", () => {
    expect(MDNS_SERVICE_TYPE).toBe("_homey-dashboard._tcp.local.");
  });
});
