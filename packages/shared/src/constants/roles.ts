export const USER_ROLES = ["admin", "editor"] as const;

export type UserRole = (typeof USER_ROLES)[number];