import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { LocaleToggle } from "./LocaleToggle";
import { LogoutButton } from "./LogoutButton";
import { Branding } from "./Branding";

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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <aside className="flex w-64 flex-col gap-4 border-r border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <Branding name={orgName} logoUrl={logoUrl} />
        <Nav permissions={permissions} isSuperAdmin={isSuperAdmin} />
        <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-700">
          <LocaleToggle />
          <div
            className="truncate text-xs text-slate-500"
            data-testid="current-user"
          >
            {userName}
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}
