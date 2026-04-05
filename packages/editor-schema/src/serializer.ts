import { generateHTML } from "@tiptap/html";

import { getExtensions } from "./extensions";

export function serializeToHtml(prosemirrorJson: object): string {
  return generateHTML(prosemirrorJson, getExtensions());
}