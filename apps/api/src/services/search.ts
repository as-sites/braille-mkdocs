/**
 * Search documents.
 * Full implementation in plan 09.
 */
export async function searchDocuments(
  query: string,
  options?: {
    work?: string;
    limit?: number;
    offset?: number;
  },
) {
  // Stub implementation - returns empty results
  return {
    results: [],
    total: 0,
    limit: options?.limit ?? 10,
    offset: options?.offset ?? 0,
  };
}
