import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import * as schemas from "../../openapi/schemas";

/**
 * Admin API key routes (authentication required).
 */

export function registerAdminAPIKeyRoutes(app: OpenAPIHono) {
  // =========================================================================
  // GET /api/admin/api-keys
  // =========================================================================
  const listRoute = createRoute({
    method: "get",
    path: "/api/admin/api-keys",
    tags: ["Admin - API Keys"],
    summary: "List API keys for the current user",
    responses: {
      200: {
        description: "API keys list",
        content: {
          "application/json": {
            schema: schemas.APIKeyListResponse,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(listRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    // Stub - use better-auth's listApiKeys
    return c.json([]);
  });

  // =========================================================================
  // POST /api/admin/api-keys
  // =========================================================================
  const createRoute_ = createRoute({
    method: "post",
    path: "/api/admin/api-keys",
    tags: ["Admin - API Keys"],
    summary: "Generate a new API key",
    request: {
      body: {
        content: {
          "application/json": {
            schema: schemas.CreateAPIKeyRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: "API key created",
        content: {
          "application/json": {
            schema: schemas.CreateAPIKeyResponse,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(createRoute_, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    const body = await c.req.json();

    // Stub - use better-auth's createApiKey
    const mockResponse = {
      id: "mock-id",
      name: body.name,
      key: "mock-key-" + Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
    };

    return c.json(mockResponse, 201);
  });

  // =========================================================================
  // DELETE /api/admin/api-keys/:id
  // =========================================================================
  const deleteRoute = createRoute({
    method: "delete",
    path: "/api/admin/api-keys/:id",
    tags: ["Admin - API Keys"],
    summary: "Revoke an API key",
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      200: {
        description: "API key deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "API key not found",
      },
    },
  });

  app.openapi(deleteRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    // Stub - use better-auth's deleteApiKey
    return c.json({ success: true });
  });
}
