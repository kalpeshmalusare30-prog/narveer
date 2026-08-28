"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  sendReminderAction,
  sendThankYouAction,
  sendConfirmationAction,
  shareReceiptAction,
} from "@/features/whatsapp/actions";

export function WaSendButton({
  kind,
  id,
  label,
}: {
  kind: "reminder" | "thankyou" | "confirmation" | "receipt";
  id: string;
  label: string;
}) {
  const t = useTranslations("whatsapp");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string>();

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              const r =
                kind === "reminder"
                  ? await sendReminderAction(id)
                  : kind === "thankyou"
                    ? await sendThankYouAction(id)
                    : kind === "confirmation"
                      ? await sendConfirmationAction(id)
                      : await shareReceiptAction(id);
              setMsg(r.configured ? t("sent") : t("queued"));
              router.refresh();
            } catch {
              setMsg("!");
            }
          })
        }
        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline disabled:opacity-50"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {label}
      </button>
      {msg && <span className="text-[11px] text-slate-400">{msg}</span>}
    </span>
  );
}
