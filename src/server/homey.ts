import { HomeyAPI } from "homey-api";
import { EventEmitter } from "node:events";

type HomeyConnectionState = "not-connected" | "connecting" | "online" | "offline";

type HomeySnapshot = {
  state: HomeyConnectionState;
  checkedAt: string | null;
  error: string | null;
  deviceCount: number | null;
  zoneCount: number | null;
};

let api: Awaited<ReturnType<typeof HomeyAPI.createLocalAPI>> | null = null;
export const homeyRealtime = new EventEmitter();
let realtimeSetupFor: unknown = null;
let capabilitySubscriptions: Array<{ destroy: () => void }> = [];
let logicEventHandlers: Array<{ event: string; listener: (...args: any[]) => void }> = [];
let connectPromise: Promise<HomeySnapshot> | null = null;
let realtimeWatchdogStarted = false;
let snapshot: HomeySnapshot = {
  state: "not-connected",
  checkedAt: null,
  error: null,
  deviceCount: null,
  zoneCount: null,
};

const dashboardDeviceIds = [
  "2c7a4148-1042-4dd5-80d4-81d07bcf66ed",
  "5f6616bc-e761-4462-a648-e3ed1f07e5c9",
  "2d5302a8-5be9-47ca-b858-59693523fd93",
  "42b24797-915e-4d2d-bbe9-c7ee7c6378b4",
  "a9cc989a-8672-4bb6-9da0-c0893a02d2f5",
  "ba9336e2-f4ed-417c-bba6-3fafb735e61a",
  "58f20a55-90b3-49cf-9af0-53a40f6e501c",
  "203a126c-1923-4857-abcb-6a727a133099",
  "6d68c7ba-411f-47c1-9624-2f61a7006795",
  "c7e68c38-1588-4c93-9db8-e854f4d251ab",
];

async function setupRealtimeSubscriptions(): Promise<void> {
  if (!api || realtimeSetupFor === api) return;
  const currentApi = api;
  for (const subscription of capabilitySubscriptions) subscription.destroy();
  capabilitySubscriptions = [];
  const previousLogicManager = currentApi.logic as unknown as {
    off: (event: string, listener: (...args: any[]) => void) => void;
  };
  for (const handler of logicEventHandlers) previousLogicManager.off(handler.event, handler.listener);
  logicEventHandlers = [];
  await Promise.all([currentApi.devices.connect(), currentApi.logic.connect()]);
  const devices = await currentApi.devices.getDevices();
  let subscriptions = 0;

  for (const deviceId of dashboardDeviceIds) {
    const device = (devices as Record<string, any>)[deviceId];
    if (!device || !Array.isArray(device.capabilities)) continue;
    for (const capabilityId of device.capabilities as string[]) {
      try {
        const instance = device.makeCapabilityInstance(capabilityId, (value: unknown) => {
          homeyRealtime.emit("update", {
            source: "device",
            deviceId,
            capabilityId,
            value,
            changedAt: new Date().toISOString(),
          });
        });
        capabilitySubscriptions.push(instance);
        subscriptions += 1;
      } catch (error) {
        // Unsupported or temporarily unavailable capabilities must not stop
        // the remaining subscriptions from being registered.
        console.warn("Homey realtime capability subscription failed", { deviceId, capabilityId, error });
      }
    }
  }

  const logicManager = currentApi.logic as unknown as {
    on: (event: string, listener: (variable: { id?: string; name?: string; type?: string; value?: unknown }) => void) => void;
  };
  const logicHandlers = [
    {
      event: "variable.update",
      listener: (variable: { id?: string; name?: string; value?: unknown }) => homeyRealtime.emit("update", {
        source: "logic", variableId: variable.id, variableName: variable.name,
        value: variable.value, changedAt: new Date().toISOString(),
      }),
    },
    {
      event: "variable.create",
      listener: (variable: { name?: string }) => homeyRealtime.emit("update", {
        source: "logic", variableName: variable.name, changedAt: new Date().toISOString(),
      }),
    },
    {
      event: "variable.delete",
      listener: (variable: { name?: string }) => homeyRealtime.emit("update", {
        source: "logic", variableName: variable.name, changedAt: new Date().toISOString(),
      }),
    },
  ];
  for (const handler of logicHandlers) {
    logicManager.on(handler.event, handler.listener);
    logicEventHandlers.push(handler);
  }

  realtimeSetupFor = currentApi;
  homeyRealtime.emit("connected", { subscriptions, changedAt: new Date().toISOString() });
}

