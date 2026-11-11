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
    const temperatureCapabilities = capabilities.filter((capability) =>
      capability === "measure_temperature" ||
      capability === "measure_temperature_feelslike"
    );

    const readings = await Promise.all(temperatureCapabilities.map(async (capabilityId) => {
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
