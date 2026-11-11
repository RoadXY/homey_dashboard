import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { connectHomey, getHomeyInventory, getHomeyStatus, getHomeyDeviceReadings } from "./homey.js";

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

app.get("/api/homey/readings", async (_request, reply) => {\n  try {\n    const ids = [\n      "2c7a4148-1042-4dd5-80d4-81d07bcf66ed",\n      "5f6616bc-e761-4462-a648-e3ed1f07e5c9",\n      "2d5302a8-5be9-47ca-b858-59693523fd93",\n      "42b24797-915e-4d2d-bbe9-c7ee7c6378b4",\n      "a9cc989a-8672-4bb6-9da0-c0893a02d2f5",\n      "ba9336e2-f4ed-417c-bba6-3fafb735e61a",\n      "58f20a55-90b3-49cf-9af0-53a40f6e501c",\n      "c7e68c38-1588-4c93-9db8-e854f4d251ab"\n    ];\n    return await getHomeyDeviceReadings(ids);\n  } catch (error) {\n    return reply.code(503).send({ error: error instanceof Error ? error.message : "Uitlezen meetwaarden mislukt" });\n  }\n});\n\napp.get("/api/homey/inventory", async (_request, reply) => {
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