function getConfig() {
  return {
    address: process.env.HOMEY_ADDRESS?.trim(),
    token: process.env.HOMEY_API_KEY?.trim(),
  };
}

export function getHomeyStatus(): HomeySnapshot {
  const { address, token } = getConfig();
  if (!address || !token) {
    return { ...snapshot, state: "not-connected" };
  }
  return { ...snapshot };
}

async function connectHomeyInternal(): Promise<HomeySnapshot> {
  const { address, token } = getConfig();

  if (!address || !token) {
    snapshot = {
      state: "not-connected",
      checkedAt: new Date().toISOString(),
      error: null,
      deviceCount: null,
      zoneCount: null,
    };
    return getHomeyStatus();
  }

  snapshot = { ...snapshot, state: "connecting", error: null };

  try {
    api = await HomeyAPI.createLocalAPI({ address, token, debug: null });
    const [devices, zones] = await Promise.all([
      api.devices.getDevices(),
      api.zones.getZones(),
    ]);

    snapshot = {
      state: "online",
      checkedAt: new Date().toISOString(),
      error: null,
      deviceCount: Object.keys(devices).length,
      zoneCount: Object.keys(zones).length,
    };
    await setupRealtimeSubscriptions();
    startRealtimeWatchdog();
  } catch (error) {
    api = null;
    snapshot = {
      state: "offline",
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Onbekende verbindingsfout",
      deviceCount: null,
      zoneCount: null,
    };
  }

  return getHomeyStatus();
}

export function connectHomey(): Promise<HomeySnapshot> {
  if (connectPromise) return connectPromise;
  connectPromise = connectHomeyInternal().finally(() => {
    connectPromise = null;
  });
  return connectPromise;
}

function startRealtimeWatchdog(): void {
  if (realtimeWatchdogStarted) return;
  realtimeWatchdogStarted = true;
  const timer = setInterval(async () => {
    if (!api || snapshot.state !== "online") {
      await connectHomey().catch(() => undefined);
      return;
    }
    const managers = api as unknown as {
      devices: { isConnected: () => boolean };
      logic: { isConnected: () => boolean };
    };
    if (!managers.devices.isConnected() || !managers.logic.isConnected()) {
      realtimeSetupFor = null;
      try {
        await setupRealtimeSubscriptions();
      } catch (error) {
        snapshot = {
          ...snapshot,
          state: "offline",
          checkedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Realtimeverbinding met Homey verbroken",
        };
        homeyRealtime.emit("disconnected", { changedAt: new Date().toISOString() });
      }
    }
  }, 15_000);
  timer.unref();
}

export async function getHomeyInventory() {
  if (!api || snapshot.state !== "online") {
    await connectHomey();
  }

  if (!api || snapshot.state !== "online") {
    throw new Error("Homey is niet verbonden. Controleer adres, API-key en netwerktoegang.");
  }

  const [devices, zones] = await Promise.all([
    api.devices.getDevices(),
    api.zones.getZones(),
  ]);

  const zoneList = Object.values(zones).map((zone) => {
    const item = zone as unknown as Record<string, unknown>;
    return { id: item.id, name: item.name, parent: item.parent };
  });

  const deviceList = Object.values(devices).map((device) => {
    const item = device as unknown as Record<string, unknown>;
    return {
      id: item.id,
      name: item.name,
      zone: item.zone,
      class: item.class,
      available: item.available,
      capabilities: item.capabilities,
    };
  });

  return {
    retrievedAt: new Date().toISOString(),
    counts: { devices: deviceList.length, zones: zoneList.length },
    zones: zoneList,
    devices: deviceList,
  };
}

