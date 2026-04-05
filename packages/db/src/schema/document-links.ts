import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const documentLinks = pgTable(
  "document_links",
  {
    sourcePath: text("source_path").notNull(),
    targetPath: text("target_path").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.sourcePath, table.targetPath] }),
    index("document_links_target_path_idx").on(table.targetPath),
  ],
);

export type DocumentLink = InferSelectModel<typeof documentLinks>;
export type NewDocumentLink = InferInsertModel<typeof documentLinks>;
