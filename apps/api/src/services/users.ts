import { db, sql } from "@braille-wiki/db";

import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from "../lib/errors";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
  created_at: Date | string;
};

type UserDto = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
  createdAt: string;
};

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  return ((result as { rows?: T[] })?.rows ?? []) as T[];
}

function toUserDto(row: UserRow): UserDto {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function assertRole(value: string): asserts value is "admin" | "editor" {
  if (value !== "admin" && value !== "editor") {
    throw new ValidationError("Invalid user role");
  }
}

/**
 * Get all users.
 */
export async function getUsers() {
  const result = await db.execute<UserRow>(sql`
    SELECT id, name, email, role, created_at
    FROM "user"
    ORDER BY created_at ASC
  `);

  return rowsOf<UserRow>(result).map(toUserDto);
}

/**
 * Get a single user by ID.
 */
export async function getUser(userId: string) {
  const result = await db.execute<UserRow>(sql`
    SELECT id, name, email, role, created_at
    FROM "user"
    WHERE id = ${userId}
    LIMIT 1
  `);

  const user = rowsOf<UserRow>(result)[0];

  if (!user) {
    throw new NotFoundError(`User not found: ${userId}`);
  }

  return toUserDto(user);
}

/**
 * Create a new user (admin only).
 */
export async function createUser(
  data: {
    name: string;
    email: string;
    role: "admin" | "editor";
  },
  currentUserRole?: string,
) {
  if (currentUserRole !== "admin") {
    throw new ForbiddenError("Only admins can create users");
  }

  if (!data.name?.trim()) {
    throw new ValidationError("Name is required");
  }

  const normalizedEmail = normalizeEmail(data.email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new ValidationError("Invalid email format");
  }

  assertRole(data.role);

  const existing = await db.execute<{ id: string }>(sql`
    SELECT id
    FROM "user"
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `);

  if (rowsOf<{ id: string }>(existing).length > 0) {
    throw new ConflictError("A user with this email already exists");
  }

  const createdAt = new Date();
  const id = crypto.randomUUID();

  await db.execute(sql`
    INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
    VALUES (${id}, ${data.name.trim()}, ${normalizedEmail}, ${false}, ${data.role}, ${createdAt}, ${createdAt})
  `);

  return getUser(id);
}

/**
 * Update a user's information and role.
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string;
    role?: "admin" | "editor";
  },
  currentUser?: { id: string; role: string },
) {
  if (!currentUser) {
    throw new ForbiddenError("Authentication required");
  }

  const user = await getUser(userId);

  if (data.role && currentUser.role === "editor") {
    throw new ForbiddenError("Editors cannot change user roles");
  }

  if (data.role === "editor" && user.role === "admin") {
    const allUsers = await getUsers();
    const adminCount = allUsers.filter((u) => u.role === "admin").length;
    if (adminCount === 1) {
      throw new ForbiddenError("Cannot demote the only admin");
    }
  }

  if (data.role) {
    assertRole(data.role);
  }

  const nextName = typeof data.name === "string" ? data.name.trim() : undefined;

  if (typeof nextName === "string" && nextName.length === 0) {
    throw new ValidationError("Name cannot be empty");
  }

  await db.execute(sql`
    UPDATE "user"
    SET
      name = COALESCE(${nextName}, name),
      role = COALESCE(${data.role}, role),
      updated_at = ${new Date()}
    WHERE id = ${userId}
  `);

  return getUser(userId);
}

/**
 * Delete a user.
 */
export async function deleteUser(
  userId: string,
  currentUser?: { id: string; role: string },
) {
  if (!currentUser) {
    throw new ForbiddenError("Authentication required");
  }

  const user = await getUser(userId);

  if (userId === currentUser.id) {
    throw new ForbiddenError("Cannot delete your own user account");
  }

  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Only admins can delete users");
  }

  if (user.role === "admin") {
    const allUsers = await getUsers();
    const adminCount = allUsers.filter((u) => u.role === "admin").length;
    if (adminCount === 1) {
      throw new ForbiddenError("Cannot delete the only admin");
    }
  }

  await db.execute(sql`DELETE FROM "session" WHERE user_id = ${userId}`);
  await db.execute(sql`DELETE FROM "apikey" WHERE user_id = ${userId}`);
  await db.execute(sql`DELETE FROM "account" WHERE user_id = ${userId}`);
  await db.execute(sql`DELETE FROM "user_invites" WHERE user_id = ${userId}`);
  await db.execute(sql`DELETE FROM "user" WHERE id = ${userId}`);

  return user;
}
