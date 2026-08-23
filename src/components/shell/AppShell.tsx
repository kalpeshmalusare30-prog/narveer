import type { ReactNode } from "react";
import { ShellChrome } from "./ShellChrome";

export function AppShell({
  orgName,
  logoUrl,
  userName,
  permissions,
  isSuperAdmin,
  showBell,
  notifCount,
  children,
}: {
  orgName: string;
  logoUrl?: string | null;
  userName: string;
  permissions: string[];
  isSuperAdmin: boolean;
  showBell: boolean;
  notifCount: number;
  children: ReactNode;
}) {
  return (
    <ShellChrome
      orgName={orgName}
      logoUrl={logoUrl}
      userName={userName}
      permissions={permissions}
      isSuperAdmin={isSuperAdmin}
      showBell={showBell}
      notifCount={notifCount}
    >
      {children}
    </ShellChrome>
  );
}
