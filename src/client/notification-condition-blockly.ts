export type NotificationSourceCatalog = {
  devices: Array<{
    id: string;
    capabilities: Array<{ id: string; type: "number" | "boolean" }>;
  }>;
  variables: Array<{ id: string; type: "number" | "boolean" }>;
};

export type NotificationSource =
  | { type: "device-capability"; deviceId: string; capabilityId: string; expectedType: "number" | "boolean" }
  | { type: "logic-variable"; variableId: string; expectedType: "number" | "boolean" };

export type ComparisonOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual";

export function sourceKeyFromNode(source: any): string {
  if (source?.type === "device-capability") return "device:" + source.deviceId + ":" + source.capabilityId;
  if (source?.type === "logic-variable") return "logic:" + source.variableId;
  throw new Error("Onbekend Homey-brontype.");
}

export function sourceFromKey(key: string, catalog: NotificationSourceCatalog | null): NotificationSource | null {
  if (!catalog || typeof key !== "string") return null;
  if (key.startsWith("device:")) {
    const parts = key.split(":");
    if (parts.length !== 3 || !parts[1] || !parts[2]) return null;
    const [, deviceId, capabilityId] = parts;
    const capability = catalog.devices.find(item => item.id === deviceId)?.capabilities.find(item => item.id === capabilityId);
    return capability ? { type: "device-capability", deviceId, capabilityId, expectedType: capability.type } : null;
  }
  if (key.startsWith("logic:")) {
    const variableId = key.slice(6);
    const variable = catalog.variables.find(item => item.id === variableId);
    return variable ? { type: "logic-variable", variableId, expectedType: variable.type } : null;
  }
  return null;
}

export function comparisonValueFromBlockly(source: NotificationSource, operator: string, raw: string): number | boolean {
  const numericOperators: ComparisonOperator[] = ["equals", "notEquals", "greaterThan", "greaterThanOrEqual", "lessThan", "lessThanOrEqual"];
  const booleanOperators: ComparisonOperator[] = ["equals", "notEquals"];
  if (!(source.expectedType === "number" ? numericOperators : booleanOperators).includes(operator as ComparisonOperator)) {
    throw new Error("De gekozen vergelijkingsoperator past niet bij het datatype van de bron.");
  }
  if (source.expectedType === "number") {
    const value = Number(raw);
    if (!Number.isFinite(value) || raw.trim() === "") throw new Error("Vul een geldig getal in bij de vergelijking.");
    return value;
  }
  if (raw !== "true" && raw !== "false") throw new Error("Een booleaanse vergelijking vereist true of false.");
  return raw === "true";
}

export function durationNodeToBlockly(node: any): { blockType: string; minutes: number; child: any; id?: string } {
  if (!node || node.type !== "duration" || !Number.isFinite(node.durationMs) || node.durationMs <= 0) {
    throw new Error("Ongeldige duration-node.");
  }
  const inactive = node.condition?.type === "not";
  return {
    blockType: inactive ? "homey_condition_duration_inactive" : "homey_condition_duration",
    minutes: Math.max(1, Math.round(node.durationMs / 60000)),
    child: inactive ? node.condition.condition : node.condition,
    ...(typeof node.id === "string" && node.id ? { id: node.id } : {})
  };
}

export function durationNodeFromBlockly(blockId: string, storedId: unknown, minutes: number, child: any, inactive: boolean): any {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
    throw new Error("De duur moet tussen 1 en 1440 minuten liggen.");
  }
  if (!child) throw new Error("Een duurblok vereist precies één voorwaarde.");
  return {
    type: "duration",
    id: typeof storedId === "string" && storedId ? storedId : blockId,
    durationMs: minutes * 60000,
    condition: inactive ? { type: "not", condition: child } : child
  };
}

/**
 * Direct children of the fixed "Genereer melding" root are implicitly ANDed.
 * A single child is returned unchanged to preserve existing condition JSON.
 */
export function combineRootConditions(conditions: any[]): any {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    throw new Error("Genereer melding vereist minimaal één voorwaarde.");
  }
  if (conditions.length === 1) return conditions[0];
  return { operator: "and", conditions };
}
