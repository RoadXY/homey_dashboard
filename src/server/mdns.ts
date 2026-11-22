import { randomInt, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import dgram, { type RemoteInfo, type Socket } from "node:dgram";

export const MDNS_SERVICE_TYPE = "_homey-dashboard._tcp.local.";
export const MDNS_ENUMERATION_TYPE = "_services._dns-sd._udp.local.";
export const MDNS_MULTICAST_ADDRESS = "224.0.0.251";
export const MDNS_PORT = 5353;
const INSTANCE_PREFIX = "Homey Dashboard - ";
const IDENTITY_FILE = "installation.json";
const RECORD_TTL_SECONDS = 120;

const adjectives = [
  "Aardige", "Blije", "Blauwe", "Brave", "Dappere", "Frisse", "Gouden",
  "Handige", "Heldere", "Kleine", "Lieve", "Slimme",
  "Snelle", "Sterke", "Vrolijke", "Wijze", "Zachte", "Zonnige",
] as const;
const nouns = [
  "Adelaar", "Beer", "Dolfijn", "Eekhoorn", "Egel", "Havik", "Hert",
  "Kat", "Kikker", "Koala", "Leeuw", "Panda", "Pinguïn", "Uil", "Vos",
  "Wolf", "Zwaluw",
] as const;

export type InstallationIdentity = { id: string; name: string };

export function generateInstallationName(): string {
  return `${adjectives[randomInt(adjectives.length)]} ${nouns[randomInt(nouns.length)]}`;
}

export function isValidInstallationName(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0
    && Buffer.byteLength(INSTANCE_PREFIX + normalized + " [12345678]", "utf8") <= 63
    && /^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u.test(normalized);
}

export async function createOrLoadInstallationIdentity(
  dataDirectory: string,
  configuredName?: string,
): Promise<InstallationIdentity> {
  await mkdir(dataDirectory, { recursive: true });
  const identityPath = join(dataDirectory, IDENTITY_FILE);
  let identity: InstallationIdentity | undefined;

  if (existsSync(identityPath)) {
    try {
      const parsed = JSON.parse(await readFile(identityPath, "utf8")) as Partial<InstallationIdentity>;
      if (typeof parsed.id === "string" && /^[0-9a-f-]{36}$/i.test(parsed.id)
        && isValidInstallationName(parsed.name)) {
        identity = { id: parsed.id, name: parsed.name.trim().replace(/\s+/g, " ") };
      }
    } catch {
      // A missing or invalid identity is initialized below.
    }
  }

  const requestedName = configuredName?.trim();
  if (requestedName && !isValidInstallationName(requestedName)) {
    throw new Error("Installation name must be valid and fit the Homey Dashboard DNS-SD label limit.");
  }

  const next: InstallationIdentity = {
    id: identity?.id ?? randomUUID(),
    name: requestedName ? requestedName.replace(/\s+/g, " ") : identity?.name ?? generateInstallationName(),
  };

  if (!identity || identity.id !== next.id || identity.name !== next.name) {
    const temporaryPath = `${identityPath}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(next, null, 2) + "\n", { mode: 0o600 });
    await rename(temporaryPath, identityPath);
  }
  return next;
}

function encodeName(name: string): Buffer {
  const labels = name.replace(/\.$/, "").split(".");
  const chunks: Buffer[] = [];
  for (const label of labels) {
    const bytes = Buffer.from(label, "utf8");
    if (bytes.length > 63) throw new Error(`mDNS DNS label is too long: ${label}`);
    chunks.push(Buffer.from([bytes.length]), bytes);
  }
  chunks.push(Buffer.from([0]));
  return Buffer.concat(chunks);
}

function uint16(value: number): Buffer {
  const result = Buffer.alloc(2);
  result.writeUInt16BE(value);
  return result;
}

function uint32(value: number): Buffer {
  const result = Buffer.alloc(4);
  result.writeUInt32BE(value);
  return result;
}

type DnsRecord = { name: string; type: number; data: Buffer; cacheFlush?: boolean; ttl?: number };

function encodeRecord(record: DnsRecord): Buffer {
  const recordClass = record.cacheFlush === false ? 1 : 0x8001;
  return Buffer.concat([
    encodeName(record.name),
    uint16(record.type),
    uint16(recordClass),
    uint32(record.ttl ?? RECORD_TTL_SECONDS),
    uint16(record.data.length),
    record.data,
  ]);
}

function encodeTxt(values: string[]): Buffer {
  const chunks = values.map((value) => {
    const bytes = Buffer.from(value, "utf8");
    if (bytes.length > 255) throw new Error("mDNS TXT string exceeds 255 bytes.");
    return Buffer.concat([Buffer.from([bytes.length]), bytes]);
  });
  return Buffer.concat(chunks);
}

function getAdvertisedAddresses(): string[] {
  const addresses: string[] = [];
  for (const [interfaceName, entries] of Object.entries(networkInterfaces())) {
    if (/^(lo|docker|br-|veth)/i.test(interfaceName)) continue;
    for (const entry of entries ?? []) {
      if (entry.family !== "IPv4" || entry.internal || entry.address.startsWith("169.254.")) continue;
      addresses.push(entry.address);
    }
  }
  return [...new Set(addresses)];
}

function ipv4Data(address: string): Buffer {
  return Buffer.from(address.split(".").map((part) => Number(part)));
}

function readDnsName(packet: Buffer, start: number): { name: string; nextOffset: number } | undefined {
  const labels: string[] = [];
  let offset = start;
  let nextOffset = -1;
  let jumps = 0;
  while (offset < packet.length && jumps++ < 128) {
    const length = packet[offset]!;
    if ((length & 0xc0) === 0xc0) {
      if (offset + 1 >= packet.length) return undefined;
      const pointer = ((length & 0x3f) << 8) | packet[offset + 1]!;
      if (nextOffset === -1) nextOffset = offset + 2;
      offset = pointer;
      continue;
    }
    offset++;
    if (length === 0) {
      return { name: labels.join(".").toLowerCase() + ".", nextOffset: nextOffset === -1 ? offset : nextOffset };
    }
    if (length > 63 || offset + length > packet.length) return undefined;
    labels.push(packet.toString("utf8", offset, offset + length));
    offset += length;
  }
  return undefined;
}

function readQuestions(packet: Buffer): Array<{ name: string; type: number }> {
  if (packet.length < 12) return [];
  const count = packet.readUInt16BE(4);
  const questions: Array<{ name: string; type: number }> = [];
  let offset = 12;
  for (let index = 0; index < count; index++) {
    const parsed = readDnsName(packet, offset);
    if (!parsed || parsed.nextOffset + 4 > packet.length) return [];
    const type = packet.readUInt16BE(parsed.nextOffset);
    questions.push({ name: parsed.name, type });
    offset = parsed.nextOffset + 4;
  }
  return questions;
}

export function buildMdnsRecords(identity: InstallationIdentity, port: number) {
  const displayName = INSTANCE_PREFIX + identity.name;
  // A short stable ID suffix makes the DNS-SD instance label collision-resistant;
  // clients should show the clean TXT name to users.
  const instanceName = displayName + " [" + identity.id.slice(0, 8) + "]";
  const instanceFqdn = instanceName + "." + MDNS_SERVICE_TYPE;
  // Use a stable, installation-specific target instead of the Docker hostname.
  // Container hostnames can change on recreation and are not guaranteed to be
  // resolvable through mDNS. The matching A records below publish this target
  // directly on every eligible host-network IPv4 interface.
  const hostLabel = "homey-dashboard-" + identity.id.slice(0, 8);
  const hostName = hostLabel + ".local.";
  const srvData = Buffer.concat([uint16(0), uint16(0), uint16(port), encodeName(hostName)]);
  const addresses = getAdvertisedAddresses();
  return {
    instanceName,
    instanceFqdn,
    hostName,
    enumeration: { name: MDNS_ENUMERATION_TYPE, type: 12, data: encodeName(MDNS_SERVICE_TYPE), cacheFlush: false } satisfies DnsRecord,
    ptr: { name: MDNS_SERVICE_TYPE, type: 12, data: encodeName(instanceFqdn), cacheFlush: false } satisfies DnsRecord,
    srv: { name: instanceFqdn, type: 33, data: srvData } satisfies DnsRecord,
    txt: {
      name: instanceFqdn,
      type: 16,
      data: encodeTxt([
        "version=1",
        "api=/api",
        `id=${identity.id}`,
        `name=${displayName}`,
      ]),
    } satisfies DnsRecord,
    addresses: addresses.map((address) => ({
      name: hostName,
      type: 1,
      data: ipv4Data(address),
    } satisfies DnsRecord)),
  };
}

function buildResponse(answers: DnsRecord[], additionals: DnsRecord[]): Buffer {
  const header = Buffer.alloc(12);
  header.writeUInt16BE(0, 0);
  header.writeUInt16BE(0x8400, 2);
  header.writeUInt16BE(0, 4);
  header.writeUInt16BE(answers.length, 6);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(additionals.length, 10);
  return Buffer.concat([
    header,
    ...answers.map(encodeRecord),
    ...additionals.map(encodeRecord),
  ]);
}

function responseForQuestions(
  questions: Array<{ name: string; type: number }>,
  records: ReturnType<typeof buildMdnsRecords>,
): Buffer | undefined {
  const answers: DnsRecord[] = [];
  const additionals: DnsRecord[] = [];
  const add = (target: DnsRecord[], record: DnsRecord) => {
    if (!target.some((item) => item.name === record.name && item.type === record.type)) target.push(record);
  };

  for (const question of questions) {
    if (question.name === MDNS_ENUMERATION_TYPE && (question.type === 12 || question.type === 255)) {
      add(answers, records.enumeration);
    } else if (question.name === MDNS_SERVICE_TYPE && (question.type === 12 || question.type === 255)) {
      add(answers, records.ptr);
      add(additionals, records.srv);
      add(additionals, records.txt);
      records.addresses.forEach((record) => add(additionals, record));
    } else if (question.name === records.instanceFqdn.toLowerCase() && (question.type === 33 || question.type === 255)) {
      add(answers, records.srv);
      add(additionals, records.txt);
      records.addresses.forEach((record) => add(additionals, record));
    } else if (question.name === records.instanceFqdn.toLowerCase() && question.type === 16) {
      add(answers, records.txt);
    } else if (question.name === records.hostName.toLowerCase() && (question.type === 1 || question.type === 255)) {
      records.addresses.forEach((record) => add(answers, record));
    }
  }
  if (answers.length === 0) return undefined;
  return buildResponse(answers, additionals);
}

export type MdnsLogger = {
  info?: (data: unknown, message?: string) => void;
  warn?: (data: unknown, message?: string) => void;
};

export async function startMdnsDiscovery(options: {
  dataDirectory: string;
  port: number;
  configuredName?: string;
  enabled?: boolean;
  logger?: MdnsLogger;
}): Promise<{ identity: InstallationIdentity; close: () => Promise<void> }> {
  const identity = await createOrLoadInstallationIdentity(options.dataDirectory, options.configuredName);
  if (options.enabled === false) {
    options.logger?.info?.({ instanceName: INSTANCE_PREFIX + identity.name }, "mDNS discovery is disabled.");
    return { identity, close: async () => undefined };
  }

  const records = buildMdnsRecords(identity, options.port);
  if (records.addresses.length === 0) {
    options.logger?.warn?.({}, "mDNS discovery could not start: no suitable IPv4 address was found.");
    return { identity, close: async () => undefined };
  }

  let socket: Socket;
  try {
    socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    socket.on("error", (error) => {
      options.logger?.warn?.({ err: error }, "mDNS discovery socket error.");
      try { socket.close(); } catch { /* Socket may already be closed. */ }
    });
    socket.on("message", (packet, remote: RemoteInfo) => {
      if (packet.length < 12 || (packet.readUInt16BE(2) & 0x8000) !== 0) return;
      const response = responseForQuestions(readQuestions(packet), records);
      if (response) {
        // Answer directly to the requester; this also avoids sending a response
        // through an unrelated default route on multi-interface Ubuntu hosts.
        socket.send(response, remote.port, remote.address);
      }
    });
    await new Promise<void>((resolve, reject) => {
      socket.once("error", reject);
      socket.bind(MDNS_PORT, "0.0.0.0", () => {
        socket.removeListener("error", reject);
        try {
          const interfaces = getAdvertisedAddresses();
          if (interfaces.length === 0) throw new Error("No suitable IPv4 interface is available for mDNS.");
          for (const address of interfaces) socket.addMembership(MDNS_MULTICAST_ADDRESS, address);
          socket.setMulticastTTL(255);
          socket.setMulticastLoopback(true);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    options.logger?.warn?.({ err: error }, "mDNS discovery could not bind UDP port 5353; dashboard will continue without discovery.");
    return { identity, close: async () => undefined };
  }

  const announcement = buildResponse([records.enumeration, records.ptr], [records.srv, records.txt, ...records.addresses]);
  const announce = () => {
    for (const address of getAdvertisedAddresses()) {
      try {
        socket.setMulticastInterface(address);
        socket.send(announcement, MDNS_PORT, MDNS_MULTICAST_ADDRESS);
      } catch (error) {
        options.logger?.warn?.({ err: error, interfaceAddress: address }, "mDNS announcement failed on network interface.");
      }
    }
  };
  announce();
  const secondAnnouncement = setTimeout(announce, 1000);
  const refreshAnnouncement = setInterval(announce, 60_000);
  options.logger?.info?.({
    serviceType: MDNS_SERVICE_TYPE,
    instanceName: records.instanceName,
    port: options.port,
    installationId: identity.id,
  }, "mDNS service discovery is active.");

  let socketClosed = false;
  const closeSocket = () => new Promise<void>((resolve) => {
    if (socketClosed) {
      resolve();
      return;
    }
    socketClosed = true;
    clearTimeout(secondAnnouncement);
    clearInterval(refreshAnnouncement);

    // Withdraw the old instance before releasing UDP/5353 so browsers discard
    // cached PTR/SRV/TXT/A records before the renamed service is announced.
    const goodbyeRecords: DnsRecord[] = [
      { ...records.ptr, ttl: 0 },
      { ...records.srv, ttl: 0 },
      { ...records.txt, ttl: 0 },
      ...records.addresses.map(record => ({ ...record, ttl: 0 })),
    ];
    const goodbye = buildResponse(goodbyeRecords, []);
    const addresses = getAdvertisedAddresses();
    let pending = addresses.length;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(fallback);
      try { socket.close(() => resolve()); } catch { resolve(); }
    };
    const fallback = setTimeout(finish, 250);
    if (pending === 0) {
      finish();
      return;
    }
    for (const address of addresses) {
      try {
        socket.setMulticastInterface(address);
        socket.send(goodbye, MDNS_PORT, MDNS_MULTICAST_ADDRESS, () => {
          pending -= 1;
          if (pending === 0) finish();
        });
      } catch {
        pending -= 1;
        if (pending === 0) finish();
      }
    }
  });

  return {
    identity,
    close: closeSocket,
  };
}
