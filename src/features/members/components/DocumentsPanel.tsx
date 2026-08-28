"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  uploadMemberDocument,
  deleteMemberDocument,
  type SaveState,
} from "@/features/members/document-actions";
import { Button, Input, Field, Alert, EmptyState } from "@/components/ui";

export type MemberDocumentRow = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPanel({
  memberId,
  documents,
  canManage,
}: {
  memberId: string;
  documents: MemberDocumentRow[];
  canManage: boolean;
}) {
  const t = useTranslations("documents");
  const tRoot = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, action] = useActionState<SaveState, FormData>(
    uploadMemberDocument,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const pfx = locale === "en" ? "" : `/${locale}`;

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteMemberDocument(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <form
          ref={formRef}
          action={action}
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="memberId" value={memberId} />
          {state.error && (
            <div className="w-full">
              <Alert>
                {tRoot.has(state.error) ? tRoot(state.error) : state.error}
              </Alert>
            </div>
          )}
          <Field label={t("uploadDoc")}>
            <Input type="file" name="file" required />
          </Field>
          <Button type="submit">{t("uploadDoc")}</Button>
        </form>
      )}

      {documents.length === 0 ? (
        <EmptyState title={t("noDocs")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900/40">
              <tr>
                <th className="px-4 py-2">{t("fileName")}</th>
                <th className="px-4 py-2">{t("size")}</th>
                <th className="px-4 py-2">{t("uploaded")}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-slate-100 dark:border-slate-700/60"
                >
                  <td className="px-4 py-2">{d.name}</td>
                  <td className="px-4 py-2">{formatSize(d.sizeBytes)}</td>
                  <td className="px-4 py-2">
                    {new Date(d.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-3">
                      <a
                        href={`${pfx}/members/${memberId}/documents/${d.id}`}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        {t("download")}
                      </a>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onDelete(d.id)}
                          disabled={pending}
                          className="text-xs font-medium text-rose-600 hover:underline"
                        >
                          {t("delete")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
