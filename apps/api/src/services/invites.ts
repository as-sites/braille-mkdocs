import { hashPassword } from "better-auth/crypto";
import { db, sql } from "@braille-wiki/db";

import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../lib/errors";
import { sendInviteEmail } from "./email";

type InviteRole = "admin" | "editor";
type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: InviteRole;
  created_at: Date | string;
};

type InviteRow = {
  id: string;
  user_id: string;
  email: string;
  role: InviteRole;
  token_hash: string;
  expires_at: Date | string;
  accepted_at: Date | string | null;
  revoked_at: Date | string | null;
  created_by: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export type UserInviteDto = {
  id: string;
  user_id: string;
  email: string;
  role: InviteRole;
  status: InviteStatus;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type VerifyInviteDto = {
  valid: boolean;
  status: "pending" | "accepted" | "revoked" | "expired" | "invalid";
  email_masked: string | null;
  expires_at: string | null;
};

type UserDto = {
  id: string;
  name: string;
  email: string;
  role: InviteRole;
  created_at: string;
};

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }
  return ((result as { rows?: T[] })?.rows ?? []) as T[];
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function assertRole(value: string): asserts value is InviteRole {
  if (value !== "admin" && value !== "editor") {
    throw new ValidationError("Invalid role");
  }
}

function getInviteStatus(row: Pick<InviteRow, "accepted_at" | "revoked_at" | "expires_at">): InviteStatus {
  if (row.accepted_at) {
    return "accepted";
  }

  if (row.revoked_at) {
    return "revoked";
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return "expired";
  }

  return "pending";
}

function toInviteDto(row: InviteRow): UserInviteDto {
  return {
    id: row.id,
    user_id: row.user_id,
    email: row.email,
    role: row.role,
    status: getInviteStatus(row),
    expires_at: new Date(row.expires_at).toISOString(),
    accepted_at: row.accepted_at ? new Date(row.accepted_at).toISOString() : null,
    revoked_at: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    created_by: row.created_by,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return "***";
  }

  if (local.length <= 2) {
    return `${local[0] ?? "*"}***@${domain}`;
  }

  return `${local[0]}***${local.slice(-1)}@${domain}`;
}

function getInviteTtlHours(): number {
  const parsed = Number(process.env.INVITE_TTL_HOURS ?? "48");
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 48;
  }

  return parsed;
}

