import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { getHomeyDeviceCapabilityValues, getHomeyLogicVariables } from "./homey.js";
import { evaluateDurationGate, isScheduleActive, isValidScheduleCondition, nextScheduleTransition, type ConditionResult, type ScheduleCondition } from "./notification-conditions.js";

type Severity = "critical" | "warning" | "info";
type ExpectedType = "boolean" | "number";
type Source =
  | { type: "logic-variable"; name: string; expectedType: ExpectedType }
  | { type: "device-capability"; deviceId: string; capabilityId: string; expectedType: ExpectedType };
type Comparison =
  | { operator: "equals"; value: boolean | number }
  | { operator: "lessThan"; value: number }
  | { operator: "greaterThan"; value: number };
type ConditionGroup = {
  operator: "and" | "or";
  conditions: ConditionNode[];
};
type ConditionLeaf = { source: Source; condition: Comparison };
type DurationNode = { type: "duration"; id: string; durationMs: number; condition: ConditionNode };
type ScheduleNode = { type: "schedule" } & ScheduleCondition;
type ConditionNode = ConditionGroup | ConditionLeaf | DurationNode | ScheduleNode;

const durationStartedAt = new Map<string, number>();

type NotificationConfig = {
  schemaVersion: number;
  id: string;
  title: string;
  message: string;
  severity: Severity;
  enabled: boolean;
  testOnly?: boolean;
  // Legacy schemaVersion 1 format remains supported during migration.
  source?: Source;
  condition: Comparison | ConditionNode;
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
  if (!value || typeof value !== "object") return false;
  const source = value as Record<string, unknown>;
  if (!["boolean", "number"].includes(String(source.expectedType))) return false;
  if (source.type === "logic-variable") return typeof source.name === "string" && source.name.length > 0;
  if (source.type === "device-capability") {
    return typeof source.deviceId === "string" && source.deviceId.length > 0 &&
      typeof source.capabilityId === "string" && source.capabilityId.length > 0;
  }
  return false;
}

function isComparison(value: unknown): value is Comparison {
  if (!value || typeof value !== "object") return false;
  const comparison = value as Record<string, unknown>;
  if (comparison.operator === "equals") {
    return typeof comparison.value === "boolean" || (typeof comparison.value === "number" && Number.isFinite(comparison.value));
  }
  return (comparison.operator === "lessThan" || comparison.operator === "greaterThan") &&
    typeof comparison.value === "number" && Number.isFinite(comparison.value);
}

function isValidSourceCondition(source: unknown, condition: unknown): source is Source {
  if (!isSource(source) || !isComparison(condition)) return false;
  if (condition.operator === "equals") return typeof condition.value === source.expectedType;
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
  if (node.type === "schedule") {
    return typeof node.startTime === "string" && typeof node.endTime === "string" &&
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
  return isValidSourceCondition(node.source, node.condition);
}

export function isValidConditionNode(value: unknown): value is ConditionNode {
  return isConditionNode(value);
}

function sourceKey(source: Source): SourceKey {
  return source.type === "logic-variable"
    ? `logic:${source.name}`
    : `device:${source.deviceId}:${source.capabilityId}`;
}

function collectSources(config: NotificationConfig): Source[] {
  if (isConditionNode(config.condition)) {
    const collect = (node: ConditionNode): Source[] => {
      if ("conditions" in node) return node.conditions.flatMap(collect);
      if ("type" in node && node.type === "duration") return collect(node.condition);
      if ("type" in node && node.type === "schedule") return [];
      return [node.source];
    };
    return collect(config.condition);
  }
  return config.source ? [config.source] : [];
}

export function isValidNotificationConfig(value: unknown): value is NotificationConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const config = value as Record<string, unknown>;
  const hasLegacyShape = isValidSourceCondition(config.source, config.condition);
  const hasTreeShape = config.source === undefined && isConditionNode(config.condition);
  return config.schemaVersion === 1 &&
    typeof config.id === "string" && config.id.trim().length > 0 &&
    typeof config.title === "string" && config.title.trim().length > 0 &&
    typeof config.message === "string" &&
    (hasLegacyShape || hasTreeShape) &&
    ["critical", "warning", "info"].includes(String(config.severity)) &&
    typeof config.enabled === "boolean" &&
    (config.testOnly === undefined || typeof config.testOnly === "boolean");
}

