/**
 * Seed script — creates the initial admin user if the user table is empty.
 *
 * Run directly: npx tsx src/seed.ts
 * Or import and call seedAdmin() at server startup.
 *
 * Requires env vars: INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, DATABASE_URL, BETTER_AUTH_SECRET
 */
import { sql, db } from "@braille-docs/db";
import { auth } from "./auth/index";

export async function seedAdmin(): Promise<void> {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("[seed] INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD not set — skipping.");
    return;
  }

  const rows = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text AS count FROM "user"`,
  );
  const count = parseInt(rows.rows[0]?.count ?? "0", 10);

  if (count > 0) {
    console.log(`[seed] ${count} user(s) already exist — skipping admin seed.`);
    return;
  }

  console.log(`[seed] No users found. Creating initial admin: ${email}`);

  await auth.api.signUpEmail({
    body: { email, password, name: "Admin" },
  });

  await db.execute(
    sql`UPDATE "user" SET role = 'admin' WHERE email = ${email}`,
  );

  console.log("[seed] Initial admin user created.");
}

// Allow running directly: npx tsx src/seed.ts
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedAdmin().catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  });
}
