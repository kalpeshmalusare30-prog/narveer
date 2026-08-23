import type { ReactNode } from "react";
import { ShellChrome } from "./ShellChrome";

export function AppShell({
  orgName,
  logoUrl,
  userName,
  permissions,
  isSuperAdmin,
  children,
}: {
  orgName: string;
  logoUrl?: string | null;
  userName: string;
  permissions: string[];
  isSuperAdmin: boolean;
  children: ReactNode;
}) {
  return (
    <ShellChrome
      orgName={orgName}
      logoUrl={logoUrl}
      userName={userName}
      permissions={permissions}
      isSuperAdmin={isSuperAdmin}
    >
      {children}
    </ShellChrome>
  );
}
