import "dotenv/config";
import { serve } from "@hono/node-server";
import { auth } from "./auth/index";
import { createApp } from "./app";
import { registerRoutes } from "./routes";
import { seedAdmin } from "./seed";

// ---------------------------------------------------------------------------
// Create the Hono app with global middleware
// ---------------------------------------------------------------------------
const app = createApp();

// ---------------------------------------------------------------------------
// Auth routes — better-auth manages /api/auth/* sub-routes
// ---------------------------------------------------------------------------
app.on(["GET", "POST"], "/api/auth/**", (c: any) => {
  return auth.handler(c.req.raw);
});

// ---------------------------------------------------------------------------
// Register all public and admin routes
// ---------------------------------------------------------------------------
registerRoutes(app);

// ---------------------------------------------------------------------------
// OpenAPI route — serve the generated OpenAPI spec
// ---------------------------------------------------------------------------
app.doc("/api/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Braille Wiki API",
    version: "1.0.0",
  },
  servers: [
    {
      url: "/api",
      description: "API server",
    },
  ],
});

export { app };

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port: PORT }, async (info) => {
  console.log(`[api] Listening on http://localhost:${info.port}`);
  console.log(`[api] OpenAPI docs: http://localhost:${info.port}/api/openapi.json`);
  await seedAdmin();
});
