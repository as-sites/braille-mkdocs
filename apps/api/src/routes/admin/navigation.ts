import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import * as schemas from "../../openapi/schemas";
import * as services from "../../services";
import { NotFoundError, ConflictError, ValidationError } from "../../lib/errors";

/**
 * Admin navigation routes (authentication required).
 * Move and reorder documents in the tree.
 */

export function registerAdminNavigationRoutes(app: OpenAPIHono) {
  // =========================================================================
  // PUT /api/admin/documents/:id/move
  // =========================================================================
  const moveRoute = createRoute({
    method: "put",
    path: "/api/admin/documents/:id/move",
    tags: ["Admin - Navigation"],
    summary: "Move a document to a new parent",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          "application/json": {
            schema: schemas.MoveDocumentRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Document moved",
        content: {
          "application/json": {
            schema: schemas.DocumentResponse,
          },
        },
      },
      400: {
        description: "Bad request",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Document not found",
      },
      409: {
        description: "Conflict",
      },
    },
  });

  app.openapi(moveRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    const id = c.req.param("id");
    const body = await c.req.json();

    try {
      const document = await services.moveDocument(
        id,
        body.newParentPath,
        body.newSlug,
        user.id,
      );

      return c.json(document);
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json({ error: error.name, message: error.message }, 400);
      }
      if (error instanceof NotFoundError) {
        return c.json({ error: error.name, message: error.message }, 404);
      }
      if (error instanceof ConflictError) {
        return c.json({ error: error.name, message: error.message }, 409);
      }
      throw error;
    }
  });

  // =========================================================================
  // PUT /api/admin/documents/reorder
  // =========================================================================
  const reorderRoute = createRoute({
    method: "put",
    path: "/api/admin/documents/reorder",
    tags: ["Admin - Navigation"],
    summary: "Reorder siblings",
    request: {
      body: {
        content: {
          "application/json": {
            schema: schemas.ReorderRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Documents reordered",
        content: {
          "application/json": {
            schema: z.array(schemas.DocumentResponse),
          },
        },
      },
      400: {
        description: "Bad request",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(reorderRoute, async (c: any) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    const body = await c.req.json();

    try {
      const reordered = await services.reorderChildren(
        body.parentPath,
        body.children,
      );

      return c.json(reordered);
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json({ error: error.name, message: error.message }, 400);
      }
      throw error;
    }
  });
}