function buildInviteUrl(rawToken: string): string {
  const base =
    process.env.INVITE_BASE_URL ??
    process.env.ADMIN_ORIGIN ??
    "http://localhost:5173";

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalizedBase}/invite/accept?token=${encodeURIComponent(rawToken)}`;
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(bytes = 32): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return Array.from(values)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function hasCredentialAccount(userId: string): Promise<boolean> {
  const result = await db.execute<{ id: string }>(sql`
    SELECT id
    FROM "account"
    WHERE user_id = ${userId} AND provider_id = 'credential'
    LIMIT 1
  `);

  return rowsOf<{ id: string }>(result).length > 0;
}

async function getInviteById(id: string): Promise<InviteRow> {
  const result = await db.execute<InviteRow>(sql`
    SELECT id, user_id, email, role, token_hash, expires_at, accepted_at, revoked_at, created_by, created_at, updated_at
    FROM "user_invites"
    WHERE id = ${id}
    LIMIT 1
  `);

  const invite = rowsOf<InviteRow>(result)[0];
  if (!invite) {
    throw new NotFoundError(`Invite not found: ${id}`);
  }

  return invite;
}

async function upsertPendingUser(input: {
  name: string;
  email: string;
  role: InviteRole;
}): Promise<UserRow> {
  const existingResult = await db.execute<UserRow>(sql`
    SELECT id, name, email, role, created_at
    FROM "user"
    WHERE email = ${input.email}
    LIMIT 1
  `);

  const existing = rowsOf<UserRow>(existingResult)[0];
  if (!existing) {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.execute(sql`
      INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
      VALUES (${id}, ${input.name}, ${input.email}, ${false}, ${input.role}, ${now}, ${now})
    `);

    return {
      id,
      name: input.name,
      email: input.email,
      role: input.role,
      created_at: now,
    };
  }

  if (await hasCredentialAccount(existing.id)) {
    throw new ConflictError("An active account with this email already exists");
  }

  await db.execute(sql`
    UPDATE "user"
    SET
      name = ${input.name},
      role = ${input.role},
      updated_at = ${new Date()}
    WHERE id = ${existing.id}
  `);

  return {
    ...existing,
    name: input.name,
    role: input.role,
  };
}

async function clearExpiredActiveInvitesForEmail(email: string): Promise<void> {
  await db.execute(sql`
    UPDATE "user_invites"
    SET
      revoked_at = COALESCE(revoked_at, NOW()),
      updated_at = NOW()
    WHERE
      email = ${email}
      AND accepted_at IS NULL
      AND revoked_at IS NULL
      AND expires_at <= NOW()
  `);
}

async function createInviteRecord(input: {
  userId: string;
  email: string;
  role: InviteRole;
  createdBy: string;
}): Promise<{ invite: InviteRow; rawToken: string }> {
  await clearExpiredActiveInvitesForEmail(input.email);

  const activeResult = await db.execute<{ id: string }>(sql`
    SELECT id
    FROM "user_invites"
    WHERE
      email = ${input.email}
      AND accepted_at IS NULL
      AND revoked_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `);

  if (rowsOf<{ id: string }>(activeResult).length > 0) {
    throw new ConflictError("A pending invite already exists for this email");
  }

  const rawToken = randomToken(32);
  const tokenHash = await sha256Hex(rawToken);
  const ttlHours = getInviteTtlHours();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const now = new Date();

  const created = await db.execute<InviteRow>(sql`
    INSERT INTO "user_invites"
      (user_id, email, role, token_hash, expires_at, created_by, created_at, updated_at)
    VALUES
      (${input.userId}, ${input.email}, ${input.role}, ${tokenHash}, ${expiresAt}, ${input.createdBy}, ${now}, ${now})
    RETURNING id, user_id, email, role, token_hash, expires_at, accepted_at, revoked_at, created_by, created_at, updated_at
  `);

  const invite = rowsOf<InviteRow>(created)[0];
  if (!invite) {
    throw new ValidationError("Failed to create invite");
  }

  return { invite, rawToken };
}

export async function listUserInvites(): Promise<UserInviteDto[]> {
  const result = await db.execute<InviteRow>(sql`
    SELECT id, user_id, email, role, token_hash, expires_at, accepted_at, revoked_at, created_by, created_at, updated_at
    FROM "user_invites"
    ORDER BY created_at DESC
  `);

  return rowsOf<InviteRow>(result).map(toInviteDto);
}

export async function createUserInvite(input: {
  name: string;
  email: string;
  role: InviteRole;
  createdBy: string;
}): Promise<UserInviteDto> {
  if (!input.name?.trim()) {
    throw new ValidationError("Name is required");
  }

  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("Invalid email format");
  }

  assertRole(input.role);

  const user = await upsertPendingUser({
    name: input.name.trim(),
    email,
    role: input.role,
  });

  const { invite, rawToken } = await createInviteRecord({
    userId: user.id,
    email,
    role: input.role,
    createdBy: input.createdBy,
  });

  await sendInviteEmail({
    to: email,
    name: user.name,
    role: input.role,
    inviteUrl: buildInviteUrl(rawToken),
    expiresAt: new Date(invite.expires_at),
  });

  return toInviteDto(invite);
}

export async function resendUserInvite(input: {
  id: string;
}): Promise<UserInviteDto> {
  const invite = await getInviteById(input.id);

  if (getInviteStatus(invite) !== "pending") {
    throw new ConflictError("Invite cannot be resent in its current state");
  }

  const rawToken = randomToken(32);
  const tokenHash = await sha256Hex(rawToken);
  const ttlHours = getInviteTtlHours();
  const nextExpiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  const updated = await db.execute<InviteRow>(sql`
    UPDATE "user_invites"
    SET
      token_hash = ${tokenHash},
      expires_at = ${nextExpiresAt},
      updated_at = ${new Date()}
    WHERE id = ${invite.id}
    RETURNING id, user_id, email, role, token_hash, expires_at, accepted_at, revoked_at, created_by, created_at, updated_at
  `);

  const row = rowsOf<InviteRow>(updated)[0];
  if (!row) {
    throw new NotFoundError(`Invite not found: ${invite.id}`);
  }

  const userResult = await db.execute<UserRow>(sql`
    SELECT id, name, email, role, created_at
    FROM "user"
    WHERE id = ${row.user_id}
    LIMIT 1
  `);

  const user = rowsOf<UserRow>(userResult)[0];

  await sendInviteEmail({
    to: row.email,
    name: user?.name ?? row.email,
    role: row.role,
    inviteUrl: buildInviteUrl(rawToken),
    expiresAt: new Date(row.expires_at),
  });

  return toInviteDto(row);
}

export async function revokeUserInvite(input: { id: string }): Promise<UserInviteDto> {
  const invite = await getInviteById(input.id);

  const status = getInviteStatus(invite);
  if (status === "accepted") {
    throw new ConflictError("Cannot revoke an already accepted invite");
  }

  if (status === "revoked") {
    return toInviteDto(invite);
  }

  const updated = await db.execute<InviteRow>(sql`
    UPDATE "user_invites"
    SET
      revoked_at = ${new Date()},
      updated_at = ${new Date()}
    WHERE id = ${invite.id}
    RETURNING id, user_id, email, role, token_hash, expires_at, accepted_at, revoked_at, created_by, created_at, updated_at
  `);

  const row = rowsOf<InviteRow>(updated)[0];
  if (!row) {
    throw new NotFoundError(`Invite not found: ${invite.id}`);
  }

  return toInviteDto(row);
}

export async function verifyInviteToken(token: string): Promise<VerifyInviteDto> {
  if (!token?.trim()) {
    throw new ValidationError("token is required");
  }

  const tokenHash = await sha256Hex(token.trim());

  const result = await db.execute<InviteRow>(sql`
    SELECT id, user_id, email, role, token_hash, expires_at, accepted_at, revoked_at, created_by, created_at, updated_at
    FROM "user_invites"
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `);

  const invite = rowsOf<InviteRow>(result)[0];
  if (!invite) {
    return {
      valid: false,
      status: "invalid",
      email_masked: null,
      expires_at: null,
    };
  }

  const status = getInviteStatus(invite);

  return {
    valid: status === "pending",
    status,
    email_masked: maskEmail(invite.email),
    expires_at: new Date(invite.expires_at).toISOString(),
  };
}

export async function acceptInvite(input: {
  token: string;
  password: string;
  name?: string;
}): Promise<{ success: true; user: UserDto }> {
  if (!input.token?.trim()) {
    throw new ValidationError("token is required");
  }

  if (!input.password || input.password.length < 12) {
    throw new ValidationError("Password must be at least 12 characters long");
  }

  const hasLetter = /[A-Za-z]/.test(input.password);
  const hasNumber = /\d/.test(input.password);
  if (!hasLetter || !hasNumber) {
    throw new ValidationError("Password must include at least one letter and one number");
  }

  const tokenHash = await sha256Hex(input.token.trim());

  const inviteResult = await db.execute<InviteRow>(sql`
    SELECT id, user_id, email, role, token_hash, expires_at, accepted_at, revoked_at, created_by, created_at, updated_at
    FROM "user_invites"
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `);

  const invite = rowsOf<InviteRow>(inviteResult)[0];
  if (!invite) {
    throw new ValidationError("Invalid invite token");
  }

  const status = getInviteStatus(invite);
  if (status !== "pending") {
    throw new ConflictError(`Invite is ${status}`);
  }

  const accountExists = await hasCredentialAccount(invite.user_id);
  if (accountExists) {
    throw new ConflictError("Invite has already been used");
  }

  const userResult = await db.execute<UserRow>(sql`
    SELECT id, name, email, role, created_at
    FROM "user"
    WHERE id = ${invite.user_id}
    LIMIT 1
  `);

  const user = rowsOf<UserRow>(userResult)[0];
  if (!user) {
    throw new NotFoundError("Invite user not found");
  }

  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const nextName = input.name?.trim() ? input.name.trim() : user.name;

  await db.execute(sql`
    INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
    VALUES (${crypto.randomUUID()}, ${user.id}, 'credential', ${user.id}, ${passwordHash}, ${now}, ${now})
  `);

  await db.execute(sql`
    UPDATE "user"
    SET
      name = ${nextName},
      email_verified = ${true},
      updated_at = ${now}
    WHERE id = ${user.id}
  `);

  await db.execute(sql`
    UPDATE "user_invites"
    SET
      accepted_at = ${now},
      updated_at = ${now}
    WHERE id = ${invite.id}
  `);

  return {
    success: true,
    user: {
      id: user.id,
      name: nextName,
      email: user.email,
      role: user.role,
      created_at: new Date(user.created_at).toISOString(),
    },
  };
}