"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Nav } from "./Nav";
import { Branding } from "./Branding";
import { LocaleToggle } from "./LocaleToggle";
import { LogoutButton } from "./LogoutButton";

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function ShellChrome({
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
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div className="px-1 pt-1">
        <Branding name={orgName} logoUrl={logoUrl} />
      </div>
      <Nav
        permissions={permissions}
        isSuperAdmin={isSuperAdmin}
        onNavigate={() => setOpen(false)}
      />
      <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-3 dark:border-slate-700">
        <LocaleToggle />
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            {initials(userName)}
          </div>
          <div
            className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200"
            data-testid="current-user"
          >
            {userName}
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Branding name={orgName} logoUrl={logoUrl} />
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block dark:border-slate-700 dark:bg-slate-800">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl dark:bg-slate-800">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
