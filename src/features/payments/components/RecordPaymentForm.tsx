"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  recordPayment,
  loadMemberPendingFees,
} from "@/features/payments/actions";
import { Button, Input, Select, Field, Alert, Card } from "@/components/ui";
import { memberName } from "@/features/members/name";

type Member = {
  id: string;
  fullName: string;
  fullNameEn: string | null;
  memberCode: string;
};
type Mode = { id: string; name: string };
type Fee = { id: string; yearLabel: string; pending: string };

export function RecordPaymentForm({
  members,
  modes,
}: {
  members: Member[];
  modes: Mode[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [memberId, setMemberId] = useState("");
  const [fees, setFees] = useState<Fee[]>([]);
  const [alloc, setAlloc] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState("");
  const [modeId, setModeId] = useState(modes[0]?.id ?? "");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string>();

  async function onMember(id: string) {
    setMemberId(id);
    setAlloc({});
    setAmount("");
    setError(undefined);
    if (!id) {
      setFees([]);
      return;
    }
    const f = await loadMemberPendingFees(id);
    setFees(f.map((x) => ({ id: x.id, yearLabel: x.yearLabel, pending: x.pending })));
  }

  function autoAllocate(amt: string) {
    setAmount(amt);
    let remaining = Number(amt) || 0;
    const next: Record<string, string> = {};
    for (const f of fees) {
      const pend = Number(f.pending);
      const give = Math.min(pend, Math.max(0, remaining));
      if (give > 0) next[f.id] = String(give);
      remaining -= give;
      if (remaining <= 0) break;
    }
    setAlloc(next);
  }

  const allocTotal = Object.values(alloc).reduce(
    (s, v) => s + (Number(v) || 0),
    0,
  );
  const unallocated = (Number(amount) || 0) - allocTotal;

  function submit() {
    setError(undefined);
    const allocations = Object.entries(alloc)
      .filter(([, v]) => Number(v) > 0)
      .map(([annualFeeId, v]) => ({ annualFeeId, amount: String(v) }));
    start(async () => {
      try {
        await recordPayment({
          memberId,
          amount,
          paymentModeId: modeId,
          referenceNumber: reference || null,
          allocations,
        });
        router.push("/payments");
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label={t("payments.member")} required>
          <Select
            data-testid="member-select"
            value={memberId}
            onChange={(e) => onMember(e.target.value)}
            required
          >
            <option value="">{t("payments.selectMember")}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {memberName(m, locale)} ({m.memberCode})
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={t("payments.amount")} required>
            <Input
              name="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => autoAllocate(e.target.value)}
              required
            />
          </Field>
          <Field label={t("payments.mode")} required>
            <Select value={modeId} onChange={(e) => setModeId(e.target.value)}>
              {modes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("payments.reference")}>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </Field>
        </div>

        {memberId && fees.length === 0 && (
          <p className="text-sm text-slate-500" data-testid="no-pending-fees">
            {t("payments.noPending")}
          </p>
        )}

        {fees.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-medium">
              {t("payments.allocation")}
            </div>
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{t("payments.year")}</th>
                    <th className="px-3 py-2">{t("payments.pending")}</th>
                    <th className="px-3 py-2">{t("payments.allocate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => (
                    <tr key={f.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{f.yearLabel}</td>
                      <td className="px-3 py-2">₹{f.pending}</td>
                      <td className="px-3 py-2">
                        <Input
                          inputMode="decimal"
                          className="w-28"
                          value={alloc[f.id] ?? ""}
                          data-fee={f.id}
                          onChange={(e) =>
                            setAlloc((prev) => ({
                              ...prev,
                              [f.id]: e.target.value,
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className={`mt-2 text-sm ${
                unallocated < 0 ? "text-red-600" : "text-slate-500"
              }`}
            >
              {t("payments.unallocated")}: ₹{unallocated.toFixed(2)}
            </div>
          </div>
        )}

        <Button
          type="button"
          onClick={submit}
          disabled={
            pending || !memberId || !amount || Number(amount) <= 0 || unallocated < 0
          }
        >
          {t("payments.save")}
        </Button>
      </div>
    </Card>
  );
}
