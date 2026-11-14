import { readFile, readdir, mkdir, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { getHomeyDeviceCapabilityValues, getHomeyLogicVariablesByIds } from "./homey.js";
import { evaluateDurationGate, isScheduleActive, isValidScheduleCondition, nextScheduleTransition, type ConditionResult, type ScheduleCondition } from "./notification-conditions.js";

type Severity = "critical" | "warning" | "info";
type ExpectedType = "boolean" | "number";
type LogicSource = { type: "logic-variable"; variableId: string; expectedType: ExpectedType };
type DeviceSource = { type: "device-capability"; deviceId: string; capabilityId: string; expectedType: ExpectedType };
type Source = LogicSource | DeviceSource;
type Comparison =
  | { operator: "equals" | "notEquals"; value: boolean | number }
  | { operator: "lessThan" | "lessThanOrEqual" | "greaterThan" | "greaterThanOrEqual"; value: number };
type ConditionGroup = {
  operator: "and" | "or";
  conditions: ConditionNode[];
};
type NotNode = { type: "not"; condition: ConditionNode };
type WeekdayNode = { type: "weekday"; weekdays: number[] };
type ConditionLeaf = { type: "comparison"; source: Source; condition: Comparison };
type DurationNode = { type: "duration"; id: string; durationMs: number; condition: ConditionNode };
type ScheduleNode = { type: "schedule" } & ScheduleCondition;
type ConditionNode = ConditionGroup | NotNode | WeekdayNode | ConditionLeaf | DurationNode | ScheduleNode;

const durationStartedAt = new Map<string, number>();

type NotificationConfig = {
  schemaVersion: 1;
  id: string;
  title: string;
  message: string;
  severity: Severity;
  enabled: boolean;
  testOnly?: boolean;
  condition: ConditionNode;
};

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  testOnly: boolean;
  state: "active" | "inactive" | "unknown";
  reason?: string;
};

export type Evaluation = { state: "active" | "inactive" | "unknown"; reason?: string; reevaluateAt?: number };
type SourceKey = string;

function isSource(value: unknown): value is Source {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const source = value as Record<string, unknown>;
  if (!["boolean", "number"].includes(String(source.expectedType))) return false;
  if (source.type === "logic-variable") {
    return typeof source.variableId === "string" && source.variableId.trim().length > 0 && source.name === undefined;
  }
  if (source.type === "device-capability") {
    return typeof source.deviceId === "string" && source.deviceId.trim().length > 0 &&
      typeof source.capabilityId === "string" && source.capabilityId.trim().length > 0;
  }
  return false;
}

function isComparison(value: unknown): value is Comparison {
  if (!value || typeof value !== "object") return false;
  const comparison = value as Record<string, unknown>;
  if (comparison.operator === "equals" || comparison.operator === "notEquals") {
    return typeof comparison.value === "boolean" || (typeof comparison.value === "number" && Number.isFinite(comparison.value));
  }
  return ["lessThan", "lessThanOrEqual", "greaterThan", "greaterThanOrEqual"].includes(String(comparison.operator)) &&
    typeof comparison.value === "number" && Number.isFinite(comparison.value);
}

function isValidSourceCondition(source: unknown, condition: unknown): source is Source {
  if (!isSource(source) || !isComparison(condition)) return false;
  if (condition.operator === "equals" || condition.operator === "notEquals") return typeof condition.value === source.expectedType;
  return source.expectedType === "number";
}

const MAX_CONDITION_DEPTH = 12;
const MAX_CONDITION_NODES = 100;

function isConditionNode(
  value: unknown,
  depth = 1,
  seenDurationIds = new Set<string>(),
  counter = { count: 0 },
): value is ConditionNode {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      depth > MAX_CONDITION_DEPTH || ++counter.count > MAX_CONDITION_NODES) return false;
  const node = value as Record<string, unknown>;
  if (node.type === "weekday") {
    return Array.isArray(node.weekdays) && node.weekdays.length > 0 &&
      node.weekdays.every((day) => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6) &&
      new Set(node.weekdays).size === node.weekdays.length;
  }
  if (node.type === "not") return isConditionNode(node.condition, depth + 1, seenDurationIds, counter);
  if (node.type === "schedule") {
    return (node.configured === undefined || node.configured === false) &&
      (node.timeZone === undefined || typeof node.timeZone === "string") &&
      isValidScheduleCondition(node as unknown as ScheduleCondition);
  }
  if (node.type === "duration") {
    if (typeof node.id !== "string" || node.id.trim().length === 0 || seenDurationIds.has(node.id) ||
        !Number.isSafeInteger(node.durationMs) || Number(node.durationMs) <= 0) return false;
    seenDurationIds.add(node.id);
    return isConditionNode(node.condition, depth + 1, seenDurationIds, counter);
  }
  if (node.operator === "and" || node.operator === "or") {
    return Array.isArray(node.conditions) && node.conditions.length > 0 &&
      node.conditions.every((child) => isConditionNode(child, depth + 1, seenDurationIds, counter));
  }
  return node.type === "comparison" && isValidSourceCondition(node.source, node.condition);
}

