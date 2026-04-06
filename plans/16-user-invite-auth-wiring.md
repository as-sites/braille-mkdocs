# 16 User Invite + Auth Wiring Plan

Date: 2026-04-06
Status: Proposed
Owner: Admin/Auth workstream

## Goal

Replace the current placeholder "Invite user" behavior with a real onboarding flow that creates usable accounts and lets invited users securely set a password.

## Contract-First Requirement

The shared OpenAPI spec in `packages/shared/openapi.yaml` is the source of truth for this feature.

Rules:

1. OpenAPI-first
- Add/adjust invite and password-onboarding endpoints and schemas in OpenAPI before backend implementation.

2. Generator-first
- Regenerate admin API types from OpenAPI before wiring UI calls.

3. Implementation must conform
- API handlers, service signatures, and UI payloads must conform to the OpenAPI contract; code should be updated to match the spec, not vice versa.

4. PR gating
- Invite-flow PRs are not complete unless OpenAPI changes are included (or explicitly marked N/A with rationale).

## Current State (Why This Is Needed)

- Admin Users UI sends only `name`, `email`, `role`.
- API user service is a stub and does not create Better Auth credentials.
- No invite token, no password setup screen, no email delivery, and no pending-invite lifecycle.

Result: "Invited" users often cannot actually sign in.

## Recommended Approach

Implement a tokenized invite flow with set-password completion.

1. Admin creates invite (name/email/role).
2. API creates user record (or pending user) and a one-time invite token with expiration.
3. API sends invite email containing a secure link.
4. Invitee opens link, sets password, and activates account.
5. Invite is marked accepted and token invalidated.

This is preferred over temporary passwords because it is safer, auditable, and easier for non-technical users.

## Scope

- In scope:
  - Admin invite creation endpoint (real implementation)
  - Invite token generation + persistence + expiry
  - Set-password completion endpoint
  - Admin UI updates for invite state and resend/revoke
  - Invite acceptance page in admin SPA
  - Email integration abstraction + provider implementation
  - Audit and error handling
- Out of scope:
  - Social/OIDC signup
  - SSO
  - Multi-org tenant model

## Data Model Changes

Add an invite table and account state fields.

1. New table: `user_invites`
- `id` (uuid pk)
- `user_id` (fk user.id)
- `email` (text, normalized lower-case)
- `role` (text: admin|editor snapshot)
- `token_hash` (text, never store raw token)
- `expires_at` (timestamp)
- `accepted_at` (timestamp nullable)
- `revoked_at` (timestamp nullable)
- `created_by` (text fk user.id)
- `created_at` / `updated_at`

2. User/account flags
- Add user/account state to distinguish pending invites from active users.
- If Better Auth already models this via account presence + email verification, document and reuse that pattern instead of duplicating fields.

3. Indexes/constraints
- Unique active invite per email (`accepted_at is null` and `revoked_at is null`)
- Index by `expires_at`
- Index by `user_id`

## API Contract Changes

OpenAPI update is the first deliverable for this section.

### Admin endpoints (auth required, admin role)

1. `POST /api/admin/users/invites`
- Request: `{ name, email, role }`
- Behavior:
  - Validate email/role
  - Create or reuse pending user
  - Generate one-time token
  - Persist hashed token + expiry
  - Send invite email
- Response: invite metadata (never raw token)

2. `GET /api/admin/users/invites`
- List pending/accepted/revoked invites for admin visibility.

3. `POST /api/admin/users/invites/{id}/resend`
- Rotate token (or reissue with previous invalidated), resend email.

4. `POST /api/admin/users/invites/{id}/revoke`
- Mark invite revoked; link no longer valid.

### Public invite completion endpoints

1. `POST /api/auth/invite/verify`
- Request: `{ token }`
- Response: minimal metadata (masked email, expiry validity)

2. `POST /api/auth/invite/accept`
- Request: `{ token, password, name? }`
- Behavior:
  - Validate token hash and expiry
  - Create/update Better Auth email-password account
  - Mark invite accepted
  - Optionally create session directly

## Admin UI Changes

1. Users tab
- Rename action text from "Invite user" to "Send invite".
- Add invite status list: Pending / Accepted / Revoked / Expired.
- Add actions: Resend, Revoke.

2. Invite acceptance route
- New page/route: `/invite/accept?token=...`
- Form: password + confirm password (+ optional name)
- States: invalid token, expired token, already used, success

3. Error UX
- Surface backend codes/messages for invite failures (email exists active, token invalid, etc.).

