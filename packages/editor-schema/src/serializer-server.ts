import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";

import { getExtensions } from "./extensions";
import { resolveImageUrls, type SerializeOptions } from "./serializer";

export { type ImageUrlResolver, type SerializeOptions } from "./serializer";

/**
 * DOM-free serializer for server-side publish flow.
 * Uses @tiptap/static-renderer — safe for Cloudflare Workers (no happy-dom / vm).
 */
export function serializeToHtmlServer(
  prosemirrorJson: object,
  options: SerializeOptions = {},
): string {
  const json = options.imageUrlResolver
    ? (resolveImageUrls(prosemirrorJson, options.imageUrlResolver) as object)
    : prosemirrorJson;

  return renderToHTMLString({ content: json, extensions: getExtensions() });
}
