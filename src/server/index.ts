import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { connectHomey, getHomeyInventory, getHomeyStatus, getHomeyDeviceReadings, getHomeyLogicVariables, homeyRealtime } from "./homey.js";
import { getDashboardNotifications } from "./notifications.js";
import { getDashboardWeather } from "./weather.js";
import { readDashboardSettings, saveDashboardSettings } from "./settings.js";
import os from "node:os";
import { statfs } from "node:fs/promises";
import { readFile } from "node:fs/promises";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const startedAt = Date.now();

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

app.get("/api/settings/general", async () => readDashboardSettings());

app.post("/api/settings/general", async (request, reply) => {
  try {
    return await saveDashboardSettings(request.body);
  } catch (error) {
    return reply.code(400).send({ error: error instanceof Error ? error.message : "Instellingen opslaan mislukt." });
  }
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
  return {
    homey: getHomeyStatus(),
    service: "running",
    version,
    updatedAt: new Date((process.env.BUILD_TIMESTAMP ?? "").trim() || Date.now()).toISOString(),
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
  const heartbeat = setInterval(() => {
    if (!reply.raw.destroyed) reply.raw.write(`: keepalive ${Date.now()}\n\n`);
  }, 20_000);

  homeyRealtime.on("update", onUpdate);
  homeyRealtime.on("connected", onConnected);
  homeyRealtime.on("disconnected", onDisconnected);
  reply.raw.on("close", () => {
    clearInterval(heartbeat);
    homeyRealtime.off("update", onUpdate);
    homeyRealtime.off("connected", onConnected);
    homeyRealtime.off("disconnected", onDisconnected);
  });
});

app.get("/api/weather", async (_request, reply) => {
  try {
    return await getDashboardWeather();
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: "Weather condition mapping could not be loaded." });
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
  await app.register(fastifyStatic, { root: clientPath });
  app.setNotFoundHandler((_request, reply) =>
    reply.sendFile("index.html")
  );
}

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