async function loadConfigs(): Promise<NotificationConfig[]> {
  const directory = join(process.cwd(), "config", "notifications");
  const filenames = (await readdir(directory)).filter((filename) => filename.endsWith(".json")).sort();
  const configs = await Promise.all(filenames.map(async (filename) => {
    const config = JSON.parse(await readFile(join(directory, filename), "utf8")) as NotificationConfig;
    if (!isValidNotificationConfig(config)) throw new Error(`Ongeldige meldingsconfiguratie: ${filename}`);
    return config;
  }));
  if (new Set(configs.map((item) => item.id)).size !== configs.length) throw new Error("Dubbele dashboardmelding-ID gevonden.");
  return configs;
}

function evaluateComparison(value: unknown, expectedType: ExpectedType, condition: Comparison): Evaluation {
  if (typeof value !== expectedType || (expectedType === "number" && !Number.isFinite(value as number))) {
    return { state: "unknown", reason: "source_value_invalid" };
  }
  switch (condition.operator) {
    case "equals": return { state: value === condition.value ? "active" : "inactive" };
    case "lessThan": return { state: (value as number) < condition.value ? "active" : "inactive" };
    case "greaterThan": return { state: (value as number) > condition.value ? "active" : "inactive" };
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
    try {
      return {
        state: isScheduleActive(node, now) ? "active" : "inactive",
        reevaluateAt: nextScheduleTransition(node, now),
      };
    } catch {
      return { state: "unknown", reason: "schedule_invalid" };
    }
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

  let logicVariables: Array<{ name: string; type: string; value: unknown }> = [];
  let deviceReadings: Array<{ deviceId: string; capabilityId: string; available: boolean; value?: unknown; error?: string }> = [];
  let logicError = false, deviceError = false;

  if (logicSources.length) {
    try {
      logicVariables = (await getHomeyLogicVariables(logicSources.map((source) => source.name))).variables;
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
    const variable = logicVariables.find((item) => item.name === source.name);
    if (!variable) values.set(sourceKey(source), { expectedType: source.expectedType, error: "source_missing" });
    else if (variable.type.toLowerCase() !== source.expectedType) values.set(sourceKey(source), { expectedType: source.expectedType, error: "source_type_mismatch" });
    else values.set(sourceKey(source), { expectedType: source.expectedType, value: variable.value });
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
    if (isConditionNode(config.condition)) {
      const result = evaluateNode(config.condition, values, config.id, evaluationTime);
      if (result.reevaluateAt !== undefined) {
        nextEvaluationAt = nextEvaluationAt === undefined ? result.reevaluateAt : Math.min(nextEvaluationAt, result.reevaluateAt);
      }
      return { ...base, state: result.state, ...(result.reason ? { reason: result.reason } : {}) };
    }
    if (!config.source) return { ...base, state: "unknown", reason: "configuration_invalid" };
    const value = values.get(sourceKey(config.source));
    if (!value) return { ...base, state: "unknown", reason: "source_missing" };
    if (value.error) return { ...base, state: "unknown", reason: value.error };
    if (value.expectedType !== config.source.expectedType) return { ...base, state: "unknown", reason: "source_type_mismatch" };
    return { ...base, ...evaluateComparison(value.value, config.source.expectedType, config.condition) };
  });

  return {
    retrievedAt: new Date().toISOString(),
    notifications,
    ...(nextEvaluationAt === undefined ? {} : { nextEvaluationAt }),
  };
}
