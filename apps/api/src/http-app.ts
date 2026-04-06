import { auth } from "./auth/index";
import { createApp } from "./app";
import { registerMcpRoutes } from "./mcp";
import { registerRoutes } from "./routes";

const app = createApp();

app.on(["GET", "POST"], "/api/auth/*", (c: any) => {
  return auth.handler(c.req.raw);
});

registerRoutes(app);
registerMcpRoutes(app);

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