export async function getHomeyDeviceReadings(deviceIds: string[]) {
  if (!api || snapshot.state !== "online") {
    await connectHomey();
  }

  if (!api || snapshot.state !== "online") {
    throw new Error("Homey is niet verbonden.");
  }

  const devices = await api.devices.getDevices();
  const results = await Promise.all(deviceIds.map(async (id) => {
    const device = (devices as Record<string, unknown>)[id] as Record<string, unknown> | undefined;
    if (!device) return { id, error: "Apparaat niet gevonden" };

    const capabilities = Array.isArray(device.capabilities) ? device.capabilities as string[] : [];
    const weatherCapabilities = new Set([
      "forecast_time",
      "description",
      "measure_temperature",
      "measure_temperature_feelslike",
      "measure_temperature_min",
      "measure_temperature_max",
      "measure_humidity",
      "measure_pressure",
      "measure_cloudiness",
      "measure_visibility",
      "measure_wind_combined",
      "measure_wind_strength",
      "measure_rain",
      "measure_snow",
      "sunrise",
      "sunset",
      "conditioncode",
      "conditioncode_detail",
      "conditioncode_text",
      "measure_wind_angle",
      "measure_wind_direction_string",
      "measure_windstrength_beaufort",
    ]);
    const isWeatherDevice = id === "c7e68c38-1588-4c93-9db8-e854f4d251ab";
    const selectedCapabilities = capabilities.filter((capability) =>
      isWeatherDevice
        ? weatherCapabilities.has(capability)
        : capability === "measure_temperature" || capability === "measure_temperature_feelslike"
    );

    const readings = await Promise.all(selectedCapabilities.map(async (capabilityId) => {
      try {
        const value = await api!.devices.getCapabilityValue({ deviceId: id, capabilityId });
        return { capabilityId, value };
      } catch {
        return { capabilityId, value: null };
      }
    }));

    return {
      id,
      name: device.name,
      zone: device.zone,
      available: device.available,
      readings,
    };
  }));

  return { retrievedAt: new Date().toISOString(), devices: results };
}


export async function getHomeyLogicVariables(variableNames: string[]) {
  if (!api || snapshot.state !== "online") {
    await connectHomey();
  }

  if (!api || snapshot.state !== "online") {
    throw new Error("Homey is niet verbonden.");
  }

  const variables = await api.logic.getVariables();
  const wanted = new Set(variableNames);
  type HomeyLogicVariable = {
    id: string;
    name: string;
    type: string;
    value: unknown;
  };
  const variableList = Object.values(
    variables as Record<string, HomeyLogicVariable>
  );

  return {
    retrievedAt: new Date().toISOString(),
    variables: variableList
      .filter((variable) => wanted.has(variable.name))
      .map((variable) => ({
        id: variable.id,
        name: variable.name,
        type: variable.type,
        value: variable.value,
      })),
  };
}


export async function getHomeyDeviceCapabilityValues(
  sources: Array<{ deviceId: string; capabilityId: string }>
) {
  if (!api || snapshot.state !== "online") {
    await connectHomey();
  }

  if (!api || snapshot.state !== "online") {
    throw new Error("Homey is niet verbonden.");
  }

  const devices = await api.devices.getDevices();
  return {
    retrievedAt: new Date().toISOString(),
    readings: await Promise.all(sources.map(async ({ deviceId, capabilityId }) => {
      const device = (devices as Record<string, any>)[deviceId];
      if (!device) return { deviceId, capabilityId, available: false, error: "device_missing" };
      if (device.available === false) return { deviceId, capabilityId, available: false, error: "device_unavailable" };
      if (!Array.isArray(device.capabilities) || !device.capabilities.includes(capabilityId)) {
        return { deviceId, capabilityId, available: device.available !== false, error: "capability_missing" };
      }
      try {
        const value = await api!.devices.getCapabilityValue({ deviceId, capabilityId });
        return { deviceId, capabilityId, available: device.available !== false, value };
      } catch {
        return { deviceId, capabilityId, available: device.available !== false, error: "value_unavailable" };
      }
    })),
  };
}

export async function getHomeyLanguage(): Promise<string | null> {
  if (!api || snapshot.state !== "online") return null;
  try {
    const result = await api.i18n.getOptionLanguage() as unknown;
    if (typeof result === "string") return result;
    if (result && typeof result === "object") {
      const value = (result as { value?: unknown; language?: unknown }).value ?? (result as { language?: unknown }).language;
      return typeof value === "string" ? value : null;
    }
    return null;
  } catch (error) {
    console.warn("Homey-taal kon niet worden uitgelezen; controleer homey.system.readonly", error);
    return null;
  }
}


