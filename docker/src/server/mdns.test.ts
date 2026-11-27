import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildMdnsRecords,
  buildGoodbyeRecords,
  readQuestions,
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

describe("mDNS service records", () => {
  it("detects the mDNS QU bit for unicast-response questions", () => {
    const question = Buffer.from([
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
      6, 95, 104, 111, 109, 101, 121, 0,
      0, 12,
      0x80, 1,
    ]);
    expect(readQuestions(question)).toEqual([
      { name: "_homey.", type: 12, unicastResponse: true },
    ]);
    question[question.length - 2] = 0;
    question[question.length - 1] = 1;
    expect(readQuestions(question)[0]?.unicastResponse).toBe(false);
  });


  it("does not withdraw the stable A record when the friendly service name changes", async () => {
    const identity = { id: "6fcec914-1234-4234-8234-123456789abc", name: "Keuken" };
    const records = buildMdnsRecords(identity, 5173);
    // Only service-instance records are withdrawn. The stable host A record
    // remains cached and resolvable across a friendly-name change.
    const goodbye = buildGoodbyeRecords(records);
    expect(goodbye.map(record => record.type)).toEqual([12, 33, 16]);
    expect(goodbye.every(record => record.ttl === 0)).toBe(true);
    expect(goodbye.some(record => record.name === records.hostName && record.type === 1)).toBe(false);
  });
});

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

  it("uses a stable installation-specific mDNS host target, independent of Docker hostname", () => {
    const identity = { id: "6fcec914-1234-4234-8234-123456789abc", name: "Keuken" };
    const records = buildMdnsRecords(identity, 5173);
    expect(records.hostName).toBe("homey-dashboard-6fcec914.local.");
    expect(records.addresses.length).toBeGreaterThan(0);
    expect(records.addresses.every(record => record.name === records.hostName)).toBe(true);
  });

  it("uses the documented DNS-SD service type", () => {
    expect(MDNS_SERVICE_TYPE).toBe("_homey-dashboard._tcp.local.");
  });
});
