import { setRequestLocale, getTranslations } from "next-intl/server";
import { listPaymentModes } from "@/features/settings/query";
import { PageHeader, Badge } from "@/components/ui";
import { AddPaymentModeForm } from "@/features/settings/components/AddPaymentModeForm";
import { ConfigActiveToggle } from "@/features/settings/components/ConfigActiveToggle";

export default async function PaymentModesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const modes = await listPaymentModes();

  return (
    <div>
      <PageHeader title={t("settings.paymentModes")} />
      <AddPaymentModeForm />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
            <tr>
              <th className="px-4 py-2">{t("common.name")}</th>
              <th className="px-4 py-2">{t("common.status")}</th>
              <th className="px-4 py-2">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {modes.map((m) => (
              <tr
                key={m.id}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <td className="px-4 py-2 font-medium">{m.name}</td>
                <td className="px-4 py-2">
                  <Badge tone={m.isActive ? "green" : "slate"}>
                    {m.isActive ? t("common.active") : t("common.inactive")}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <ConfigActiveToggle
                    id={m.id}
                    active={m.isActive}
                    kind="paymentMode"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
