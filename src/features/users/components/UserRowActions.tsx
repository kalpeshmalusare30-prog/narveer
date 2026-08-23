"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  resetPasswordAction,
  toggleUserActiveAction,
} from "@/features/users/actions";
import { Input, Button } from "@/components/ui";

export function UserRowActions({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const t = useTranslations("users");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await toggleUserActiveAction(id, !active);
            router.refresh();
          })
        }
        className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
      >
        {active ? t("deactivate") : t("activate")}
      </button>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          {t("resetPassword")}
        </button>
      ) : (
        <span className="flex items-center gap-1">
          <Input
            aria-label={t("newPassword")}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            type="password"
            placeholder={t("newPassword")}
            className="h-8 w-36 text-xs"
          />
          <Button
            type="button"
            className="px-2 py-1 text-xs"
            disabled={pending || pw.length < 6}
            onClick={() =>
              start(async () => {
                await resetPasswordAction(id, pw);
                setOpen(false);
                setPw("");
              })
            }
          >
            OK
          </Button>
        </span>
      )}
    </div>
  );
}
