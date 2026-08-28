import { getTranslations } from "next-intl/server";
import { buildUpiUri, upiQrSvg } from "@/features/communication/upi";
import { formatINR } from "@/lib/money/money";

export async function UpiQr({
  payeeVpa,
  payeeName,
  amount,
  note,
}: {
  payeeVpa?: string | null;
  payeeName?: string | null;
  amount?: string | null;
  note?: string | null;
}) {
  if (!payeeVpa) return null;
  const t = await getTranslations("communication");
  const uri = buildUpiUri({ payeeVpa, payeeName, amount, note });
  const svg = await upiQrSvg(uri);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        className="[&_svg]:h-[220px] [&_svg]:w-[220px]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="text-sm text-slate-500">{t("scanToPay")}</p>
      {amount && (
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {t("amount")}: {formatINR(amount)}
        </p>
      )}
      <a
        href={uri}
        className="text-xs break-all text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {uri}
      </a>
    </div>
  );
}
