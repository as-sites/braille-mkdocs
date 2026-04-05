import { getSchema } from "@tiptap/core";
import type { Schema as ProseMirrorSchema } from "@tiptap/pm/model";

import { getExtensions } from "./extensions";

export const schema: ProseMirrorSchema = getSchema(getExtensions());