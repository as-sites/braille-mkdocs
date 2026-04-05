import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

import { BrailleBlock } from "./braille-block";

export type GetExtensionsOptions = {
  placeholder?: string;
};

export function getExtensions(options: GetExtensionsOptions = {}) {
  return [
    StarterKit.configure({
      codeBlock: false,
    }),
    Underline,
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    Image,
    Placeholder.configure({
      placeholder: options.placeholder ?? "Write your document...",
    }),
    BrailleBlock,
  ];
}

export * from "./braille-block";