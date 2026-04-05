import { and, eq } from "drizzle-orm";

import type { DatabaseClient } from "../client";
import { documentLinks, documents } from "../schema";

export async function getBacklinks(
  database: DatabaseClient,
  targetPath: string,
) {
  return database
    .select({
      path: documents.path,
      title: documents.title,
    })
    .from(documentLinks)
    .innerJoin(
      documents,
      and(
        eq(documents.path, documentLinks.sourcePath),
        eq(documents.status, "published"),
      ),
    )
    .where(eq(documentLinks.targetPath, targetPath));
}

export async function rebuildLinksForDocument(
  database: DatabaseClient,
  sourcePath: string,
  targetPaths: string[],
) {
  const dedupedTargetPaths = [...new Set(targetPaths)];

  await database
    .delete(documentLinks)
    .where(eq(documentLinks.sourcePath, sourcePath));

  if (dedupedTargetPaths.length === 0) {
    return [];
  }

  return database
    .insert(documentLinks)
    .values(
      dedupedTargetPaths.map((targetPath) => ({
        sourcePath,
        targetPath,
      })),
    )
    .returning();
}
