import { generateHTML } from "@tiptap/html/server";

import { getExtensions } from "./extensions";
import { resolveImageUrls, type SerializeOptions } from "./serializer";

export { type ImageUrlResolver, type SerializeOptions } from "./serializer";

/**
 * Node-safe serializer for server-side publish flow.
 * Uses happy-dom under the hood — do NOT import from browser code.
 */
export function serializeToHtmlServer(
  prosemirrorJson: object,
  options: SerializeOptions = {},
): string {
  const json = options.imageUrlResolver
    ? (resolveImageUrls(prosemirrorJson, options.imageUrlResolver) as object)
    : prosemirrorJson;

  return generateHTML(json, getExtensions());
}
