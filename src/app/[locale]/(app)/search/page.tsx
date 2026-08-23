import { setRequestLocale, getTranslations } from "next-intl/server";
import { SearchIcon, Users, ReceiptText } from "lucide-react";
import { globalSearch } from "@/features/search/query";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card, EmptyState, Badge } from "@/components/ui";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q } = await searchParams;
  const t = await getTranslations();
  const term = (q ?? "").trim();
  const results = term ? await globalSearch(term) : { members: [], receipts: [] };
  const empty = results.members.length === 0 && results.receipts.length === 0;

  return (
    <div>
      <PageHeader
        title={t("search.title")}
        subtitle={term ? `“${term}”` : undefined}
      />
      {empty ? (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title={t("search.noResults")}
        />
      ) : (
        <div className="space-y-6">
          {results.members.length > 0 && (
            <div>
              <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
                <Users className="h-4 w-4" /> {t("search.members")}
              </h2>
              <Card className="divide-y divide-slate-100 !p-0">
                {results.members.map((m) => (
                  <Link
                    key={m.id}
                    href={`/members/${m.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-800">
                      {m.fullName}
                    </span>
                    <span className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="tabular">{m.mobile}</span>
                      <Badge tone="slate">{m.memberCode}</Badge>
                    </span>
                  </Link>
                ))}
              </Card>
            </div>
          )}
          {results.receipts.length > 0 && (
            <div>
              <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
                <ReceiptText className="h-4 w-4" /> {t("search.receipts")}
              </h2>
              <Card className="divide-y divide-slate-100 !p-0">
                {results.receipts.map((r) => (
                  <Link
                    key={r.id}
                    href={`/members`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                  >
                    <span className="font-mono font-medium text-slate-800">
                      {r.receiptNumber}
                    </span>
                    <span className="text-sm text-slate-500">
                      {r.memberName}
                    </span>
                  </Link>
                ))}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
