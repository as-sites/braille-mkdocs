import { createRoute, z } from "@hono/zod-openapi";

import { ValidationError } from "../../lib/errors";
import * as schemas from "../../openapi/schemas";
import * as services from "../../services";

/**
 * Public search route (no authentication required).
 */

export function registerPublicSearchRoutes(app: any) {
  const searchQuerySchema = z.object({
    q: z.string().trim().min(1).describe("Search query"),
    work: z.string().trim().min(1).optional().describe("Scope to a specific work"),
    limit: z.coerce.number().int().min(1).max(100).default(20).describe("Results per page"),
    offset: z.coerce.number().int().min(0).default(0).describe("Pagination offset"),
  });

  const searchRoute = createRoute({
    method: "get",
    path: "/api/search",
    tags: ["Search"],
    summary: "Full-text search across all published documents",
    request: {
      query: searchQuerySchema,
    },
    responses: {
      200: {
        description: "Search results",
        content: {
          "application/json": {
            schema: schemas.SearchResponse,
          },
        },
      },
      400: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: schemas.ErrorResponse,
          },
        },
      },
    },
  });

  app.openapi(searchRoute, async (c: any) => {
    const parsedQuery = searchQuerySchema.safeParse({
      q: c.req.query("q"),
      work: c.req.query("work"),
      limit: c.req.query("limit"),
      offset: c.req.query("offset"),
    });

    if (!parsedQuery.success) {
      throw new ValidationError(parsedQuery.error.issues[0]?.message ?? "Invalid search query");
    }

    const results = await services.searchDocuments(parsedQuery.data.q, {
      work: parsedQuery.data.work,
      limit: parsedQuery.data.limit,
      offset: parsedQuery.data.offset,
    });

    return c.json(results);
  });
}
