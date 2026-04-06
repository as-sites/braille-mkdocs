import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import * as schemas from "../../openapi/schemas";
import * as services from "../../services";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors";

export function registerAdminInviteRoutes(app: OpenAPIHono) {
  const listRoute = createRoute({
    method: "get",
    path: "/api/admin/users/invites",
    tags: ["Admin - Invites"],
    summary: "List user invites",
    responses: {
      200: {
        description: "Invite list",
        content: {
          "application/json": {
            schema: schemas.UserInviteListResponse,
          },
        },
      },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
    },
  });

  app.openapi(listRoute, async (c: any) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    const invites = await services.listUserInvites();
    return c.json(invites);
  });

  const createRoute_ = createRoute({
    method: "post",
    path: "/api/admin/users/invites",
    tags: ["Admin - Invites"],
    summary: "Create and send user invite",
    request: {
      body: {
        content: {
          "application/json": {
            schema: schemas.CreateUserInviteRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Invite created",
        content: {
          "application/json": {
            schema: schemas.UserInviteResponse,
          },
        },
      },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      409: { description: "Conflict" },
    },
  });

  app.openapi(createRoute_, async (c: any) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    const body = await c.req.json();

    try {
      const invite = await services.createUserInvite({
        name: body.name,
        email: body.email,
        role: body.role,
        createdBy: user.id,
      });

      return c.json(invite, 201);
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json({ error: error.name, message: error.message }, 400);
      }
      if (error instanceof ConflictError) {
        return c.json({ error: error.name, message: error.message }, 409);
      }
      throw error;
    }
  });

  const resendRoute = createRoute({
    method: "post",
    path: "/api/admin/users/invites/:id/resend",
    tags: ["Admin - Invites"],
    summary: "Resend pending invite",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Invite resent",
        content: {
          "application/json": {
            schema: schemas.UserInviteResponse,
          },
        },
      },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Invite not found" },
      409: { description: "Conflict" },
    },
  });

  app.openapi(resendRoute, async (c: any) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    try {
      const invite = await services.resendUserInvite({ id: c.req.param("id") });
      return c.json(invite);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.name, message: error.message }, 404);
      }
      if (error instanceof ConflictError) {
        return c.json({ error: error.name, message: error.message }, 409);
      }
      throw error;
    }
  });

  const revokeRoute = createRoute({
    method: "post",
    path: "/api/admin/users/invites/:id/revoke",
    tags: ["Admin - Invites"],
    summary: "Revoke pending invite",
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Invite revoked",
        content: {
          "application/json": {
            schema: schemas.UserInviteResponse,
          },
        },
      },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Invite not found" },
      409: { description: "Conflict" },
    },
  });

  app.openapi(revokeRoute, async (c: any) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    try {
      const invite = await services.revokeUserInvite({ id: c.req.param("id") });
      return c.json(invite);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.name, message: error.message }, 404);
      }
      if (error instanceof ConflictError) {
        return c.json({ error: error.name, message: error.message }, 409);
      }
      throw error;
    }
  });
}
