"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, Input } from "@/components/ui";

type State = { error?: string; success?: boolean };

export function AddNameForm({
  action,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
}) {
  const t = useTranslations();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<State, FormData>(
    action,
    {},
  );
  useEffect(() => {
    if (state.success) {
      router.refresh();
      ref.current?.reset();
    }
  }, [state, router]);

  return (
    <form ref={ref} action={formAction} className="mb-4 flex items-center gap-2">
      <Input
        name="name"
        required
        placeholder={t("common.name")}
        className="max-w-xs"
      />
      <Button type="submit" disabled={pending}>
        {t("common.add")}
      </Button>
      {state.error && (
        <span className="text-sm text-rose-600">{state.error}</span>
      )}
    </form>
  );
}