## Service Layer Refactor

Replace placeholder user service logic with real Better Auth-backed implementation.

1. `apps/api/src/services/users.ts`
- Remove stubs (`getUsers` empty array, random IDs)
- Query actual DB tables and Better Auth user/account relations

2. New invite service
- `apps/api/src/services/invites.ts`
- Token issuance, hashing, verify/accept/revoke/resend

3. Email service abstraction
- `apps/api/src/services/email.ts` (interface)
- `apps/api/src/services/email-provider/*.ts` (provider-specific)
- Start with no-op dev transport + production provider via env vars

## Security Requirements

1. Token handling
- Generate high-entropy random token (32+ bytes)
- Store only hashed token (e.g., SHA-256 or stronger keyed hash)
- One-time use; invalidate on accept/resend/revoke

2. Expiry
- Default 24h to 72h expiry (configurable)

3. Rate limiting
- Per-admin and per-email throttling on invite/resend endpoints

4. Password policy
- Enforce minimum strength and length on accept endpoint

5. Logging/audit
- Log invite created/resend/revoke/accepted with actor and target user IDs

## Environment + Config

Add env vars:

- `INVITE_BASE_URL` (admin/public URL used in email links)
- `INVITE_TTL_HOURS`
- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `EMAIL_API_KEY` (or provider-specific secret)

Also document dev behavior when email provider is unset:
- Return success but log invite URL to server logs for local testing.

## Migration Plan

1. Schema migration
- Add `user_invites` table and indexes

2. Backfill/compat behavior
- Existing active users remain unchanged
- Existing placeholder-created users:
  - If no password/account exists, treat as pending and allow admin to resend invite

3. Rollout
- Deploy DB migration first
- Deploy API endpoints/services (conforming to updated OpenAPI contract)
- Deploy Admin UI updates
- Announce new invite flow to admins

## Testing Plan

1. Unit tests
- Token generation/hash/validation
- Expiry and single-use behavior
- Resend invalidates old token

2. Integration tests (API)
- Admin invite create/list/resend/revoke
- Invite accept creates usable email/password login
- Reuse of accepted token fails

3. E2E tests (admin)
- Admin sends invite
- Invitee accepts with password
- Invitee logs in successfully

4. Regression tests
- Existing admin seed login still works
- User role update/delete behavior remains correct

## Acceptance Criteria

1. Invited user receives link and can set password without manual DB edits.
2. Invited user can sign in immediately after acceptance.
3. Admin can see invite status and resend/revoke invites.
4. No raw invite tokens stored in DB.
5. Expired/revoked/used links fail with clear messages.
6. Existing active users unaffected.

## Implementation Phases

### Phase 0: OpenAPI-first contract update
- Update `packages/shared/openapi.yaml` with invite lifecycle and accept-password endpoints.
- Regenerate admin API types from the updated spec.
- Review route names, request/response schemas, and error surfaces before API coding starts.

### Phase 1: Backend foundation
- Add schema + migration for invites
- Implement invite service + endpoints
- Implement Better Auth credential creation on invite accept

### Phase 2: Admin UX
- Update Users tab to invite lifecycle UI
- Add invite acceptance page

### Phase 3: Email + ops
- Wire email provider
- Add env docs and operational runbook

### Phase 4: Hardening
- Add throttling, audit logs, and comprehensive tests

## Risks and Mitigations

1. Better Auth integration mismatch
- Mitigation: validate account creation path in a dedicated integration test before UI rollout

2. Email deliverability issues
- Mitigation: provider health checks + fallback log transport in non-prod

3. Token leakage in logs
- Mitigation: redact token query params in app logs

## Suggested File Touch List

- `apps/api/src/services/users.ts`
- `apps/api/src/services/invites.ts` (new)
- `apps/api/src/services/email.ts` (new)
- `apps/api/src/routes/admin/users.ts`
- `apps/api/src/routes/auth/*` (new invite endpoints)
- `apps/api/src/openapi/schemas.ts`
- `apps/api/src/openapi/*` as needed
- `packages/db/src/schema/*`
- `packages/db/drizzle/*`
- `apps/admin/src/components/settings/UserManager.tsx`
- `apps/admin/src/pages/*` for invite accept route
- `plans/deployment-railway.md` and/or env docs for new vars

## Optional Fast Path (If Needed)

If full email invite flow must wait, implement temporary-password onboarding as an interim:

1. Admin enters temporary password at user creation.
2. User logs in and is forced to change password on first login.

This is faster but less secure and less user-friendly than tokenized invites.
