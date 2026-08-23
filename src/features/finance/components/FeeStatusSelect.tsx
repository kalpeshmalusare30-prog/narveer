"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { setFeeStatusAction } from "@/features/finance/fee-actions";

const OPTIONS = ["Pending", "Waived", "Exempted", "Cancelled"];

export function FeeStatusSelect({
  annualFeeId,
  status,
}: {
  annualFeeId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // Only the manual statuses are selectable; Partial/Paid are derived and shown as-is.
  const isDerived = status === "Partial" || status === "Paid";
  if (isDerived) return <span>{status}</span>;

  return (
    <select
      disabled={pending}
      defaultValue={status}
      onChange={(e) => {
        const v = e.target.value;
        start(async () => {
          await setFeeStatusAction(annualFeeId, v);
          router.refresh();
        });
      }}
      className="rounded border border-slate-300 px-1 py-0.5 text-xs"
    >
      {OPTIONS.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
