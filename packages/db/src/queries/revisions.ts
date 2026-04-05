import { desc, eq } from "drizzle-orm";

import type { DatabaseClient } from "../client";
import { documentRevisions } from "../schema";

export interface RevisionPagination {
  limit?: number;
  offset?: number;
}

export async function createRevision(
  database: DatabaseClient,
  data: typeof documentRevisions.$inferInsert,
) {
  const [revision] = await database
    .insert(documentRevisions)
    .values(data)
    .returning();

  return revision;
}

export async function getRevisions(
  database: DatabaseClient,
  documentId: string,
  pagination: RevisionPagination = {},
) {
  return database
    .select()
    .from(documentRevisions)
    .where(eq(documentRevisions.documentId, documentId))
    .orderBy(desc(documentRevisions.createdAt))
    .limit(pagination.limit ?? 20)
    .offset(pagination.offset ?? 0);
}

export async function getRevisionById(
  database: DatabaseClient,
  revisionId: string,
) {
  const [revision] = await database
    .select()
    .from(documentRevisions)
    .where(eq(documentRevisions.id, revisionId))
    .limit(1);

  return revision ?? null;
}
