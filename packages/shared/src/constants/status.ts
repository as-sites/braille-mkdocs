export const DOCUMENT_STATUSES = ["draft", "published", "archived"] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];