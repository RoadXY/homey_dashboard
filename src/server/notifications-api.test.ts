import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let directory = "";
let api: typeof import("./notifications-api.js");

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "homey-notifications-api-"));
  vi.stubEnv("DATA_DIR", directory);
  vi.resetModules();
  api = await import("./notifications-api.js");
});
afterEach(async () => {
  vi.unstubAllEnvs();
  if (directory) await rm(directory, { recursive: true, force: true });
});

describe("Notifications API storage", () => {
  it("creates records with server-generated identifiers and timestamps, without exposing source", async () => {
    const created = await api.createApiNotification({ title: " Rookmelder ", message: " Rook gedetecteerd ", severity: "critical" });
    expect(created).toMatchObject({ title: "Rookmelder", message: "Rook gedetecteerd", severity: "critical" });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(created.createdAt).toBe(created.updatedAt);
    expect(created).not.toHaveProperty("source");
    expect(await api.getPublicApiNotifications()).toEqual([created]);
  });

  it("validates text, severity and future timezone-aware expiry", async () => {
    await expect(api.createApiNotification({ title: " ", message: "body", severity: "info" })).rejects.toThrow();
    await expect(api.createApiNotification({ title: "title", message: "body", severity: "fatal" })).rejects.toThrow();
    await expect(api.createApiNotification({ title: "title", message: "body", severity: "info", expiresAt: "2030-01-01T00:00:00" })).rejects.toThrow();
    await expect(api.createApiNotification({ title: "title", message: "body", severity: "info", expiresAt: "2000-01-01T00:00:00Z" })).rejects.toThrow();
  });

  it("patches only supplied fields and supports clearing expiry", async () => {
    const created = await api.createApiNotification({
      title: "Title", message: "Original", severity: "warning",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const updated = await api.patchApiNotification(created.id, { message: "Updated", expiresAt: null });
    expect(updated).toMatchObject({ id: created.id, title: "Title", message: "Updated", severity: "warning" });
    expect(updated).not.toHaveProperty("expiresAt");
    expect(Date.parse(updated!.updatedAt)).toBeGreaterThanOrEqual(Date.parse(created.updatedAt));
  });

  it("hides expired records and treats their IDs as not deletable", async () => {
    const created = await api.createApiNotification({ title: "Temporary", message: "Expires", severity: "info", expiresAt: new Date(Date.now() + 5).toISOString() });
    await new Promise(resolve => setTimeout(resolve, 15));
    expect(await api.getActiveApiNotifications()).toEqual([]);
    expect(await api.patchApiNotification(created.id, { title: "Late" })).toBeNull();
    expect(await api.deleteApiNotification(created.id)).toBe(false);
  });

  it("serializes concurrent writes without losing records", async () => {
    await Promise.all(Array.from({ length: 12 }, (_, index) =>
      api.createApiNotification({ title: "Item " + index, message: "Message", severity: "info" })
    ));
    expect(await api.getPublicApiNotifications()).toHaveLength(12);
  });

  it("deletes only API-owned records", async () => {
    const created = await api.createApiNotification({ title: "Delete", message: "Me", severity: "info" });
    expect(await api.deleteApiNotification(created.id)).toBe(true);
    expect(await api.deleteApiNotification(created.id)).toBe(false);
  });
});
