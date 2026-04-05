import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { auth } from "./auth/index";
import { seedAdmin } from "./seed";

const app = new Hono();

// ---------------------------------------------------------------------------
// CORS — allow the admin SPA origin and credentials (cookies)
// ---------------------------------------------------------------------------
app.use(
  "*",
  cors({
    origin: process.env.ADMIN_ORIGIN ?? "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }),
);

// ---------------------------------------------------------------------------
// Auth routes — better-auth manages /api/auth/* sub-routes
// ---------------------------------------------------------------------------
app.on(["GET", "POST"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// ---------------------------------------------------------------------------
// Routes added in plan 06 — API Core
// ---------------------------------------------------------------------------

export { app };

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port: PORT }, async (info) => {
  console.log(`[api] Listening on http://localhost:${info.port}`);
  await seedAdmin();
});
