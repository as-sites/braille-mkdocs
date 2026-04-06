import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const inviteRoleValues: readonly ["admin", "editor"] = ["admin", "editor"];
export type InviteRole = (typeof inviteRoleValues)[number];

export const userInvites = pgTable(
  "user_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
    role: text("role", { enum: inviteRoleValues }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("user_invites_user_id_idx").on(table.userId),
    index("user_invites_expires_at_idx").on(table.expiresAt),
    uniqueIndex("user_invites_active_email_unique")
      .on(table.email)
      .where(sql`${table.acceptedAt} is null and ${table.revokedAt} is null`),
  ],
);

export type UserInvite = InferSelectModel<typeof userInvites>;
export type NewUserInvite = InferInsertModel<typeof userInvites>;