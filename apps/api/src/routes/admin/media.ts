import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import * as schemas from "../../openapi/schemas";

/**
 * Admin media routes (authentication required).
 * Full implementations delegated to plan 11.
 */

export function registerAdminMediaRoutes(app: OpenAPIHono) {
  // =========================================================================
  // GET /api/admin/media
  // =========================================================================
  const listRoute = createRoute({
    method: "get",
    path: "/api/admin/media",
    tags: ["Admin - Media"],
    summary: "List media files",
    request: {
      query: z.object({
        mimeType: z.string().optional(),
        search: z.string().optional(),
        limit: z.coerce.number().int().positive().optional(),
        offset: z.coerce.number().int().nonnegative().optional(),
      }),
    },
    responses: {
      200: {
        description: "Media list",
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

    // Stub - return empty list
    return c.json({ media: [], total: 0, limit: 50, offset: 0 });
  });

  // =========================================================================
  // POST /api/admin/media
  // =========================================================================
  const uploadRoute = createRoute({
    method: "post",
    path: "/api/admin/media",
    tags: ["Admin - Media"],
    summary: "Upload a media file",
    responses: {
      201: {
        description: "File uploaded",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(uploadRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    // Stub - not implemented yet
    return c.json({ error: "NotImplemented", message: "Media upload not yet implemented (Plan 11)" }, 501);
  });
}
