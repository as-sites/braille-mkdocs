type InviteEmailPayload = {
  to: string;
  name: string;
  role: "admin" | "editor";
  inviteUrl: string;
  expiresAt: Date;
};

function getProvider(): string {
  return (process.env.EMAIL_PROVIDER ?? "log").trim().toLowerCase();
}

export async function sendInviteEmail(payload: InviteEmailPayload): Promise<void> {
  const provider = getProvider();

  // Development fallback: do not block invite flow when no provider is configured.
  if (provider === "log" || !process.env.EMAIL_API_KEY) {
    console.log("[invite-email]", {
      provider,
      to: payload.to,
      name: payload.name,
      role: payload.role,
      expiresAt: payload.expiresAt.toISOString(),
      inviteUrl: payload.inviteUrl,
    });
    return;
  }

  // Placeholder for provider wiring in phase 3. Keep non-blocking for now.
  console.warn(`[invite-email] EMAIL_PROVIDER=${provider} is not implemented yet; falling back to log output.`);
  console.log("[invite-email]", {
    provider,
    to: payload.to,
    name: payload.name,
    role: payload.role,
    expiresAt: payload.expiresAt.toISOString(),
    inviteUrl: payload.inviteUrl,
  });
}