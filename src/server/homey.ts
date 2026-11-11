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
  "c7e68c38-1588-4c93-9db8-e854f4d251ab",
];

async function setupRealtimeSubscriptions(): Promise<void> {
  if (!api || realtimeSetupFor === api) return;
  const currentApi = api;
  await Promise.all([currentApi.devices.connect(), currentApi.logic.connect()]);
  const devices = await currentApi.devices.getDevices();
  let subscriptions = 0;

  for (const deviceId of dashboardDeviceIds) {
    const device = (devices as Record<string, any>)[deviceId];
    if (!device || !Array.isArray(device.capabilities)) continue;
    for (const capabilityId of device.capabilities as string[]) {
      try {
        device.makeCapabilityInstance(capabilityId, (value: unknown) => {
          homeyRealtime.emit("update", {
            source: "device",
            deviceId,
            capabilityId,
            value,
            changedAt: new Date().toISOString(),
          });
        });
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
  logicManager.on("variable.update", (variable) => {
    homeyRealtime.emit("update", {
      source: "logic",
      variableId: variable.id,
      variableName: variable.name,
      value: variable.value,
      changedAt: new Date().toISOString(),
    });
  });
  logicManager.on("variable.create", (variable) => {
    homeyRealtime.emit("update", { source: "logic", variableName: variable.name, changedAt: new Date().toISOString() });
  });
  logicManager.on("variable.delete", (variable) => {
    homeyRealtime.emit("update", { source: "logic", variableName: variable.name, changedAt: new Date().toISOString() });
  });

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

export async function connectHomey(): Promise<HomeySnapshot> {
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
