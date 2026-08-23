"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "./config";
import { getSessionUser } from "./session";
import { rawDb } from "@/lib/db/raw";
import { hashPassword, verifyPassword } from "./password";
import { writeAudit } from "@/lib/audit/audit";

export type FormState = { error?: string; success?: boolean };

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const loginId = String(formData.get("loginId") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", {
      loginId,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "invalidCredentials" };
    throw error; // re-throw NEXT_REDIRECT so the redirect happens
  }
  return {};
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: "UNAUTHENTICATED" };

  const oldPassword = String(formData.get("oldPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 6) return { error: "passwordMismatch" };
  if (newPassword !== confirmPassword) return { error: "passwordMismatch" };

  const dbUser = await rawDb.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(dbUser.passwordHash, oldPassword))) {
    return { error: "wrongCurrentPassword" };
  }

  await rawDb.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await writeAudit({
    action: "change_password",
    module: "users",
    recordType: "User",
    recordId: user.id,
    organizationId: user.organizationId,
    userId: user.id,
  });
  return { success: true };
}
