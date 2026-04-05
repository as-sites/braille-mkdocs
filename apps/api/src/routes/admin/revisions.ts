import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import * as schemas from "../../openapi/schemas";
import * as services from "../../services";
import { NotFoundError } from "../../lib/errors";

/**
 * Admin revision management routes (authentication required).
 */

export function registerAdminRevisionRoutes(app: OpenAPIHono) {
  // =========================================================================
  // GET /api/admin/documents/:id/revisions
  // =========================================================================
  const listRevisionsRoute = createRoute({
    method: "get",
    path: "/api/admin/documents/:id/revisions",
    tags: ["Admin - Revisions"],
    summary: "List revision history for a document",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      query: z.object({
        limit: z.coerce.number().int().positive().optional(),
        offset: z.coerce.number().int().nonnegative().optional(),
      }),
    },
    responses: {
      200: {
        description: "Revisions list",
        content: {
          "application/json": {
            schema: schemas.RevisionListResponse,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(listRevisionsRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    const id = c.req.param("id");
    const limitParam = c.req.query("limit");
    const offsetParam = c.req.query("offset");

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const revisions = await services.getRevisions(id, { limit, offset });

    return c.json({
      revisions: revisions.map((r) => ({
        id: r.id,
        documentId: r.documentId,
        action: r.action,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
      })),
      total: revisions.length,
      limit,
      offset,
    });
  });

  // =========================================================================
  // GET /api/admin/revisions/:revisionId
  // =========================================================================
  const getRevisionRoute = createRoute({
    method: "get",
    path: "/api/admin/revisions/:revisionId",
    tags: ["Admin - Revisions"],
    summary: "Get a specific revision",
    request: {
      params: z.object({
        revisionId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Revision found",
        content: {
          "application/json": {
            schema: schemas.RevisionResponse,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Revision not found",
      },
    },
  });

  app.openapi(getRevisionRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    try {
      const revisionId = c.req.param("revisionId");
      const revision = await services.getRevision(revisionId);
      return c.json(revision);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.name, message: error.message }, 404);
      }
      throw error;
    }
  });

  // =========================================================================
  // POST /api/admin/documents/:id/rollback/:revisionId
  // =========================================================================
  const rollbackRoute = createRoute({
    method: "post",
    path: "/api/admin/documents/:id/rollback/:revisionId",
    tags: ["Admin - Revisions"],
    summary: "Rollback to a previous revision",
    request: {
      params: z.object({
        id: z.string().uuid(),
        revisionId: z.string().uuid(),
      }),
      body: {
        content: {
          "application/json": {
            schema: schemas.RollbackRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Document rolled back",
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
        description: "Document or revision not found",
      },
    },
  });

  app.openapi(rollbackRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    try {
      const id = c.req.param("id");
      const revisionId = c.req.param("revisionId");
      const document = await services.rollbackDocument(id, revisionId, user.id);
      return c.json(document);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.name, message: error.message }, 404);
      }
      throw error;
    }
  });
}
