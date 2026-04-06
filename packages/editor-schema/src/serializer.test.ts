import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { generateJSON } from "@tiptap/html/server";

import { getExtensions } from "./extensions";
import { serializeToHtmlServer } from "./serializer-server";

describe("serializeToHtmlServer", () => {
  test("preserves BrailleBlock attrs and whitespace exactly", () => {
    const brailleContent = "line 1\n  line 2\nline   3\n";

    const doc = {
      type: "doc",
      content: [
        {
          type: "brailleBlock",
          attrs: {
            brailleType: "Nemeth",
            caption: "Example 1",
          },
          content: [{ type: "text", text: brailleContent }],
        },
      ],
    };

    const html = serializeToHtmlServer(doc);

    assert.match(html, /<pre[^>]*data-braille-block[^>]*>/);
    assert.match(html, /data-braille-type="Nemeth"/);
    assert.match(html, /data-caption="Example 1"/);
    assert.match(html, /<code>/);
    assert.match(html, /<\/code>/);

    const match = html.match(/<code>([\s\S]*?)<\/code>/);
    assert.ok(match);
    assert.equal(match[1], brailleContent);
  });

  test("round-trip keeps BrailleBlock text and attrs", () => {
    const brailleContent = "nemeth\n  formula\n";

    const input = {
      type: "doc",
      content: [
        {
          type: "brailleBlock",
          attrs: {
            brailleType: "UEB Grade 2",
            caption: "Spacing critical",
          },
          content: [{ type: "text", text: brailleContent }],
        },
      ],
    };

    const html = serializeToHtmlServer(input);
    const reparsedJson = generateJSON(html, getExtensions());
    const roundTrippedHtml = serializeToHtmlServer(reparsedJson);

    const originalCode = html.match(/<code>([\s\S]*?)<\/code>/)?.[1];
    const roundTripCode = roundTrippedHtml.match(/<code>([\s\S]*?)<\/code>/)?.[1];

    assert.equal(originalCode, brailleContent);
    assert.equal(roundTripCode, brailleContent);
    assert.match(roundTrippedHtml, /data-braille-type="UEB Grade 2"/);
    assert.match(roundTrippedHtml, /data-caption="Spacing critical"/);
  });
});