"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { sendBulkRemindersAction } from "@/features/whatsapp/actions";
import { Button, Card } from "@/components/ui";
import { formatINR } from "@/lib/money/money";
import { memberName } from "@/features/members/name";

type Row = {
  memberId: string;
  memberName: string;
  memberNameEn?: string | null;
  memberCode: string;
  totalPending: string;
};

export function BulkReminderPanel({ members }: { members: Row[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string>();

  if (!members.length) return null;

  const toggle = (id: string) =>
    setSel((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Card className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">
          {t("whatsapp.bulkReminders")}
        </h2>
        <button
          type="button"
          onClick={() =>
            setSel(
              sel.size === members.length
                ? new Set()
                : new Set(members.map((m) => m.memberId)),
            )
          }
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          {sel.size === members.length
            ? t("common.cancel")
            : t("whatsapp.selectPending")}
        </button>
      </div>
      <div className="mb-3 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
        {members.map((m) => (
          <label
            key={m.memberId}
            className="flex items-center gap-3 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={sel.has(m.memberId)}
              onChange={() => toggle(m.memberId)}
            />
            <span className="flex-1">
              {memberName({ fullName: m.memberName, fullNameEn: m.memberNameEn }, locale)}
            </span>
            <span className="tabular text-rose-600">
              {formatINR(m.totalPending)}
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          disabled={!sel.size || pending}
          onClick={() =>
            start(async () => {
              const r = await sendBulkRemindersAction([...sel]);
              setResult(
                `${t("whatsapp.sent")} ${r.sent} · ${t("whatsapp.queued")} ${r.queued} · ${r.failed} ✕`,
              );
              setSel(new Set());
              router.refresh();
            })
          }
        >
          {t("whatsapp.sendReminder")} ({sel.size})
        </Button>
        {result && <span className="text-sm text-slate-500">{result}</span>}
      </div>
    </Card>
  );
}
