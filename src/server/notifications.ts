import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { getHomeyLogicVariables } from "./homey.js";

type NotificationConfig = {
  schemaVersion: number;
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  enabled: boolean;
  testOnly?: boolean;
  source: {
    type: "logic-variable";
    name: string;
    expectedType: "boolean";
  };
  condition: {
    operator: "equals";
    value: boolean;
  };
};

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  testOnly: boolean;
  state: "active" | "inactive" | "unknown";
  reason?: "source_missing" | "source_type_mismatch" | "source_value_invalid" | "source_unavailable";
};

async function loadConfigs(): Promise<NotificationConfig[]> {
  const directory = join(process.cwd(), "config", "notifications");
  const filenames = (await readdir(directory)).filter((filename) => filename.endsWith(".json")).sort();
  const configs = await Promise.all(filenames.map(async (filename) => {
    const file = await readFile(join(directory, filename), "utf8");
    const config = JSON.parse(file) as NotificationConfig;
    if (
      config.schemaVersion !== 1 ||
      !config.id ||
      !config.title ||
      config.source?.type !== "logic-variable" ||
      config.condition?.operator !== "equals" ||
      typeof config.condition.value !== "boolean" ||
      !["critical", "warning", "info"].includes(config.severity)
    ) {
      throw new Error(`Ongeldige meldingsconfiguratie: ${filename}`);
    }
    return config;
  }));
  const ids = configs.map((config) => config.id);
  if (new Set(ids).size !== ids.length) throw new Error("Dubbele dashboardmelding-ID gevonden.");
  return configs;
}

export async function getDashboardNotifications(): Promise<{
  retrievedAt: string;
  notifications: DashboardNotification[];
}> {
  const configs = (await loadConfigs()).filter((config) => config.enabled);
  let variables: { name: string; type: string; value: unknown }[];

  try {
    const response = await getHomeyLogicVariables(configs.map((config) => config.source.name));
    variables = response.variables;
  } catch {
    return {
      retrievedAt: new Date().toISOString(),
      notifications: configs.map((config): DashboardNotification => ({
        id: config.id,
        title: config.title,
        message: config.message,
        severity: config.severity,
        testOnly: Boolean(config.testOnly),
        state: "unknown",
        reason: "source_unavailable",
      })),
    };
  }

  const notifications = configs.map((config): DashboardNotification => {
    const variable = variables.find((item) => item.name === config.source.name);
    const base = {
      id: config.id,
      title: config.title,
      message: config.message,
      severity: config.severity,
      testOnly: Boolean(config.testOnly),
    };

    if (!variable) return { ...base, state: "unknown", reason: "source_missing" };
    if (typeof variable.type !== "string" || variable.type.toLowerCase() !== config.source.expectedType) {
      return { ...base, state: "unknown", reason: "source_type_mismatch" };
    }
    if (typeof variable.value !== "boolean") {
      return { ...base, state: "unknown", reason: "source_value_invalid" };
    }

    return {
      ...base,
      state: variable.value === config.condition.value ? "active" : "inactive",
    };
  });

  return { retrievedAt: new Date().toISOString(), notifications };
}