export function isValidConditionNode(value: unknown): value is ConditionNode {
  return isConditionNode(value);
}

function sourceKey(source: Source): SourceKey {
  if (source.type === "logic-variable") return `logic:id:${source.variableId}`;
  return `device:${source.deviceId}:${source.capabilityId}`;
}

function collectSources(config: NotificationConfig): Source[] {
  const collect = (node: ConditionNode): Source[] => {
    if ("conditions" in node) return node.conditions.flatMap(collect);
    if ("type" in node && (node.type === "duration" || node.type === "not")) return collect(node.condition);
    if ("type" in node && (node.type === "schedule" || node.type === "weekday")) return [];
    return [node.source];
  };
  return collect(config.condition);
}

export function isValidNotificationConfig(value: unknown): value is NotificationConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const config = value as Record<string, unknown>;
  if (config.schemaVersion !== 1 ||
      typeof config.id !== "string" || config.id.trim().length === 0 ||
      typeof config.title !== "string" || config.title.trim().length === 0 ||
      typeof config.message !== "string" ||
      !["critical", "warning", "info"].includes(String(config.severity)) ||
      typeof config.enabled !== "boolean" ||
      (config.testOnly !== undefined && typeof config.testOnly !== "boolean") ||
      config.source !== undefined) return false;
  return isConditionNode(config.condition);
}

const notificationDataDirectory = process.env.DATA_DIR ?? join(process.cwd(), "data");
const notificationOverridePath = join(notificationDataDirectory, "notifications.json");
const deletedNotificationIdsPath = join(notificationDataDirectory, "notifications-deleted.json");

async function readDeletedNotificationIds(): Promise<Set<string>> {
  try {
    const parsed = JSON.parse(await readFile(deletedNotificationIdsPath, "utf8")) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string" && id.trim().length > 0)) {
      throw new Error("De lijst met verwijderde meldingen is ongeldig.");
    }
    return new Set(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Set();
    throw error;
  }
}

export function parseNotificationConfigJson(contents: string): unknown {
  const normalized = contents.endsWith("\\n") ? contents.slice(0, -2) : contents;
  return JSON.parse(normalized);
}

async function loadDefaultConfigs(): Promise<NotificationConfig[]> {
  const directory = join(process.cwd(), "config", "notifications");
  const filenames = (await readdir(directory)).filter((filename) => filename.endsWith(".json")).sort();
  return Promise.all(filenames.map(async (filename) => {
    const config = JSON.parse(await readFile(join(directory, filename), "utf8")) as unknown;
    if (!isValidNotificationConfig(config)) throw new Error(`Ongeldige meldingsconfiguratie: ${filename}`);
    return config;
  }));
}

export async function getNotificationConfigsForSettings(): Promise<NotificationConfig[]> {
  try {
    const saved = parseNotificationConfigJson(await readFile(notificationOverridePath, "utf8"));
    if (!Array.isArray(saved) || !saved.every(isValidNotificationConfig)) throw new Error("Opgeslagen meldingsconfiguratie is ongeldig.");
    const merged = new Map((await loadDefaultConfigs()).map((config) => [config.id, config]));
    for (const config of saved) merged.set(config.id, config);
    const deletedIds = await readDeletedNotificationIds();
    const configs = [...merged.values()].filter((config) => !deletedIds.has(config.id));
    if (new Set(configs.map((item) => item.id)).size !== configs.length) throw new Error("Dubbele dashboardmelding-ID gevonden.");
    return configs;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return loadDefaultConfigs();
  }
}