export async function getQuickActionCatalog() {
  if (!api || snapshot.state !== "online") await connectHomey();
  if (!api || snapshot.state !== "online") throw new Error("Homey is niet verbonden.");

  // Fetch each Homey manager independently. A failure in Advanced Flow must
  // not hide standard Flows and devices (and vice versa).
  const [devicesResult, flowsResult, advancedFlowsResult] = await Promise.allSettled([
    api.devices.getDevices(),
    api.flow.getFlows(),
    api.flow.getAdvancedFlows(),
  ]);
  const warnings: string[] = [];
  const devices = devicesResult.status === "fulfilled" ? devicesResult.value : {};
  const flows = flowsResult.status === "fulfilled" ? flowsResult.value : {};
  const advancedFlows = advancedFlowsResult.status === "fulfilled" ? advancedFlowsResult.value : {};

  if (devicesResult.status === "rejected") {
    warnings.push("Homey-apparaten konden niet worden opgehaald: " + (devicesResult.reason instanceof Error ? devicesResult.reason.message : String(devicesResult.reason)));
  }
  if (flowsResult.status === "rejected") {
    warnings.push("Homey-Flows konden niet worden opgehaald: " + (flowsResult.reason instanceof Error ? flowsResult.reason.message : String(flowsResult.reason)));
  }
  if (advancedFlowsResult.status === "rejected") {
    warnings.push("Advanced Flows konden niet worden opgehaald: " + (advancedFlowsResult.reason instanceof Error ? advancedFlowsResult.reason.message : String(advancedFlowsResult.reason)));
  }

  const deviceList = Object.values(devices as Record<string, any>).map((device: any) => {
    const capabilities = Array.isArray(device.capabilities) ? device.capabilities as string[] : [];
    const capabilityList = capabilities.flatMap((id) => {
      const descriptor = device.capabilitiesObj?.[id] as Record<string, any> | undefined;
      if (!descriptor || descriptor.setable !== true) return [];
      const type = typeof descriptor.type === "string" ? descriptor.type : "unknown";
      if (!["boolean", "number", "string", "enum"].includes(type)) return [];
      let value: unknown = null;
      try { value = device.capabilitiesObj?.[id]?.value ?? null; } catch { /* current value is optional */ }
      return [{
        id, title: typeof descriptor.title === "string" ? descriptor.title : id,
        type, min: typeof descriptor.min === "number" ? descriptor.min : null,
        max: typeof descriptor.max === "number" ? descriptor.max : null,
        step: typeof descriptor.step === "number" ? descriptor.step : null,
        units: typeof descriptor.units === "string" ? descriptor.units : "",
        values: Array.isArray(descriptor.values) ? descriptor.values.map((item: any) => ({
          id: String(item.id ?? item.value ?? ""), title: String(item.title ?? item.label ?? item.id ?? item.value ?? ""),
        })) : [],
        value,
      }];
    });
    return { id: String(device.id), name: String(device.name ?? "Onbekend apparaat"), zone: String(device.zone ?? ""), available: device.available !== false, capabilities: capabilityList };
  }).filter((device) => device.capabilities.length > 0);

  const flowList = [
    ...Object.values(flows as Record<string, any>).map((flow: any) => ({ id: String(flow.id), name: String(flow.name ?? "Naamloze Flow"), type: "standard" as const, enabled: flow.enabled !== false, icon: typeof flow.icon === "string" && flow.icon.length <= 8 ? flow.icon : undefined })),
    ...Object.values(advancedFlows as Record<string, any>).map((flow: any) => ({ id: String(flow.id), name: String(flow.name ?? "Naamloze Advanced Flow"), type: "advanced" as const, enabled: flow.enabled !== false, icon: typeof flow.icon === "string" && flow.icon.length <= 8 ? flow.icon : undefined })),
  ].filter((flow) => flow.enabled).sort((a, b) => a.name.localeCompare(b.name));

  return { retrievedAt: new Date().toISOString(), devices: deviceList, flows: flowList, warnings };
}

