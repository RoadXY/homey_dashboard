import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { getHomeyDeviceCapabilityValues, getHomeyLogicVariables } from "./homey.js";

type Severity = "critical" | "warning" | "info";
type NotificationConfig = {
  schemaVersion: number;
  id: string;
  title: string;
  message: string;
  severity: Severity;
  enabled: boolean;
  testOnly?: boolean;
  source:
    | { type: "logic-variable"; name: string; expectedType: "boolean" | "number" }
    | { type: "device-capability"; deviceId: string; capabilityId: string; expectedType: "number" };
  condition:
    | { operator: "equals"; value: boolean | number }
    | { operator: "lessThan"; value: number }
    | { operator: "greaterThan"; value: number };
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

async function loadConfigs(): Promise<NotificationConfig[]> {
  const directory = join(process.cwd(), "config", "notifications");
  const filenames = (await readdir(directory)).filter((filename) => filename.endsWith(".json")).sort();
  const configs = await Promise.all(filenames.map(async (filename) => {
    const config = JSON.parse(await readFile(join(directory, filename), "utf8")) as NotificationConfig;
    const validSource =
      (config.source?.type === "logic-variable" && typeof config.source.name === "string") ||
      (config.source?.type === "device-capability" && typeof config.source.deviceId === "string" && typeof config.source.capabilityId === "string");
    const validCondition =
      (config.condition?.operator === "equals" && ["boolean", "number"].includes(typeof config.condition.value)) ||
      ((config.condition?.operator === "lessThan" || config.condition?.operator === "greaterThan") && typeof config.condition.value === "number");
    if (config.schemaVersion !== 1 || !config.id || !config.title || !validSource || !validCondition ||
      !["critical", "warning", "info"].includes(config.severity) || typeof config.enabled !== "boolean") {
      throw new Error(`Ongeldige meldingsconfiguratie: ${filename}`);
    }
    return config;
  }));
  if (new Set(configs.map((item) => item.id)).size !== configs.length) throw new Error("Dubbele dashboardmelding-ID gevonden.");
  return configs;
}

function evaluate(value: unknown, expectedType: "boolean" | "number", condition: NotificationConfig["condition"]):
  { state: "active" | "inactive" | "unknown"; reason?: string } {
  if (typeof value !== expectedType || (expectedType === "number" && !Number.isFinite(value as number))) {
    return { state: "unknown", reason: "source_value_invalid" };
  }
  switch (condition.operator) {
    case "equals": return { state: value === condition.value ? "active" : "inactive" };
    case "lessThan": return { state: (value as number) < condition.value ? "active" : "inactive" };
    case "greaterThan": return { state: (value as number) > condition.value ? "active" : "inactive" };
  }
}

export async function getDashboardNotifications(): Promise<{ retrievedAt: string; notifications: DashboardNotification[] }> {
  const configs = (await loadConfigs()).filter((config) => config.enabled);
  const logicConfigs = configs.filter((config) => config.source.type === "logic-variable");
  const deviceConfigs = configs.filter((config) => config.source.type === "device-capability");

  let logicVariables: Array<{ name: string; type: string; value: unknown }> = [];
  let deviceReadings: Array<{ deviceId: string; capabilityId: string; available: boolean; value?: unknown; error?: string }> = [];
  let logicError = false, deviceError = false;

  if (logicConfigs.length) {
    try {
      logicVariables = (await getHomeyLogicVariables(logicConfigs.map((config) => config.source.type === "logic-variable" ? config.source.name : ""))).variables;
    } catch { logicError = true; }
  }
  if (deviceConfigs.length) {
    try {
      deviceReadings = (await getHomeyDeviceCapabilityValues(deviceConfigs.map((config) => config.source.type === "device-capability" ? {
        deviceId: config.source.deviceId, capabilityId: config.source.capabilityId,
      } : { deviceId: "", capabilityId: "" }))).readings;
    } catch { deviceError = true; }
  }

  const notifications = configs.map((config): DashboardNotification => {
    const base = { id: config.id, title: config.title, message: config.message, severity: config.severity, testOnly: Boolean(config.testOnly) };
    let value: unknown;
    let sourceType: "boolean" | "number";
    if (config.source.type === "logic-variable") {
      sourceType = config.source.expectedType;
      if (logicError) return { ...base, state: "unknown", reason: "source_unavailable" };
      const variable = logicVariables.find((item) => item.name === config.source.name);
      if (!variable) return { ...base, state: "unknown", reason: "source_missing" };
      if (variable.type.toLowerCase() !== sourceType) return { ...base, state: "unknown", reason: "source_type_mismatch" };
      value = variable.value;
    } else {
      sourceType = config.source.expectedType;
      if (deviceError) return { ...base, state: "unknown", reason: "source_unavailable" };
      const reading = deviceReadings.find((item) => item.deviceId === config.source.deviceId && item.capabilityId === config.source.capabilityId);
      if (!reading) return { ...base, state: "unknown", reason: "source_missing" };
      if (reading.available === false || reading.error) return { ...base, state: "unknown", reason: reading.error ?? "device_unavailable" };
      value = reading.value;
    }
    return { ...base, ...evaluate(value, sourceType, config.condition) };
  });

  return { retrievedAt: new Date().toISOString(), notifications };
}
