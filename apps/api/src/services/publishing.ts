import { BusinessLogicError } from "../lib/errors";

/**
 * Publish a document.
 * Full implementation in plan 08.
 */
export async function publishDocument(
  documentId: string,
  userId: string,
) {
  throw new BusinessLogicError(
    "Publishing not yet implemented. (Plan 08)",
  );
}

/**
 * Unpublish a document.
 * Full implementation in plan 08.
 */
export async function unpublishDocument(
  documentId: string,
  userId: string,
) {
  throw new BusinessLogicError(
    "Unpublishing not yet implemented. (Plan 08)",
  );
}

/**
 * Discard draft changes.
 * Full implementation in plan 08.
 */
export async function discardDraft(
  documentId: string,
  userId: string,
) {
  throw new BusinessLogicError(
    "Discard not yet implemented. (Plan 08)",
  );
}
