import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { connectHomey, getHomeyInventory, getHomeyStatus, getHomeyDeviceReadings, getHomeyLogicVariables, getHomeyLanguage, homeyRealtime } from "./homey.js";
import { getDashboardNotifications } from "./notifications.js";
import { getDashboardWeather, setWeatherCondition, WEATHER_CONDITIONS } from "./weather.js";
import { readDashboardSettings, saveDashboardSettings } from "./settings.js";
import { createWeatherToken, isValidWeatherToken, listWeatherTokens, revokeWeatherToken } from "./weather-tokens.js";
import { readQuickActions, saveQuickActions } from "./quick-actions.js";
import { executeQuickAction, getQuickActionCatalog } from "./homey.js";
import os from "node:os";
import { EventEmitter } from "node:events";
import { statfs } from "node:fs/promises";
import { readFile, mkdir, readdir, copyFile, writeFile } from "node:fs/promises";
import { randomUUID, randomBytes, createHmac, createHash, timingSafeEqual } from "node:crypto";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const startedAt = Date.now();
const dataDirectory = process.env.DATA_DIR ?? join(process.cwd(), "data");
const SETTINGS_SESSION_COOKIE = "homey_settings";
const SETTINGS_SESSION_IDLE_MS = 30 * 60 * 1000;
let settingsSessionSecret: Buffer;
const settingsRealtime = new EventEmitter();
function broadcastSettingsUpdated(section: "general" | "quick-actions"): void {
  settingsRealtime.emit("updated", { section, updatedAt: new Date().toISOString() });
}
function settingsCookieValue(expiresAt: number): string {
  const payload = Buffer.from(String(expiresAt)).toString("base64url");
  const signature = createHmac("sha256", settingsSessionSecret).update(payload).digest("base64url");
  return payload + "." + signature;
}
function setSettingsCookie(reply: { header(name: string, value: string): unknown }, expiresAt: number): void {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  reply.header("Set-Cookie", `${SETTINGS_SESSION_COOKIE}=${settingsCookieValue(expiresAt)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`);
}
function clearSettingsCookie(reply: { header(name: string, value: string): unknown }): void {
  reply.header("Set-Cookie", `${SETTINGS_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}
function hasSettingsSession(request: { headers: Record<string, string | string[] | undefined> }, reply: { header(name: string, value: string): unknown }): boolean {
  const cookieHeader = request.headers.cookie;
  if (typeof cookieHeader !== "string") return false;
  const cookie = cookieHeader.split(";").map(part => part.trim()).find(part => part.startsWith(SETTINGS_SESSION_COOKIE + "="));
  const value = cookie?.slice(SETTINGS_SESSION_COOKIE.length + 1);
  if (!value) return false;
  const [payload, suppliedSignature] = value.split(".");
  if (!payload || !suppliedSignature) return false;
  const expectedSignature = createHmac("sha256", settingsSessionSecret).update(payload).digest();
  let actualSignature: Buffer;
  try { actualSignature = Buffer.from(suppliedSignature, "base64url"); } catch { return false; }
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return false;
  const expiresAt = Number(Buffer.from(payload, "base64url").toString("utf8"));
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return false;
  setSettingsCookie(reply, Date.now() + SETTINGS_SESSION_IDLE_MS);
  return true;
}
async function initializeSettingsSessionSecret(): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  const secretPath = join(dataDirectory, "settings-session.key");
  if (existsSync(secretPath)) {
    settingsSessionSecret = await readFile(secretPath);
    if (settingsSessionSecret.length < 32) throw new Error("Settings session key is invalid; inspect the persistent data volume.");
    return;
  }
  const generated = randomBytes(48);
  try {
    await writeFile(secretPath, generated, { flag: "wx", mode: 0o600 });
    settingsSessionSecret = generated;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    settingsSessionSecret = await readFile(secretPath);
    if (settingsSessionSecret.length < 32) throw new Error("Settings session key is invalid; inspect the persistent data volume.");
  }
}

app.get("/api/health/live", async () => ({
  status: "ok",
  application: "homey-dashboard",
  uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
}));

app.get("/api/health/ready", async () => ({
  status: "ready",
  application: "homey-dashboard",
  uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
}));

// Backwards-compatible aggregate endpoint; Homey availability is informational,
// not a prerequisite for the dashboard container to be healthy.
app.get("/api/health", async () => ({
  status: "ok",
  readiness: "ready",
  application: "homey-dashboard",
  uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  homey: getHomeyStatus().state,
}));

app.get("/api/homey/status", async () => getHomeyStatus());

app.post("/api/settings/unlock", async (request, reply) => {
  const configuredPin = process.env.SETTINGS_PIN?.trim();
  if (!configuredPin) return reply.code(503).send({ error: "Instellingen-PIN is nog niet geconfigureerd (SETTINGS_PIN)." });
  const body = request.body as { pin?: unknown } | undefined;
  if (typeof body?.pin !== "string" || body.pin !== configuredPin) {
    return reply.code(401).send({ error: "Onjuiste PIN." });
  }
  setSettingsCookie(reply, Date.now() + SETTINGS_SESSION_IDLE_MS);
  return { unlocked: true };
});

app.get("/api/settings/session", async (request, reply) => {
  if (!hasSettingsSession(request, reply)) return reply.code(401).send({ authenticated: false });
  return { authenticated: true, idleTimeoutSeconds: SETTINGS_SESSION_IDLE_MS / 1000 };
});
app.post("/api/settings/session/refresh", async (request, reply) => {
  if (request.headers["x-settings-activity"] !== "1" || !hasSettingsSession(request, reply)) {
    return reply.code(401).send({ authenticated: false });
  }
  return { authenticated: true };
});
app.post("/api/settings/logout", async (_request, reply) => {
  clearSettingsCookie(reply);
  return { loggedOut: true };
});


const localeDirectory = join(dataDirectory, "locales");
const defaultLocaleDirectory = existsSync(join(process.cwd(), "default-locales"))
  ? join(process.cwd(), "default-locales")
  : join(process.cwd(), "src", "client", "locales");

async function initializeLocaleFiles(): Promise<void> {
  await mkdir(localeDirectory, { recursive: true });
  const defaults = await readdir(defaultLocaleDirectory);
  for (const file of defaults) {
    if (!/^(languages|[a-z]{2}(-[A-Z]{2})?)\.json$/.test(file) && file !== "README.txt") continue;
    const source = join(defaultLocaleDirectory, file);
    const target = join(localeDirectory, file);
    if (!existsSync(target)) {
      await copyFile(source, target);
      continue;
    }
    if (!file.endsWith(".json")) continue;
    try {
      const defaults = JSON.parse(await readFile(source, "utf8")) as Record<string, unknown>;
      const current = JSON.parse(await readFile(target, "utf8")) as Record<string, unknown>;
      let merged: Record<string, unknown>;
      if (file === "languages.json") {
        const defaultLanguages = Array.isArray(defaults.languages) ? defaults.languages as Array<{ id?: string }> : [];
        const currentLanguages = Array.isArray(current.languages) ? current.languages as Array<{ id?: string }> : [];
        const knownIds = new Set(currentLanguages.map((language) => language.id));
        merged = {
          ...defaults,
          ...current,
          languages: [...currentLanguages, ...defaultLanguages.filter((language) => !knownIds.has(language.id))],
        };
      } else {
        merged = { ...defaults, ...current };
        // These legacy Homey-only labels are no longer canonical API conditions.
        delete merged["weather.condition.clear"];
        delete merged["weather.condition.wind"];
      }
      const serialized = JSON.stringify(merged, null, 2) + "\n";
      if (serialized !== JSON.stringify(current, null, 2) + "\\n") {
        await writeFile(target, serialized, { mode: 0o600 });
      }
    } catch (error) {
      app.log.warn({ file, error }, "Could not merge default locale file; preserving existing file.");
    }
  }
}

app.get("/api/locales/registry", async (_request, reply) => {
  try {
    const registry = await readFile(join(localeDirectory, "languages.json"), "utf8");
    return reply.type("application/json; charset=utf-8").header("Cache-Control", "no-store").send(registry);
  } catch {
    return reply.code(503).send({ error: "Language registry unavailable." });
  }
});
app.get<{ Params: { file: string } }>("/api/locales/:file", async (request, reply) => {
  const file = request.params.file;
  if (!/^[a-z]{2}(-[A-Z]{2})?\.json$/.test(file)) {
    return reply.code(400).send({ error: "Invalid translation filename." });
  }
  try {
    const dictionary = await readFile(join(localeDirectory, file), "utf8");
    return reply.type("application/json; charset=utf-8").header("Cache-Control", "no-store").send(dictionary);
  } catch {
    return reply.code(404).send({ error: "Translation file not found." });
  }
});

app.get("/api/settings/language", async () => {
  const settings = await readDashboardSettings();
  return { language: settings.language };
});

app.get("/api/settings/general", async (request, reply) => {
  if (!hasSettingsSession(request, reply)) return reply.code(401).send({ error: "Instellingen-sessie verlopen." });
  return readDashboardSettings();
});

app.post("/api/settings/general", async (request, reply) => {
  if (!hasSettingsSession(request, reply)) return reply.code(401).send({ error: "Instellingen-sessie verlopen." });
  try {
    const settings = await saveDashboardSettings(request.body);
    broadcastSettingsUpdated("general");
    return settings;
  } catch (error) {
    return reply.code(400).send({ error: error instanceof Error ? error.message : "Instellingen opslaan mislukt." });
  }
});

app.get("/api/dashboard/quick-actions", async () => ({ actions: await readQuickActions() }));

app.get("/api/settings/dashboard-actions", async (request, reply) => {
  if (!hasSettingsSession(request, reply)) return reply.code(401).send({ error: "Instellingen-sessie verlopen." });
  return { actions: await readQuickActions() };
});

app.post("/api/settings/dashboard-actions", async (request, reply) => {
  if (!hasSettingsSession(request, reply)) return reply.code(401).send({ error: "Instellingen-sessie verlopen." });
  try {
    const body = request.body as { actions?: unknown } | undefined;
    const actions = await saveQuickActions(body?.actions);
    broadcastSettingsUpdated("quick-actions");
    return { actions };
  } catch (error) {
    return reply.code(400).send({ error: error instanceof Error ? error.message : "Quick Actions opslaan mislukt." });
  }
});

app.get("/api/settings/quick-action-catalog", async (request, reply) => {
  if (!hasSettingsSession(request, reply)) return reply.code(401).send({ error: "Instellingen-sessie verlopen." });
  try { return await getQuickActionCatalog(); }
  catch (error) { return reply.code(503).send({ error: error instanceof Error ? error.message : "Homey-overzicht kon niet worden geladen." }); }
});

app.post<{ Params: { id: string } }>("/api/homey/quick-actions/:id/execute", async (request, reply) => {
  const actions = await readQuickActions();
  const action = actions.find((item) => item.id === request.params.id);
  if (!action) return reply.code(404).send({ error: "Quick Action niet gevonden." });
  if (action.type === "flow" && !action.flowId) return reply.code(409).send({ error: "Deze Quick Action is nog niet ingesteld." });
  if (action.type === "device" && (!action.deviceId || !action.capabilityId || action.value === null)) return reply.code(409).send({ error: "Deze Quick Action is nog niet ingesteld." });
  try {
    const result = await executeQuickAction(action);
    return { ...result, actionId: action.id };
  } catch (error) {
    return reply.code(502).send({ error: error instanceof Error ? error.message : "Homey-actie uitvoeren mislukt." });
  }
});

app.get("/api/settings/weather-tokens", async (request, reply) => {
  if (!hasSettingsSession(request, reply)) return reply.code(401).send({ error: "Instellingen-sessie verlopen." });
  return { tokens: await listWeatherTokens() };
});

app.post<{ Body: { name?: unknown } }>("/api/settings/weather-tokens", async (request, reply) => {
  if (!hasSettingsSession(request, reply)) return reply.code(401).send({ error: "Instellingen-sessie verlopen." });
  if (typeof request.body?.name !== "string") return reply.code(400).send({ error: "Geef een tokennaam op." });
  try {
    const created = await createWeatherToken(request.body.name);
    return reply.code(201).send(created);
  } catch (error) {
    return reply.code(400).send({ error: error instanceof Error ? error.message : "Token aanmaken mislukt." });
  }
});

app.delete<{ Params: { id: string } }>("/api/settings/weather-tokens/:id", async (request, reply) => {
  if (!hasSettingsSession(request, reply)) return reply.code(401).send({ error: "Instellingen-sessie verlopen." });
  const revoked = await revokeWeatherToken(request.params.id);
  return revoked ? reply.code(204).send() : reply.code(404).send({ error: "Token niet gevonden." });
});

app.get("/api/system/status", async () => {
  let version = "onbekend";
  try {
    const packageInfo = JSON.parse(await readFile(join(process.cwd(), "package.json"), "utf8")) as { version?: string };
    version = packageInfo.version ?? version;
  } catch { /* package metadata is optional in the runtime image */ }
  let storage: { totalBytes: number; freeBytes: number } | null = null;
  try {
    const fs = await statfs(process.env.DATA_DIR ?? join(process.cwd(), "data"));
    storage = { totalBytes: Number(fs.blocks * fs.bsize), freeBytes: Number(fs.bavail * fs.bsize) };
  } catch { /* data volume may not exist until first save */ }
  const homeyLanguage = await getHomeyLanguage();
  return {
    homey: getHomeyStatus(),
    homeyLanguage,
    service: "running",
    version,
    updatedAt: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    memory: { totalBytes: os.totalmem(), freeBytes: os.freemem(), usedBytes: os.totalmem() - os.freemem() },
    storage,
    platform: "Homey Pro 2023",
  };
});

app.get("/api/events", async (_request, reply) => {
  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  reply.raw.write(`event: ready\ndata: ${JSON.stringify({ homey: getHomeyStatus(), connectedAt: new Date().toISOString() })}\n\n`);

  const onUpdate = (payload: unknown) => {
    if (!reply.raw.destroyed) reply.raw.write(`event: homey-update\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  const onConnected = (payload: unknown) => {
    if (!reply.raw.destroyed) reply.raw.write(`event: homey-connected\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  const onDisconnected = (payload: unknown) => {
    if (!reply.raw.destroyed) reply.raw.write(`event: homey-disconnected\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  const onSettingsUpdated = (payload: unknown) => {
    if (!reply.raw.destroyed) reply.raw.write(`event: settings-updated\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  const heartbeat = setInterval(() => {
    if (!reply.raw.destroyed) reply.raw.write(`: keepalive ${Date.now()}\n\n`);
  }, 20_000);

  homeyRealtime.on("update", onUpdate);
  homeyRealtime.on("connected", onConnected);
  homeyRealtime.on("disconnected", onDisconnected);
  settingsRealtime.on("updated", onSettingsUpdated);
  reply.raw.on("close", () => {
    clearInterval(heartbeat);
    homeyRealtime.off("update", onUpdate);
    homeyRealtime.off("connected", onConnected);
    homeyRealtime.off("disconnected", onDisconnected);
    settingsRealtime.off("updated", onSettingsUpdated);
  });
});


async function hasWeatherApiToken(request: { headers: Record<string, string | string[] | undefined> }): Promise<boolean> {
  const authorization = request.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return false;
  const supplied = authorization.slice(7);
  if (await isValidWeatherToken(supplied)) return true;
  // Temporary compatibility for the original single-token .env configuration.
  const legacyToken = process.env.WEATHER_API_TOKEN;
  if (!legacyToken) return false;
  const expectedHash = createHash("sha256").update(legacyToken).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

app.get("/api/v1/weather/conditions", async () => ({
  conditions: WEATHER_CONDITIONS,
}));

app.post<{ Body: { condition?: unknown } }>("/api/v1/weather/conditions", async (request, reply) => {
  if (!(await hasWeatherApiToken(request))) return reply.code(401).send({ error: "A valid Bearer token is required." });
  const condition = request.body?.condition;
  if (typeof condition !== "string" || !(WEATHER_CONDITIONS as readonly string[]).includes(condition)) {
    return reply.code(400).send({
      error: "Invalid weather condition.",
      allowedValues: WEATHER_CONDITIONS,
    });
  }
  try {
    const stored = await setWeatherCondition(condition as typeof WEATHER_CONDITIONS[number]);
    return reply.code(200).send({ condition: stored.condition, receivedAt: stored.receivedAt, source: "api" });
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "Weather condition could not be saved." });
  }
});

app.get("/api/weather", async (_request, reply) => {
  try {
    return await getDashboardWeather();
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "Weather condition could not be loaded." });
  }
});

app.get("/api/notifications", async (_request, reply) => {
  try {
    return await getDashboardNotifications();
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "Dashboardmeldingen konden niet worden ingelezen." });
  }
});

app.post("/api/homey/connect", async () => connectHomey());

app.get("/api/homey/readings", async (_request, reply) => {
  try {
    const ids = [
      "2c7a4148-1042-4dd5-80d4-81d07bcf66ed",
      "5f6616bc-e761-4462-a648-e3ed1f07e5c9",
      "2d5302a8-5be9-47ca-b858-59693523fd93",
      "42b24797-915e-4d2d-bbe9-c7ee7c6378b4",
      "a9cc989a-8672-4bb6-9da0-c0893a02d2f5",
      "ba9336e2-f4ed-417c-bba6-3fafb735e61a",
      "58f20a55-90b3-49cf-9af0-53a40f6e501c",
      "c7e68c38-1588-4c93-9db8-e854f4d251ab"
    ];
    return await getHomeyDeviceReadings(ids);
  } catch (error) {
    return reply.code(503).send({ error: error instanceof Error ? error.message : "Uitlezen meetwaarden mislukt" });
  }
});


app.get("/api/homey/logic", async (_request, reply) => {
  try {
    return await getHomeyLogicVariables([
      "temperatuur_gemiddeld_keuken",
      "temperatuur_gemiddeld_woonkamer",
    ]);
  } catch (error) {
    return reply.code(503).send({
      error: error instanceof Error ? error.message : "Uitlezen Homey Logic-variabelen mislukt",
      hint: "Controleer of de Homey API-key de machtiging homey.logic.readonly heeft.",
    });
  }
});

app.get("/api/homey/inventory", async (_request, reply) => {
  try {
    return await getHomeyInventory();
  } catch (error) {
    return reply.code(503).send({
      error: error instanceof Error ? error.message : "Homey-inventarisatie mislukt",
    });
  }
});

const clientPath = join(process.cwd(), "dist/client");
if (existsSync(clientPath)) {
  // Serve Swagger UI explicitly before the SPA fallback. Without these routes,
  // /api-docs (especially without a trailing slash) falls through to index.html.
  app.get("/api-docs", async (_request, reply) => reply.redirect("/api-docs/"));
  app.get("/api-docs/", async (_request, reply) => {
    try {
      const swaggerHtml = await readFile(join(clientPath, "api-docs/index.html"), "utf8");
      return reply.type("text/html; charset=utf-8").send(swaggerHtml);
    } catch {
      return reply.code(404).send({ error: "Swagger UI assets not found. Rebuild the dashboard image." });
    }
  });

  await app.register(fastifyStatic, { root: clientPath });
  app.setNotFoundHandler((_request, reply) =>
    reply.sendFile("index.html")
  );
}

try {
  await initializeLocaleFiles();
  await initializeSettingsSessionSecret();
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
