import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { connectHomey, getHomeyInventory, getHomeyStatus } from "./homey.js";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

app.get("/api/health", async () => ({
  status: "ok",
  application: "homey-dashboard",
  homey: getHomeyStatus().state
}));

app.get("/api/homey/status", async () => getHomeyStatus());

app.post("/api/homey/connect", async () => connectHomey());

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
