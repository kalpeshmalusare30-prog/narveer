"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export function ProfileTabs({
  personal,
  membership,
  annualFees,
  payments,
  receipts,
  documents,
  family,
}: {
  personal: ReactNode;
  membership: ReactNode;
  annualFees?: ReactNode;
  payments?: ReactNode;
  receipts?: ReactNode;
  documents?: ReactNode;
  family?: ReactNode;
}) {
  const t = useTranslations("members");
  const td = useTranslations("documents");
  const content: Record<string, ReactNode | undefined> = {
    personal,
    membership,
    annualFees,
    payments,
    receipts,
    documents,
    family,
    whatsappHistory: undefined,
  };
  const tabs = [
    { key: "personal", label: t("personal") },
    { key: "membership", label: t("membership") },
    { key: "annualFees", label: t("annualFees") },
    { key: "payments", label: t("payments") },
    { key: "receipts", label: t("receipts") },
    { key: "documents", label: td("documents") },
    { key: "family", label: td("family") },
    { key: "whatsappHistory", label: t("whatsappHistory") },
  ];
  const [active, setActive] = useState("personal");

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            data-tab={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2 text-sm font-medium ${
              active === tab.key
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {content[active] ?? (
          <div
            className="rounded-md bg-slate-50 p-6 text-sm text-slate-500"
            data-testid="later-phase"
          >
            {t("laterPhase")}
          </div>
        )}
      </div>
    </div>
  );
}
