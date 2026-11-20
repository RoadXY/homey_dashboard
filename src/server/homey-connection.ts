import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createConnection } from "node:net";
import { HomeyAPI } from "homey-api";
import dgram from "node:dgram";

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
  await chmod(configFile, 0o600);
  return { address, tokenConfigured: Boolean(token) };
}

function normalizeAddress(address: string): { host: string; port: number } {
  const isHttps = address.trim().startsWith("https://");
  const stripped = address.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const [host, portText] = stripped.split(":");
  return { host, port: portText ? Number(portText) : isHttps ? 443 : 80 };
}

async function checkTcp(host: string, port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = createConnection({ host, port });
    const timer = setTimeout(() => { socket.destroy(); reject(new Error("timeout")); }, 3500);
    socket.once("connect", () => { clearTimeout(timer); socket.destroy(); resolve(); });
    socket.once("error", error => { clearTimeout(timer); reject(error); });
  });
}

export async function testHomeyConnection(input: unknown): Promise<{ status: "success" | "warning" | "failed"; errorKey?: string }> {
  if (!input || typeof input !== "object") return { status: "failed", errorKey: "homeyConnection.fillFields" };
  const value = input as { address?: unknown; token?: unknown };
  if (typeof value.address !== "string" || !value.address.trim() || typeof value.token !== "string" || !value.token.trim()) {
    return { status: "failed", errorKey: "homeyConnection.fillFields" };
  }
  const { host, port } = normalizeAddress(value.address);
  try { await checkTcp(host, port); }
  catch { return { status: "failed", errorKey: "homeyConnection.networkFailed" }; }
  try {
    const api = await HomeyAPI.createLocalAPI({ address: value.address.trim(), token: value.token.trim(), debug: null });
    await api.devices.getDevices();
    return { status: "success" };
  } catch {
    return { status: "warning", errorKey: "homeyConnection.authFailed" };
  }
}

type MdnsRecord = { name: string; type: number; packet: Buffer; dataOffset: number; dataLength: number };

function readDnsName(packet: Buffer, offset: number): { name: string; nextOffset: number } {
  const labels: string[] = [];
  let cursor = offset;
  let nextOffset = -1;
  let jumps = 0;
  while (cursor < packet.length && jumps++ < 32) {
    const length = packet[cursor];
    if (length === 0) {
      cursor += 1;
      if (nextOffset < 0) nextOffset = cursor;
      break;
    }
    if ((length & 0xc0) === 0xc0) {
      if (cursor + 1 >= packet.length) throw new Error("Invalid DNS compression pointer");
      const pointer = ((length & 0x3f) << 8) | packet[cursor + 1];
      if (nextOffset < 0) nextOffset = cursor + 2;
      cursor = pointer;
      continue;
    }
    if ((length & 0xc0) !== 0 || cursor + 1 + length > packet.length) throw new Error("Invalid DNS label");
    labels.push(packet.toString("utf8", cursor + 1, cursor + 1 + length));
    cursor += length + 1;
  }
  if (nextOffset < 0) throw new Error("Incomplete DNS name");
  return { name: labels.join("."), nextOffset };
}

function parseMdnsRecords(packet: Buffer): MdnsRecord[] {
  if (packet.length < 12) return [];
  const questions = packet.readUInt16BE(4);
  const total = packet.readUInt16BE(6) + packet.readUInt16BE(8) + packet.readUInt16BE(10);
  let offset = 12;
  for (let i = 0; i < questions; i++) {
    const name = readDnsName(packet, offset);
    offset = name.nextOffset + 4;
  }
  const records: MdnsRecord[] = [];
  for (let i = 0; i < total && offset + 10 <= packet.length; i++) {
    const owner = readDnsName(packet, offset);
    offset = owner.nextOffset;
    const type = packet.readUInt16BE(offset);
    const dataLength = packet.readUInt16BE(offset + 8);
    offset += 10;
    if (offset + dataLength > packet.length) break;
    records.push({ name: owner.name.toLowerCase(), type, packet, dataOffset: offset, dataLength });
    offset += dataLength;
  }
  return records;
}

function encodeMdnsQuery(serviceType: string): Buffer {
  const labels = serviceType.split(".");
  const question = Buffer.concat([
    ...labels.map(label => Buffer.concat([Buffer.from([Buffer.byteLength(label)]), Buffer.from(label)])),
    Buffer.from([0, 0, 12, 0, 1]),
  ]);
  const header = Buffer.alloc(12);
  header.writeUInt16BE(1, 4);
  return Buffer.concat([header, question]);
}

export async function discoverHomeys(): Promise<Array<{ name: string; address: string }>> {
  const serviceType = "_homey._tcp.local";
  return new Promise(resolve => {
    const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    const ptrTargets = new Set<string>();
    const services = new Map<string, { host: string; port: number }>();
    const addresses = new Map<string, string>();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try { socket.close(); } catch { /* socket may already be closed */ }
      const results: Array<{ name: string; address: string }> = [];
      for (const instance of ptrTargets) {
        const service = services.get(instance);
        if (!service) continue;
        const address = addresses.get(service.host);
        if (!address) continue;
        results.push({
          name: instance.replace(new RegExp("\\._homey\\._tcp\\.local\\.?$", "i"), ""),
          address,
        });
      }
      resolve(results);
    };
    const timer = setTimeout(finish, 3000);
    socket.on("error", finish);
    socket.on("message", packet => {
      try {
        for (const record of parseMdnsRecords(packet)) {
          if (record.type === 12) {
            const target = readDnsName(record.packet, record.dataOffset).name.toLowerCase();
            if (record.name === serviceType) ptrTargets.add(target);
          } else if (record.type === 33 && record.dataLength >= 7) {
            const target = readDnsName(record.packet, record.dataOffset + 6).name.toLowerCase();
            services.set(record.name, { host: target, port: record.packet.readUInt16BE(record.dataOffset + 4) });
          } else if (record.type === 1 && record.dataLength === 4) {
            addresses.set(record.name, [...record.packet.subarray(record.dataOffset, record.dataOffset + 4)].join("."));
          }
        }
      } catch { /* Ignore malformed or unrelated multicast packets. */ }
    });
    socket.bind(5353, "0.0.0.0", () => {
      try {
        socket.addMembership("224.0.0.251");
        socket.setMulticastTTL(255);
        socket.send(encodeMdnsQuery(serviceType), 5353, "224.0.0.251");
      } catch { finish(); }
    });
  });
}
