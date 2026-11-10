import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { join } from "node:path";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

app.get("/api/health", async () => ({
  status: "ok",
  application: "homey-dashboard",
  homey: "not-configured"
}));

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
