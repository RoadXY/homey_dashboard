import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createConnection } from "node:net";
import { HomeyAPI } from "homey-api";
import { resolveSrv, resolve4 } from "node:dns/promises";

export type HomeyConnectionConfig = { address: string; token: string };
export type HomeyConnectionPublic = { address: string; tokenConfigured: boolean };
const configFile = join(process.env.DATA_DIR ?? join(process.cwd(), "data"), "homey-connection.json");

export async function readHomeyConnectionConfig(): Promise<HomeyConnectionConfig> {
  try {
    const value = JSON.parse(await readFile(configFile, "utf8")) as Partial<HomeyConnectionConfig>;
    return { address: typeof value.address === "string" ? value.address : "", token: typeof value.token === "string" ? value.token : "" };
  } catch { return { address: "", token: "" }; }
}

export async function readHomeyConnectionPublic(): Promise<HomeyConnectionPublic> {
  const config = await readHomeyConnectionConfig();
  return { address: config.address, tokenConfigured: Boolean(config.token) };
}

export async function saveHomeyConnectionConfig(input: unknown): Promise<HomeyConnectionPublic> {
  if (!input || typeof input !== "object") throw new Error("Ongeldige Homey-configuratie.");
  const value = input as { address?: unknown; token?: unknown };
  if (typeof value.address !== "string" || value.address.trim().length > 255) throw new Error("Ongeldig Homey-IP-adres.");
  if (value.token !== undefined && typeof value.token !== "string") throw new Error("Ongeldig API-token.");
  const current = await readHomeyConnectionConfig();
  const address = value.address.trim();
  const token = typeof value.token === "string" && value.token.trim() ? value.token.trim() : current.token;
  if (address && !/^(https?:\/\/)?[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(address)) throw new Error("Vul een geldig IP-adres of hostnaam in.");
  await mkdir(dirname(configFile), { recursive: true });
  await writeFile(configFile, JSON.stringify({ address, token }, null, 2) + "\n", { mode: 0o600 });
  return { address, tokenConfigured: Boolean(token) };
}

function normalizeAddress(address: string): { host: string; port: number } {
  const stripped = address.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const [host, portText] = stripped.split(":");
  return { host, port: portText ? Number(portText) : 443 };
}

async function checkTcp(host: string, port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = createConnection({ host, port });
    const timer = setTimeout(() => { socket.destroy(); reject(new Error("timeout")); }, 3500);
    socket.once("connect", () => { clearTimeout(timer); socket.destroy(); resolve(); });
    socket.once("error", error => { clearTimeout(timer); reject(error); });
  });
}

export async function testHomeyConnection(input: unknown): Promise<{ status: "success" | "warning" | "failed"; error?: string }> {
  if (!input || typeof input !== "object") return { status: "failed", error: "Vul een Homey-adres en API-token in." };
  const value = input as { address?: unknown; token?: unknown };
  if (typeof value.address !== "string" || !value.address.trim() || typeof value.token !== "string" || !value.token.trim()) {
    return { status: "failed", error: "Vul een Homey-adres en API-token in." };
  }
  const { host, port } = normalizeAddress(value.address);
  try { await checkTcp(host, port); }
  catch { return { status: "failed", error: "Het Homey-netwerkendpoint is niet bereikbaar." }; }
  try {
    const api = await HomeyAPI.createLocalAPI({ address: value.address.trim(), token: value.token.trim(), debug: null });
    await api.devices.getDevices();
    return { status: "success" };
  } catch {
    return { status: "warning", error: "Homey is bereikbaar, maar de API-token-authenticatie is mislukt." };
  }
}

export async function discoverHomeys(): Promise<Array<{ name: string; address: string }>> {
  try {
    const services = await resolveSrv("_homey._tcp.local");
    const results = await Promise.all(services.map(async service => {
      const addresses = await resolve4(service.name).catch(() => [] as string[]);
      return addresses.map(address => ({ name: service.name.replace(/\._homey\._tcp\.local\.?$/i, ""), address }));
    }));
    return results.flat();
  } catch { return []; }
}
