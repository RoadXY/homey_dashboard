import { HomeyAPI } from "homey-api";

type HomeyConnectionState = "not-connected" | "connecting" | "online" | "offline";

type HomeySnapshot = {
  state: HomeyConnectionState;
  checkedAt: string | null;
  error: string | null;
  deviceCount: number | null;
  zoneCount: number | null;
};

let api: Awaited<ReturnType<typeof HomeyAPI.createLocalAPI>> | null = null;
let snapshot: HomeySnapshot = {
  state: "not-connected",
  checkedAt: null,
  error: null,
  deviceCount: null,
  zoneCount: null,
};

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
    api = await HomeyAPI.createLocalAPI({ address, token });
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
  return {
    retrievedAt: new Date().toISOString(),
    variables: Object.values(variables)
      .filter((variable) => wanted.has(variable.name))
      .map((variable) => ({
        id: variable.id,
        name: variable.name,
        type: variable.type,
        value: variable.value,
      })),
  };
}
