import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

type StoredToken = {
  id: string;
  name: string;
  hash: string;
  createdAt: string;
  lastFour: string;
};
export type WeatherTokenInfo = Omit<StoredToken, "hash">;
const tokenFile = join(process.env.DATA_DIR ?? join(process.cwd(), "data"), "weather", "tokens.json");
let writeQueue: Promise<void> = Promise.resolve();

async function readTokens(): Promise<StoredToken[]> {
  try {
    const value = JSON.parse(await readFile(tokenFile, "utf8")) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is StoredToken =>
      !!item && typeof item.id === "string" && typeof item.name === "string" &&
      typeof item.hash === "string" && typeof item.createdAt === "string" && typeof item.lastFour === "string"
    );
  } catch { return []; }
}
async function saveTokens(tokens: StoredToken[]): Promise<void> {
  const operation = writeQueue.then(async () => {
    await mkdir(dirname(tokenFile), { recursive: true });
    await writeFile(tokenFile, JSON.stringify(tokens, null, 2) + "\n", { mode: 0o600 });
  });
  writeQueue = operation.catch(() => undefined);
  await operation;
}
function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
export async function listWeatherTokens(): Promise<WeatherTokenInfo[]> {
  return (await readTokens()).map(({ hash: _hash, ...info }) => info);
}
export async function createWeatherToken(name: string): Promise<{ token: string; info: WeatherTokenInfo }> {
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 60) throw new Error("Tokennaam moet 1 tot 60 tekens bevatten.");
  const token = "hdy_" + randomBytes(32).toString("base64url");
  const record: StoredToken = {
    id: randomUUID(), name: cleanName, hash: digest(token),
    createdAt: new Date().toISOString(), lastFour: token.slice(-4),
  };
  const tokens = await readTokens();
  tokens.push(record);
  await saveTokens(tokens);
  const { hash: _hash, ...info } = record;
  return { token, info };
}
export async function revokeWeatherToken(id: string): Promise<boolean> {
  const tokens = await readTokens();
  const next = tokens.filter((token) => token.id !== id);
  if (next.length === tokens.length) return false;
  await saveTokens(next);
  return true;
}
export async function isValidWeatherToken(candidate: string): Promise<boolean> {
  if (!candidate || candidate.length > 256) return false;
  const candidateHash = Buffer.from(digest(candidate), "hex");
  const tokens = await readTokens();
  return tokens.some((token) => {
    const storedHash = Buffer.from(token.hash, "hex");
    return storedHash.length === candidateHash.length && timingSafeEqual(storedHash, candidateHash);
  });
}
