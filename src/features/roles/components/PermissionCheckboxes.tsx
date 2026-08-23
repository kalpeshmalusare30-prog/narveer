"use client";

import { PERMISSIONS } from "@/lib/rbac/permissions";

export function PermissionCheckboxes({ selected }: { selected?: string[] }) {
  const sel = new Set(selected ?? []);
  const groups: Record<string, string[]> = {};
  for (const p of PERMISSIONS) {
    const g = p.split(".")[0];
    (groups[g] ??= []).push(p);
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Object.entries(groups).map(([g, perms]) => (
        <div key={g}>
          <div className="mb-1 text-xs font-semibold uppercase text-slate-500">
            {g}
          </div>
          <div className="flex flex-col gap-1">
            {perms.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="permissionKeys"
                  value={p}
                  defaultChecked={sel.has(p)}
                />
                <span className="font-mono text-xs">{p}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
