export type SessionUser = {
  id: string;
  fullName: string;
  organizationId: string | null;
  isSuperAdmin: boolean;
  permissions: string[];
};

export async function getSessionUser(): Promise<SessionUser | null> {
  // Import lazily so modules that only need the session type/helpers (and unit
  // tests that mock this function) don't pull the next-auth runtime at import.
  const { auth } = await import("./config");
  const s = await auth();
  if (!s?.user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = s.user as any;
  if (!u.id) return null;
  return {
    id: u.id,
    fullName: u.fullName ?? "",
    organizationId: u.organizationId ?? null,
    isSuperAdmin: !!u.isSuperAdmin,
    permissions: u.permissions ?? [],
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}
