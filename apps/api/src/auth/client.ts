/**
 * Auth client types — consumed by the admin SPA (plan 13).
 *
 * The actual createAuthClient() call lives in apps/admin (plan 13).
 * This file re-exports the server auth type so the SPA can infer
 * route types and session shapes without importing server-only code.
 */
export type { Auth } from "./index";
export type { AuthUser, AuthVariables } from "./middleware";
