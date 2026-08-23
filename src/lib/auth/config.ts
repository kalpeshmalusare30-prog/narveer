import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials, type AuthUser } from "./authorize";
import { resolveUserPermissions } from "@/lib/rbac/check";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { loginId: {}, password: {} },
      authorize: async (c) =>
        authorizeCredentials(
          String(c?.loginId ?? ""),
          String(c?.password ?? ""),
        ),
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as AuthUser;
        token.uid = u.id;
        token.orgId = u.organizationId;
        token.sa = u.isSuperAdmin;
        token.fullName = u.fullName;
        token.perms = await resolveUserPermissions(u.id);
      }
      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const su = session.user as any;
      su.id = token.uid;
      su.organizationId = token.orgId ?? null;
      su.isSuperAdmin = !!token.sa;
      su.fullName = token.fullName ?? su.name ?? "";
      su.permissions = (token.perms as string[]) ?? [];
      return session;
    },
  },
});
