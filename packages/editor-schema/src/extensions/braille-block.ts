import { mergeAttributes, Node } from "@tiptap/core";

export const brailleTypeValues = [
  "UEB Grade 1",
  "UEB Grade 2",
  "Nemeth",
  "other",
] as const;

export type BrailleType = (typeof brailleTypeValues)[number];

function isBrailleType(value: string): value is BrailleType {
  return brailleTypeValues.includes(value as BrailleType);
}

export const BrailleBlock = Node.create({
  name: "brailleBlock",
  group: "block",
  content: "text*",
  code: true,
  defining: true,

  addAttributes() {
    return {
      brailleType: {
        default: "UEB Grade 2",
        parseHTML: (element: HTMLElement) => {
          const value = element.getAttribute("data-braille-type")?.trim() ?? "UEB Grade 2";

          return isBrailleType(value) ? value : "other";
        },
        renderHTML: (attributes: { brailleType?: string }) => ({
          "data-braille-type": attributes.brailleType ?? "UEB Grade 2",
        }),
      },
      caption: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-caption"),
        renderHTML: (attributes: { caption?: string | null }) => {
          if (!attributes.caption) {
            return {};
          }

          return {
            "data-caption": attributes.caption,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pre[data-braille-block]",
        contentElement: "code",
        preserveWhitespace: "full",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "pre",
      mergeAttributes(HTMLAttributes, {
        "data-braille-block": "",
      }),
      ["code", 0],
    ];
  },
});