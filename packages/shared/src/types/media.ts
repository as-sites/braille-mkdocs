import type { InferSelectModel } from "drizzle-orm";

import type { media } from "@braille-docs/db/dist/schema";

export type Media = InferSelectModel<typeof media>;