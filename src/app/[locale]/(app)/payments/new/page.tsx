import { setRequestLocale, getTranslations } from "next-intl/server";
import { listActiveMembers } from "@/features/members/query";
import { getPaymentModes } from "@/features/payments/query";
import { RecordPaymentForm } from "@/features/payments/components/RecordPaymentForm";
import { getCommunicationConfig } from "@/features/communication/query";
import { UpiQr } from "@/features/communication/components/UpiQr";
import { PageHeader, Card } from "@/components/ui";

export default async function NewPaymentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("payments");
  const tc = await getTranslations("communication");
  const [members, modes, commConfig] = await Promise.all([
    listActiveMembers(),
    getPaymentModes(),
    getCommunicationConfig().catch(() => null),
  ]);
  return (
    <div>
      <PageHeader title={t("record")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <RecordPaymentForm
          members={members}
          modes={modes.map((m) => ({ id: m.id, name: m.name }))}
        />
        {commConfig?.upiId && (
          <Card className="h-fit">
            <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
              {tc("payViaUpi")}
            </h2>
            <UpiQr
              payeeVpa={commConfig.upiId}
              payeeName={commConfig.upiPayeeName}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
