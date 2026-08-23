"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { runImport, type ImportResult } from "@/features/import/actions";
import {
  Button,
  Card,
  Field,
  Select,
  Alert,
  StatCard,
  Table,
  THead,
  TR,
  TH,
  TD,
  Badge,
} from "@/components/ui";

type ImportType = "members" | "fees" | "payments";

export function ImportPanel() {
  const t = useTranslations();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<ImportType>("members");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ImportResult>();
  const [committed, setCommitted] = useState(false);

  function build(dryRun: boolean): FormData | null {
    const file = fileRef.current?.files?.[0];
    if (!file) return null;
    const form = new FormData();
    form.set("type", type);
    form.set("dryRun", String(dryRun));
    form.set("file", file);
    return form;
  }

  function run(dryRun: boolean) {
    const form = build(dryRun);
    if (!form) return;
    start(async () => {
      const r = await runImport(form);
      setResult(r);
      setCommitted(!dryRun && !r.parseError);
      if (!dryRun) router.refresh();
    });
  }

  const hint =
    type === "members"
      ? t("import.membersHint")
      : type === "fees"
        ? t("import.feesHint")
        : t("import.paymentsHint");

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("import.type")}>
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value as ImportType);
                setResult(undefined);
                setCommitted(false);
              }}
            >
              <option value="members">{t("import.members")}</option>
              <option value="fees">{t("import.fees")}</option>
              <option value="payments">{t("import.payments")}</option>
            </Select>
          </Field>
          <Field label={t("import.selectFile")} hint={hint}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv"
              onChange={() => {
                setResult(undefined);
                setCommitted(false);
              }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700"
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">{t("import.previewNote")}</p>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => run(true)}
          >
            {t("import.preview")}
          </Button>
          <Button
            type="button"
            disabled={pending || !result || result.ok === 0 || committed}
            onClick={() => run(false)}
          >
            {t("import.import")}
          </Button>
        </div>
      </Card>

      {result?.parseError && <Alert>{result.parseError}</Alert>}

      {result && !result.parseError && (
        <>
          {committed && (
            <Alert kind="success">
              {t("import.importedNote")} ({result.imported})
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label={t("import.total")} value={result.total} tone="slate" />
            <StatCard label={t("import.ok")} value={result.ok} tone="emerald" />
            <StatCard
              label={t("import.duplicates")}
              value={result.duplicates}
              tone="amber"
            />
            <StatCard label={t("import.errors")} value={result.errors} tone="rose" />
          </div>

          <Table>
            <THead>
              <TR>
                <TH>{t("import.row")}</TH>
                <TH>{t("import.item")}</TH>
                <TH>{t("import.status")}</TH>
                <TH>{t("import.message")}</TH>
              </TR>
            </THead>
            <tbody>
              {result.rows.map((r) => (
                <TR key={r.index}>
                  <TD className="tabular">{r.index + 2}</TD>
                  <TD>{r.label}</TD>
                  <TD>
                    <Badge
                      tone={
                        r.status === "ok"
                          ? "green"
                          : r.status === "duplicate"
                            ? "amber"
                            : "red"
                      }
                    >
                      {r.status === "ok"
                        ? t("import.ok")
                        : r.status === "duplicate"
                          ? t("import.duplicates")
                          : t("import.errors")}
                    </Badge>
                  </TD>
                  <TD className="text-slate-500">{r.message ?? ""}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}
