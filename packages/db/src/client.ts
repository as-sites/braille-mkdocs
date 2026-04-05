import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment before using @braille-docs/db.",
    );
  }

  return databaseUrl;
}

export const connection = neon(getDatabaseUrl());

export const db = drizzle({
  client: connection,
  schema,
});

export type DatabaseClient = typeof db;
