"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export function ProfileTabs({
  personal,
  membership,
}: {
  personal: ReactNode;
  membership: ReactNode;
}) {
  const t = useTranslations("members");
  const tabs = [
    { key: "personal", label: t("personal"), enabled: true },
    { key: "membership", label: t("membership"), enabled: true },
    { key: "annualFees", label: t("annualFees"), enabled: false },
    { key: "payments", label: t("payments"), enabled: false },
    { key: "receipts", label: t("receipts"), enabled: false },
    { key: "whatsappHistory", label: t("whatsappHistory"), enabled: false },
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
        {active === "personal" && personal}
        {active === "membership" && membership}
        {["annualFees", "payments", "receipts", "whatsappHistory"].includes(
          active,
        ) && (
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
