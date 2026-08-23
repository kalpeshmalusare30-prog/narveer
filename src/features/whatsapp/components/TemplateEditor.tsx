"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateTemplateAction } from "@/features/whatsapp/settings-actions";
import { Button, Textarea, Card } from "@/components/ui";

type Tpl = { id: string; type: string; name: string; body: string };

export function TemplateEditor({ templates }: { templates: Tpl[] }) {
  const t = useTranslations();
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-800 dark:text-slate-100">
        {t("whatsapp.templates")}
      </h2>
      {templates.map((tpl) => (
        <TemplateRow key={tpl.id} tpl={tpl} onSaved={() => router.refresh()} />
      ))}
    </div>
  );
}

function TemplateRow({ tpl, onSaved }: { tpl: Tpl; onSaved: () => void }) {
  const [body, setBody] = useState(tpl.body);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        {tpl.name}{" "}
        <span className="font-mono text-xs text-slate-400">({tpl.type})</span>
      </div>
      <Textarea
        rows={4}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setSaved(false);
        }}
      />
      <div className="mt-2 flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await updateTemplateAction(tpl.id, body);
              setSaved(true);
              onSaved();
            })
          }
        >
          Save
        </Button>
        {saved && <span className="text-xs text-emerald-600">✓</span>}
      </div>
    </Card>
  );
}
