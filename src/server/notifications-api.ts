import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type ApiNotificationSeverity = "critical" | "warning" | "info";
type StoredApiNotification = {
  id: string;
  source: "api";
  title: string;
  message: string;
  severity: ApiNotificationSeverity;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
};
export type ApiNotificationInput = {
  title: unknown;
  message: unknown;
  severity: unknown;
  expiresAt?: unknown;
};
export type PublicApiNotification = Omit<StoredApiNotification, "source">;

const storageFile = join(process.env.DATA_DIR ?? join(process.cwd(), "data"), "api-notifications.json");
let writeQueue: Promise<void> = Promise.resolve();
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
let expiryCallback: (() => void) | undefined;

function isSeverity(value: unknown): value is ApiNotificationSeverity {
  return value === "critical" || value === "warning" || value === "info";
}
function parseExpiry(value: unknown, now = Date.now()): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) throw new Error("expiresAt must be an ISO 8601 timestamp with a timezone.");
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time <= now) throw new Error("expiresAt must be a valid timestamp in the future.");
  return new Date(time).toISOString();
}
function validateText(value: unknown, field: "title" | "message", max: number): string {
  if (typeof value !== "string") throw new Error(field + " must be a string.");
  const clean = value.trim();
  if (!clean || clean.length > max) throw new Error(field + " must contain 1 to " + max + " characters.");
  return clean;
}
function toPublic(item: StoredApiNotification): PublicApiNotification {
  const { source: _source, ...publicItem } = item;
  return publicItem;
}
async function readStored(): Promise<StoredApiNotification[]> {
  try {
    const parsed = JSON.parse(await readFile(storageFile, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredApiNotification =>
      !!item && typeof item === "object" && (item as StoredApiNotification).source === "api" &&
      typeof (item as StoredApiNotification).id === "string" &&
      typeof (item as StoredApiNotification).title === "string" &&
      typeof (item as StoredApiNotification).message === "string" &&
      isSeverity((item as StoredApiNotification).severity) &&
      typeof (item as StoredApiNotification).createdAt === "string" &&
      typeof (item as StoredApiNotification).updatedAt === "string"
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
async function writeStored(items: StoredApiNotification[]): Promise<void> {
  await mkdir(dirname(storageFile), { recursive: true });
  const temporary = storageFile + "." + randomUUID() + ".tmp";
  await writeFile(temporary, JSON.stringify(items, null, 2) + "\n", { encoding: "utf8", mode: 0o600, flag: "wx" });
  await rename(temporary, storageFile);
}
async function mutate<T>(operation: (items: StoredApiNotification[]) => Promise<{ items: StoredApiNotification[]; result: T }> | { items: StoredApiNotification[]; result: T }): Promise<T> {
  const task = writeQueue.then(async () => {
    const current = await readStored();
    const outcome = await operation(current);
    if (outcome.items !== current) await writeStored(outcome.items);
    return outcome.result;
  });
  writeQueue = task.then(() => undefined, () => undefined);
  return task;
}
function scheduleExpiry(): void {
  if (expiryTimer) clearTimeout(expiryTimer);
  expiryTimer = undefined;
  if (!expiryCallback) return;
  void readStored().then(items => {
    const next = items.map(item => item.expiresAt ? Date.parse(item.expiresAt) : Infinity).filter(value => Number.isFinite(value) && value > Date.now()).reduce((a,b)=>Math.min(a,b), Infinity);
    if (!Number.isFinite(next)) return;
    expiryTimer = setTimeout(() => {
      expiryCallback?.();
      scheduleExpiry();
    }, Math.min(2_147_483_647, Math.max(0, next - Date.now() + 10)));
  }).catch(() => undefined);
}

export async function initializeApiNotificationExpiryMonitor(onExpired: () => void): Promise<void> {
  expiryCallback = onExpired;
  scheduleExpiry();
}
export async function getActiveApiNotifications(now = Date.now()): Promise<PublicApiNotification[]> {
  return (await readStored())
    .filter(item => !item.expiresAt || Date.parse(item.expiresAt) > now)
    .map(toPublic);
}
export async function getPublicApiNotifications(): Promise<PublicApiNotification[]> {
  return getActiveApiNotifications();
}
export async function getNextApiNotificationExpiry(): Promise<number | undefined> {
  const next = (await readStored()).map(item => item.expiresAt ? Date.parse(item.expiresAt) : Infinity).filter(Number.isFinite).reduce((a,b)=>Math.min(a,b), Infinity);
  return Number.isFinite(next) ? next : undefined;
}
export async function createApiNotification(input: ApiNotificationInput): Promise<PublicApiNotification> {
  const title = validateText(input.title, "title", 120);
  const message = validateText(input.message, "message", 2000);
  if (!isSeverity(input.severity)) throw new Error("severity must be critical, warning or info.");
  const expiresAt = parseExpiry(input.expiresAt);
  const now = new Date().toISOString();
  const item: StoredApiNotification = {
    id: randomUUID(), source: "api", title, message, severity: input.severity,
    createdAt: now, updatedAt: now, ...(expiresAt ? { expiresAt } : {}),
  };
  await mutate(items => ({ items: [...items, item], result: item }));
  scheduleExpiry();
  return toPublic(item);
}
export async function patchApiNotification(id: string, patch: Record<string, unknown>): Promise<PublicApiNotification | null> {
  const updated = await mutate(items => {
    const index = items.findIndex(item => item.id === id && (!item.expiresAt || Date.parse(item.expiresAt) > Date.now()));
    if (index < 0) return { items, result: null };
    const current = items[index];
    const next: StoredApiNotification = { ...current, updatedAt: new Date().toISOString() };
    if ("title" in patch) next.title = validateText(patch.title, "title", 120);
    if ("message" in patch) next.message = validateText(patch.message, "message", 2000);
    if ("severity" in patch) {
      if (!isSeverity(patch.severity)) throw new Error("severity must be critical, warning or info.");
      next.severity = patch.severity;
    }
    if ("expiresAt" in patch) {
      if (patch.expiresAt === null) delete next.expiresAt;
      else next.expiresAt = parseExpiry(patch.expiresAt);
    }
    const copy = [...items];
    copy[index] = next;
    return { items: copy, result: next };
  });
  scheduleExpiry();
  return updated ? toPublic(updated) : null;
}
export async function deleteApiNotification(id: string): Promise<boolean> {
  const deleted = await mutate(items => {
    const now = Date.now();
    const next = items.filter(item => item.id !== id || (item.expiresAt && Date.parse(item.expiresAt) <= now));
    const deleted = items.some(item => item.id === id && (!item.expiresAt || Date.parse(item.expiresAt) > now));
    return { items: next.length === items.length ? items : next, result: deleted };
  });
  scheduleExpiry();
  return deleted;
}
