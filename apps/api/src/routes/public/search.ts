import { createRoute, z } from "@hono/zod-openapi";

import * as schemas from "../../openapi/schemas";
import * as services from "../../services";

/**
 * Public search route (no authentication required).
 */

export function registerPublicSearchRoutes(app: any) {
  const searchRoute = createRoute({
    method: "get",
    path: "/api/search",
    tags: ["Search"],
    summary: "Full-text search across all published documents",
    request: {
      query: z.object({
        q: z.string().min(1).describe("Search query"),
        work: z.string().optional().describe("Scope to a specific work"),
        limit: z.coerce.number().int().positive().optional().describe("Results per page"),
        offset: z.coerce.number().int().nonnegative().optional().describe("Pagination offset"),
      }),
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
    const query = c.req.query("q");
    const work = c.req.query("work");
    const limit = c.req.query("limit");
    const offset = c.req.query("offset");

    const results = await services.searchDocuments(query, {
      work: work || undefined,
      limit: limit ? parseInt(limit, 10) : 10,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return c.json(results);
  });
}
