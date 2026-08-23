import { rawDb } from "@/lib/db/raw";
import { verifyPassword } from "./password";

export type AuthUser = {
  id: string;
  organizationId: string | null;
  isSuperAdmin: boolean;
  fullName: string;
  locale: string;
};

export async function authorizeCredentials(
  loginId: string,
  password: string,
): Promise<AuthUser | null> {
  if (!loginId || !password) return null;
  const user = await rawDb.user.findFirst({
    where: { OR: [{ loginId }, { email: loginId }], isActive: true },
  });
  if (!user) return null;
  if (!(await verifyPassword(user.passwordHash, password))) return null;
  await rawDb.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  return {
    id: user.id,
    organizationId: user.organizationId,
    isSuperAdmin: user.isSuperAdmin,
    fullName: user.fullName,
    locale: user.locale,
  };
}
