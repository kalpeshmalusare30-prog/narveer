import { setRequestLocale, getTranslations } from "next-intl/server";
import { HeartHandshake } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { listDonations, getDonationsTotal } from "@/features/donations/query";
import {
  PageHeader,
  Table,
  THead,
  TR,
  TH,
  TD,
  Badge,
  StatCard,
  EmptyState,
  Button,
} from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { formatINR } from "@/lib/money/money";
import { memberName } from "@/features/members/name";
import { VoidDonationButton } from "@/features/donations/components/DonationForm";

export const dynamic = "force-dynamic";

export default async function DonationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const canCreate = !!me?.permissions.includes("donation.create");
  const canVoid = !!me?.permissions.includes("donation.void");

  const [rows, total] = await Promise.all([
    listDonations(),
    getDonationsTotal(),
  ]);

  return (
    <div>
      <PageHeader
        title={t("donations.title")}
        actions={
          canCreate ? (
            <Link href="/donations/new">
              <Button>{t("donations.add")}</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 max-w-xs">
        <StatCard label={t("donations.total")} value={formatINR(total)} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<HeartHandshake className="h-6 w-6" />}
          title={t("donations.noDonations")}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("donations.donor")}</TH>
              <TH>{t("donations.kind")}</TH>
              <TH>{t("donations.member")}</TH>
              <TH className="text-right">{t("donations.amount")}</TH>
              <TH>{t("donations.date")}</TH>
              <TH>{t("donations.mode")}</TH>
              {canVoid && <TH />}
            </TR>
          </THead>
          <tbody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>{r.donorName}</TD>
                <TD>
                  <Badge tone={r.kind === "Sponsorship" ? "indigo" : "sky"}>
                    {r.kind === "Sponsorship"
                      ? t("donations.sponsorship")
                      : t("donations.donation")}
                  </Badge>
                </TD>
                <TD>{r.member ? memberName(r.member, locale) : t("donations.none")}</TD>
                <TD className="text-right tabular font-medium">
                  {formatINR(r.amount.toString())}
                  {r.isVoided && (
                    <Badge tone="red">{t("donations.voided")}</Badge>
                  )}
                </TD>
                <TD>{new Date(r.donationDate).toLocaleDateString("en-IN")}</TD>
                <TD>{r.paymentMode?.name ?? t("donations.none")}</TD>
                {canVoid && (
                  <TD>
                    {!r.isVoided && <VoidDonationButton id={r.id} />}
                  </TD>
                )}
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
