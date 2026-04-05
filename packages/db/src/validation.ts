import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import {
  documentLinks,
  documentRevisions,
  documents,
  media,
} from "./schema";

const jsonObjectSchema = z.record(z.string(), z.unknown());

export const insertDocumentSchema = createInsertSchema(documents, {
  metadata: jsonObjectSchema.nullable().optional(),
  prosemirrorJson: jsonObjectSchema.nullable().optional(),
  publishedProsemirrorJson: jsonObjectSchema.nullable().optional(),
});

export const selectDocumentSchema = createSelectSchema(documents, {
  metadata: jsonObjectSchema.nullable(),
  prosemirrorJson: jsonObjectSchema.nullable(),
  publishedProsemirrorJson: jsonObjectSchema.nullable(),
});

export const insertDocumentRevisionSchema = createInsertSchema(documentRevisions, {
  prosemirrorJson: jsonObjectSchema,
});

export const selectDocumentRevisionSchema = createSelectSchema(documentRevisions, {
  prosemirrorJson: jsonObjectSchema,
});

export const insertDocumentLinkSchema = createInsertSchema(documentLinks);
export const selectDocumentLinkSchema = createSelectSchema(documentLinks);

export const insertMediaSchema = createInsertSchema(media);
export const selectMediaSchema = createSelectSchema(media);
