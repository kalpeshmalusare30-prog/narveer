"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { assignMembersAction } from "@/features/finance/fee-actions";
import { memberName } from "@/features/members/name";
import { Button } from "@/components/ui";

export function AssignMembersPanel({
  financialYearId,
  members,
}: {
  financialYearId: string;
  members: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    memberCode: string;
  }[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sel, setSel] = useState<Set<string>>(new Set());

  if (!members.length) return null;

  const toggle = (id: string) => {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 text-sm font-medium">{t("finance.notAssigned")}</div>
      <div className="mb-3 grid max-h-56 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
        {members.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sel.has(m.id)}
              onChange={() => toggle(m.id)}
            />
            <span>
              {memberName(m, locale)}{" "}
              <span className="font-mono text-xs text-slate-400">
                {m.memberCode}
              </span>
            </span>
          </label>
        ))}
      </div>
      <Button
        type="button"
        disabled={!sel.size || pending}
        onClick={() =>
          start(async () => {
            await assignMembersAction(financialYearId, [...sel]);
            setSel(new Set());
            router.refresh();
          })
        }
      >
        {t("finance.assignSelected")} ({sel.size})
      </Button>
    </div>
  );
}
