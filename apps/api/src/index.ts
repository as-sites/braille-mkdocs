import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./http-app";

export { app };

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, async (info) => {
  console.log(`[api] Listening on http://${HOST}:${info.port}`);
  console.log(`[api] OpenAPI docs: http://${HOST}:${info.port}/api/openapi.json`);
});