export async function getQuickActionStatuses(actions: Array<{ id: string; type: "flow" | "device"; deviceId: string; capabilityId: string }>): Promise<Record<string, boolean | null>> {
  if (!api || snapshot.state !== "online") await connectHomey();
  if (!api || snapshot.state !== "online") throw new Error("Homey is niet verbonden.");
  const devices = await api.devices.getDevices() as Record<string, any>;
  const statuses: Record<string, boolean | null> = {};
  for (const action of actions) {
    if (action.type !== "device" || !action.deviceId || !action.capabilityId) continue;
    const device = devices[action.deviceId];
    if (!device || device.available === false || !Array.isArray(device.capabilities) || !device.capabilities.includes(action.capabilityId)) {
      statuses[action.id] = null;
      continue;
    }
    const descriptor = device.capabilitiesObj?.[action.capabilityId] as Record<string, any> | undefined;
    statuses[action.id] = descriptor?.type === "boolean" && typeof descriptor.value === "boolean" ? descriptor.value : null;
  }
  return statuses;
}

export async function executeQuickAction(input: {
  type: "flow" | "device"; flowId?: string; flowType?: "standard" | "advanced";
  deviceId?: string; capabilityId?: string; value?: unknown; booleanMode?: "on" | "off" | "toggle";
}) {
  if (!api || snapshot.state !== "online") await connectHomey();
  if (!api || snapshot.state !== "online") throw new Error("Homey is niet verbonden.");
  if (input.type === "flow") {
    if (!input.flowId || (input.flowType !== "standard" && input.flowType !== "advanced")) throw new Error("Flow-configuratie ontbreekt.");
    if (input.flowType === "standard") {
      const flows = await api.flow.getFlows() as Record<string, any>;
      if (!flows[input.flowId] || flows[input.flowId].enabled === false) throw new Error("De geselecteerde Flow bestaat niet of is uitgeschakeld.");
      await api.flow.triggerFlow({ id: input.flowId });
    } else {
      const flows = await api.flow.getAdvancedFlows() as Record<string, any>;
      if (!flows[input.flowId] || flows[input.flowId].enabled === false) throw new Error("De geselecteerde Advanced Flow bestaat niet of is uitgeschakeld.");
      await api.flow.triggerAdvancedFlow({ id: input.flowId });
    }
    return { executed: true, type: "flow" };
  }
  if (input.type !== "device" || !input.deviceId || !input.capabilityId) throw new Error("Apparaatconfiguratie ontbreekt.");
  const devices = await api.devices.getDevices() as Record<string, any>;
  const device = devices[input.deviceId];
  if (!device) throw new Error("Het geselecteerde apparaat bestaat niet meer.");
  if (device.available === false) throw new Error("Het geselecteerde apparaat is niet beschikbaar.");
  if (!Array.isArray(device.capabilities) || !device.capabilities.includes(input.capabilityId)) throw new Error("De geselecteerde capability wordt niet meer ondersteund.");
  const descriptor = device.capabilitiesObj?.[input.capabilityId] as Record<string, any> | undefined;
  if (!descriptor || descriptor.setable !== true) throw new Error("Deze capability is niet wijzigbaar.");
  const type = descriptor.type;
  let value = input.value;
  if (type === "boolean") {
    if (input.booleanMode === "toggle") {
      const currentValue = descriptor.value;
      if (typeof currentValue !== "boolean") throw new Error("De actuele aan/uit-status van Homey is onbekend; Toggle is niet uitgevoerd.");
      value = !currentValue;
    } else if (input.booleanMode === "on") value = true;
    else if (input.booleanMode === "off") value = false;
    else if (typeof value !== "boolean") throw new Error("Deze actie verwacht een aan/uit-waarde.");
  }
  if (type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Ongeldige numerieke waarde.");
    if (typeof descriptor.min === "number" && value < descriptor.min) throw new Error("Waarde ligt onder het toegestane minimum.");
    if (typeof descriptor.max === "number" && value > descriptor.max) throw new Error("Waarde ligt boven het toegestane maximum.");
  }
  if (type === "enum") {
    const allowed = Array.isArray(descriptor.values) ? descriptor.values.map((item: any) => String(item.id ?? item.value ?? "")) : [];
    if (typeof value !== "string" || !allowed.includes(value)) throw new Error("Ongeldige keuze voor deze capability.");
  }
  if (type === "string" && typeof value !== "string") throw new Error("Deze actie verwacht tekst.");
  if (!["boolean", "number", "enum", "string"].includes(type)) throw new Error("Dit type apparaatbediening wordt niet ondersteund.");
  await (device as any).setCapabilityValue({ capabilityId: input.capabilityId, value });
  return { executed: true, type: "device", value };
}
