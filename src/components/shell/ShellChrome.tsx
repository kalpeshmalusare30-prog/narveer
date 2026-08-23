"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Nav } from "./Nav";
import { Branding } from "./Branding";
import { LocaleToggle } from "./LocaleToggle";
import { LogoutButton } from "./LogoutButton";
import { SearchBox } from "./SearchBox";
import { NotificationBell } from "./NotificationBell";

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
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const tc = useTranslations("common");

  const sidebar = (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="px-1 pt-1">
        <Branding name={orgName} logoUrl={logoUrl} />
      </div>
      <SearchBox onNavigate={close} />
      <Nav
        permissions={permissions}
        isSuperAdmin={isSuperAdmin}
        onNavigate={close}
      />
      <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-3">
        <LocaleToggle />
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {initials(userName)}
          </div>
          <div
            className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700"
            data-testid="current-user"
          >
            {userName}
          </div>
          {showBell && <NotificationBell count={notifCount} onNavigate={close} />}
        </div>
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={tc("openMenu")}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <Branding name={orgName} logoUrl={logoUrl} />
        </div>
        {showBell && <NotificationBell count={notifCount} />}
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={close}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={close}
                aria-label={tc("closeMenu")}
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
        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
