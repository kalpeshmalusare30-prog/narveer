"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  addMemberRelation,
  removeMemberRelation,
} from "@/features/members/document-actions";
import { Button, Input, Select, Field, Alert, EmptyState } from "@/components/ui";
import { memberName } from "@/features/members/name";

type RelatedMember = {
  id: string;
  fullName: string;
  fullNameEn: string | null;
  memberCode: string;
};
export type MemberRelationRow = {
  id: string;
  relationType: string;
  relatedMember: RelatedMember;
};

export function RelationsPanel({
  memberId,
  relations,
  activeMembers,
  canEdit,
}: {
  memberId: string;
  relations: MemberRelationRow[];
  activeMembers: RelatedMember[];
  canEdit: boolean;
}) {
  const t = useTranslations("documents");
  const tRoot = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [relatedMemberId, setRelatedMemberId] = useState("");
  const [relationType, setRelationType] = useState("");
  const [error, setError] = useState<string>();

  function onAdd() {
    setError(undefined);
    if (!relatedMemberId || !relationType.trim()) return;
    startTransition(async () => {
      try {
        await addMemberRelation(memberId, relatedMemberId, relationType.trim());
        setRelatedMemberId("");
        setRelationType("");
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function onRemove(id: string) {
    startTransition(async () => {
      await removeMemberRelation(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert>{tRoot.has(error) ? tRoot(error) : error}</Alert>
      )}
      {canEdit && (
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("relatedMember")}>
            <Select
              value={relatedMemberId}
              onChange={(e) => setRelatedMemberId(e.target.value)}
            >
              <option value="">--</option>
              {activeMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {memberName(m, locale)} ({m.memberCode})
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("relationType")}>
            <Input
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
            />
          </Field>
          <Button
            type="button"
            onClick={onAdd}
            disabled={pending || !relatedMemberId || !relationType.trim()}
          >
            {t("addRelation")}
          </Button>
        </div>
      )}

      {relations.length === 0 ? (
        <EmptyState title={t("noRelations")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900/40">
              <tr>
                <th className="px-4 py-2">{t("relatedMember")}</th>
                <th className="px-4 py-2">{t("relationType")}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {relations.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 dark:border-slate-700/60"
                >
                  <td className="px-4 py-2">
                    {memberName(r.relatedMember, locale)} (
                    {r.relatedMember.memberCode})
                  </td>
                  <td className="px-4 py-2">{r.relationType}</td>
                  <td className="px-4 py-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onRemove(r.id)}
                        disabled={pending}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        {t("delete")}
                      </button>
                    )}
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
