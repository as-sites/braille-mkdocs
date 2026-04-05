import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import * as schemas from "../../openapi/schemas";
import * as services from "../../services";
import { NotFoundError, BusinessLogicError } from "../../lib/errors";

/**
 * Admin publishing routes (authentication required).
 * Full implementations delegated to plan 08.
 */

export function registerAdminPublishingRoutes(app: OpenAPIHono) {
  // =========================================================================
  // POST /api/admin/documents/:id/publish
  // =========================================================================
  const publishRoute = createRoute({
    method: "post",
    path: "/api/admin/documents/:id/publish",
    tags: ["Admin - Publishing"],
    summary: "Publish a document",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          "application/json": {
            schema: schemas.PublishRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Document published",
        content: {
          "application/json": {
            schema: schemas.DocumentResponse,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Document not found",
      },
      422: {
        description: "Business logic error",
      },
    },
  });

  app.openapi(publishRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    try {
      const id = c.req.param("id");
      const doc = await services.publishDocument(id, user.id);
      return c.json(doc);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.name, message: error.message }, 404);
      }
      if (error instanceof BusinessLogicError) {
        return c.json({ error: error.name, message: error.message }, 422);
      }
      throw error;
    }
  });

  // =========================================================================
  // POST /api/admin/documents/:id/unpublish
  // =========================================================================
  const unpublishRoute = createRoute({
    method: "post",
    path: "/api/admin/documents/:id/unpublish",
    tags: ["Admin - Publishing"],
    summary: "Unpublish a document",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          "application/json": {
            schema: schemas.UnpublishRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Document unpublished",
        content: {
          "application/json": {
            schema: schemas.DocumentResponse,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Document not found",
      },
    },
  });

  app.openapi(unpublishRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    try {
      const id = c.req.param("id");
      const doc = await services.unpublishDocument(id, user.id);
      return c.json(doc);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.name, message: error.message }, 404);
      }
      throw error;
    }
  });

  // =========================================================================
  // POST /api/admin/documents/:id/discard
  // =========================================================================
  const discardRoute = createRoute({
    method: "post",
    path: "/api/admin/documents/:id/discard",
    tags: ["Admin - Publishing"],
    summary: "Discard draft changes",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          "application/json": {
            schema: schemas.DiscardRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Changes discarded",
        content: {
          "application/json": {
            schema: schemas.DocumentResponse,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Document not found",
      },
      422: {
        description: "Business logic error",
      },
    },
  });

  app.openapi(discardRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    try {
      const id = c.req.param("id");
      const doc = await services.discardDraft(id, user.id);
      return c.json(doc);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.name, message: error.message }, 404);
      }
      if (error instanceof BusinessLogicError) {
        return c.json({ error: error.name, message: error.message }, 422);
      }
      throw error;
    }
  });
}
