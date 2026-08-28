"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  setMemberPhoto,
  type SaveState,
} from "@/features/members/document-actions";
import { Button, Input, Field, Alert } from "@/components/ui";

export function PhotoUpload({
  memberId,
  photoDataUri,
  canEdit,
}: {
  memberId: string;
  photoDataUri?: string | null;
  canEdit: boolean;
}) {
  const t = useTranslations("documents");
  const tRoot = useTranslations();
  const router = useRouter();
  const [state, action] = useActionState<SaveState, FormData>(
    setMemberPhoto,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-700">
        {photoDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoDataUri}
            alt={t("photo")}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-slate-400">{t("photo")}</span>
        )}
      </div>
      {canEdit && (
        <form
          ref={formRef}
          action={action}
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="memberId" value={memberId} />
          <Field label={t("uploadPhoto")}>
            <Input type="file" name="file" accept="image/*" required />
          </Field>
          <Button type="submit">{t("uploadPhoto")}</Button>
        </form>
      )}
      {state.error && (
        <Alert>{tRoot.has(state.error) ? tRoot(state.error) : state.error}</Alert>
      )}
    </div>
  );
}