export async function deleteNotificationConfigForSettings(id: string): Promise<NotificationConfig[]> {
  if (typeof id !== "string" || !id.trim()) throw new Error("Ongeldige melding-ID.");
  const configs = await getNotificationConfigsForSettings();
  if (!configs.some((config) => config.id === id)) throw new Error("Deze melding bestaat niet (meer).");
  const deletedIds = await readDeletedNotificationIds();
  deletedIds.add(id);
  await mkdir(notificationDataDirectory, { recursive: true });
  const temporaryPath = join(notificationDataDirectory, `notifications-deleted.${randomUUID()}.tmp`);
  await writeFile(temporaryPath, JSON.stringify([...deletedIds].sort(), null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, deletedNotificationIdsPath);
  return getNotificationConfigsForSettings();
}

export async function saveNotificationConfigsForSettings(value: unknown): Promise<NotificationConfig[]> {
  if (!Array.isArray(value) || value.length > 200 || !value.every(isValidNotificationConfig)) {
    throw new Error("De meldingsconfiguratie bevat ongeldige of ontbrekende velden.");
  }
  const configs = value as NotificationConfig[];
  if (new Set(configs.map((item) => item.id)).size !== configs.length) throw new Error("Dubbele dashboardmelding-ID gevonden.");
  const directory = join(process.env.DATA_DIR ?? join(process.cwd(), "data"));
  await mkdir(directory, { recursive: true });
  const temporaryPath = join(directory, `notifications.${randomUUID()}.tmp`);
  await writeFile(temporaryPath, JSON.stringify(configs, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, notificationOverridePath);
  return configs;
}

async function loadConfigs(): Promise<NotificationConfig[]> {
  return getNotificationConfigsForSettings();
}

function evaluateComparison(value: unknown, expectedType: ExpectedType, condition: Comparison): Evaluation {
  if (typeof value !== expectedType || (expectedType === "number" && !Number.isFinite(value as number))) {
    return { state: "unknown", reason: "source_value_invalid" };
  }
  switch (condition.operator) {
    case "equals": return { state: value === condition.value ? "active" : "inactive" };
    case "notEquals": return { state: value !== condition.value ? "active" : "inactive" };
    case "lessThan": return { state: (value as number) < condition.value ? "active" : "inactive" };
    case "lessThanOrEqual": return { state: (value as number) <= condition.value ? "active" : "inactive" };
    case "greaterThan": return { state: (value as number) > condition.value ? "active" : "inactive" };
    case "greaterThanOrEqual": return { state: (value as number) >= condition.value ? "active" : "inactive" };
  }
}

export function combineConditionResults(operator: "and" | "or", results: Evaluation[]): Evaluation {
  // Three-valued logic: an unknown child is never silently treated as false.
  // Preserve the earliest pending duration deadline so the client can refresh
  // exactly when a condition may change without another Homey event.
  const deadlines = results.flatMap((result) => result.reevaluateAt === undefined ? [] : [result.reevaluateAt]);
  const reevaluateAt = deadlines.length ? Math.min(...deadlines) : undefined;
  let combined: Evaluation;
  if (operator === "and") {
    if (results.some((result) => result.state === "inactive")) combined = { state: "inactive" };
    else combined = results.find((result) => result.state === "unknown") ?? { state: "active" };
  } else if (results.some((result) => result.state === "active")) {
    combined = { state: "active" };
  } else {
    combined = results.find((result) => result.state === "unknown") ?? { state: "inactive" };
  }
  return reevaluateAt === undefined ? combined : { ...combined, reevaluateAt };
}

function evaluateNode(
  node: ConditionNode,
  values: Map<SourceKey, { value?: unknown; expectedType: ExpectedType; error?: string }>,
  notificationId: string,
  now: Date,
): Evaluation {
  if ("type" in node && node.type === "schedule") {
    if (node.configured === false) return { state: "inactive" };
    try {
      return {
        state: isScheduleActive(node, now) ? "active" : "inactive",
        reevaluateAt: nextScheduleTransition(node, now),
      };
    } catch {
      return { state: "unknown", reason: "schedule_invalid" };
    }
  }
  if ("type" in node && node.type === "not") {
    const child = evaluateNode(node.condition, values, notificationId, now);
    if (child.state === "unknown") return child;
    return child.reevaluateAt === undefined
      ? { state: child.state === "active" ? "inactive" : "active" }
      : { state: child.state === "active" ? "inactive" : "active", reevaluateAt: child.reevaluateAt };
  }
  if ("type" in node && node.type === "weekday") {
    const timeZone = "Europe/Amsterdam";
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
    const index: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const currentMinute = Math.floor(now.getTime() / 60_000) * 60_000;
    let midnightTransition: number | undefined;
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const currentState = node.weekdays.includes(index[weekday]);
    for (let minute = 1; minute <= 26 * 60; minute += 1) {
      const candidate = new Date(currentMinute + minute * 60_000);
      const parts = Object.fromEntries(formatter.formatToParts(candidate).map((part) => [part.type, part.value]));
      const candidateState = node.weekdays.includes(index[parts.weekday]);
      if (candidateState !== currentState) { midnightTransition = candidate.getTime(); break; }
    }
    return { state: currentState ? "active" : "inactive", ...(midnightTransition === undefined ? {} : { reevaluateAt: midnightTransition }) };
  }
  if ("type" in node && node.type === "duration") {
    const child = evaluateNode(node.condition, values, notificationId, now);
    return evaluateDurationGate(
      `${notificationId}:${node.id}`,
      child as ConditionResult,
      node.durationMs,
      now.getTime(),
      durationStartedAt,
    );
  }
  if ("conditions" in node) {
    return combineConditionResults(
      node.operator,
      node.conditions.map((child) => evaluateNode(child, values, notificationId, now)),
    );
  }
  const sourceValue = values.get(sourceKey(node.source));
  if (!sourceValue) return { state: "unknown", reason: "source_missing" };
  if (sourceValue.error) return { state: "unknown", reason: sourceValue.error };
  if (sourceValue.expectedType !== node.source.expectedType) return { state: "unknown", reason: "source_type_mismatch" };
  return evaluateComparison(sourceValue.value, node.source.expectedType, node.condition);
}

export async function getDashboardNotifications(): Promise<{ retrievedAt: string; notifications: DashboardNotification[]; nextEvaluationAt?: number }> {
  const configs = (await loadConfigs()).filter((config) => config.enabled);
  const sources = configs.flatMap(collectSources);
  const uniqueSources = [...new Map(sources.map((source) => [sourceKey(source), source])).values()];
  const logicSources = uniqueSources.filter((source) => source.type === "logic-variable");
  const deviceSources = uniqueSources.filter((source) => source.type === "device-capability");

  let logicVariables: Array<{ id: string; name: string; type: string; value: unknown }> = [];
  let deviceReadings: Array<{ deviceId: string; capabilityId: string; available: boolean; value?: unknown; error?: string }> = [];
  let logicError = false, deviceError = false;

  if (logicSources.length) {
    try {
      const variableIds = logicSources.map((source) => source.variableId);
      logicVariables = (await getHomeyLogicVariablesByIds(variableIds)).variables;
    } catch { logicError = true; }
  }
  if (deviceSources.length) {
    try {
      deviceReadings = (await getHomeyDeviceCapabilityValues(deviceSources.map((source) => ({
        deviceId: source.deviceId, capabilityId: source.capabilityId,
      })))).readings;
    } catch { deviceError = true; }
  }

  const values = new Map<SourceKey, { value?: unknown; expectedType: ExpectedType; error?: string }>();
  for (const source of logicSources) {
    if (logicError) {
      values.set(sourceKey(source), { expectedType: source.expectedType, error: "source_unavailable" });
      continue;
    }
    const matches = logicVariables.filter((item) => item.id === source.variableId);
    if (matches.length === 0) values.set(sourceKey(source), { expectedType: source.expectedType, error: "source_missing" });
    else if (matches.length > 1) values.set(sourceKey(source), { expectedType: source.expectedType, error: "source_ambiguous" });
    else if (matches[0].type.toLowerCase() !== source.expectedType) values.set(sourceKey(source), { expectedType: source.expectedType, error: "source_type_mismatch" });
    else values.set(sourceKey(source), { expectedType: source.expectedType, value: matches[0].value });
  }
  for (const source of deviceSources) {
    if (deviceError) {
      values.set(sourceKey(source), { expectedType: source.expectedType, error: "source_unavailable" });
      continue;
    }
    const reading = deviceReadings.find((item) => item.deviceId === source.deviceId && item.capabilityId === source.capabilityId);
    if (!reading) values.set(sourceKey(source), { expectedType: source.expectedType, error: "source_missing" });
    else if (reading.available === false || reading.error) values.set(sourceKey(source), { expectedType: source.expectedType, error: reading.error ?? "device_unavailable" });
    else values.set(sourceKey(source), { expectedType: source.expectedType, value: reading.value });
  }

  const evaluationTime = new Date();
  let nextEvaluationAt: number | undefined;
  const notifications = configs.map((config): DashboardNotification => {
    const base = { id: config.id, title: config.title, message: config.message, severity: config.severity, testOnly: Boolean(config.testOnly) };
    const result = evaluateNode(config.condition, values, config.id, evaluationTime);
    if (result.reevaluateAt !== undefined) {
      nextEvaluationAt = nextEvaluationAt === undefined ? result.reevaluateAt : Math.min(nextEvaluationAt, result.reevaluateAt);
    }
    return { ...base, state: result.state, ...(result.reason ? { reason: result.reason } : {}) };
  });

  return {
    retrievedAt: new Date().toISOString(),
    notifications,
    ...(nextEvaluationAt === undefined ? {} : { nextEvaluationAt }),
  };
}
