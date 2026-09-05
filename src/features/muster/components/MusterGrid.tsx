"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, MessageCircle, Pencil, Plus, UserX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge, Button, Input, StatusBadge } from "@/components/ui";
import { formatINR } from "@/lib/money/money";
import { memberName } from "@/features/members/name";
import {
  normalizeWaNumber,
  waLink,
  fillTemplate,
} from "@/features/whatsapp/wa-utils";
import type { WaClickContext } from "@/features/whatsapp/click-to-send";
import {
  musterSetPaidAction,
  musterUpdateMemberAction,
  musterQuickAddAction,
  musterDeactivateAction,
  musterRestoreAction,
} from "@/features/muster/actions";
import type {
  MusterCell,
  MusterData,
  MusterMember,
  MusterYear,
} from "@/features/muster/types";

/* ---------------------------------------------------------------- styling */

// Compact in-cell input (the design-system Input is too tall for register rows).
const CELL_INPUT =
  "rounded-lg border border-indigo-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-indigo-500/50 dark:bg-slate-800 dark:text-slate-100";

const TD_BASE = "border-b border-slate-100 px-3 py-2 dark:border-slate-700/60";
// Sticky identity columns. On phones only the (narrower) name column sticks —
// pinning both code + name would cover nearly the whole viewport.
const STICKY_C1 = `sm:sticky sm:left-0 z-10 w-20 min-w-20 sm:w-24 sm:min-w-24 bg-white dark:bg-slate-800 ${TD_BASE}`;
const STICKY_C2 = `sticky left-0 sm:left-24 z-10 w-36 min-w-36 max-w-36 sm:w-56 sm:min-w-56 sm:max-w-56 bg-white dark:bg-slate-800 ${TD_BASE}`;
const TH_BASE =
  "sticky top-0 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900";
const TF_BASE =
  "sticky bottom-0 border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold tabular text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";

const CELL_TINT: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  partial: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  unpaid: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  none: "",
};

function TinySpinner() {
  return (
    <span
      className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"
      aria-label="saving"
    />
  );
}

/* ------------------------------------------------------------------- Toast */

function Toast({ kind, text }: { kind: "ok" | "error"; text: string }) {
  return (
    <div
      role="status"
      data-testid="muster-toast"
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
        kind === "ok" ? "bg-emerald-600" : "bg-rose-600"
      }`}
    >
      {text}
    </div>
  );
}

/* -------------------------------------------------------- EditableTextCell */

function EditableTextCell({
  display,
  editValue,
  canEdit,
  onSave,
}: {
  display: string;
  editValue: string;
  canEdit: boolean;
  /** Resolves true when the save was accepted (parent updates state + toasts). */
  onSave: (value: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const skipBlur = useRef(false);

  const begin = () => {
    if (!canEdit || saving) return;
    skipBlur.current = false;
    setVal(editValue);
    setEditing(true);
  };
  const commit = async () => {
    setEditing(false);
    const next = val.trim();
    if (next === editValue.trim()) return;
    setSaving(true);
    await onSave(next);
    setSaving(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            skipBlur.current = true;
            void commit();
          } else if (e.key === "Escape") {
            skipBlur.current = true;
            setEditing(false);
          }
        }}
        onBlur={() => {
          if (skipBlur.current) {
            skipBlur.current = false;
            return;
          }
          void commit();
        }}
        className={`${CELL_INPUT} w-full`}
      />
    );
  }

  const inner = (
    <>
      <span className="min-w-0 truncate">{display || "—"}</span>
      {saving ? (
        <TinySpinner />
      ) : canEdit ? (
        <Pencil className="h-3 w-3 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
      ) : null}
    </>
  );
  if (!canEdit) {
    return <span className="flex min-w-0 items-center gap-1.5">{inner}</span>;
  }
  return (
    <button
      type="button"
      onClick={begin}
      className="group flex w-full min-w-0 cursor-text items-center gap-1.5 text-left"
    >
      {inner}
    </button>
  );
}

/* ------------------------------------------------------------- VarganiCell */

function VarganiCell({
  year,
  cell,
  canPay,
  onSave,
}: {
  year: MusterYear;
  cell: MusterCell | undefined;
  canPay: boolean;
  /** Resolves true on ok (parent swaps in result.cell + toasts). */
  onSave: (totalPaid: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const skipBlur = useRef(false);

  const waived = !!cell && (cell.status === "Waived" || cell.status === "Exempted");
  const editable = canPay && !waived;
  const initial = cell ? cell.paid : "0";

  const state = !cell
    ? "none"
    : waived || Number(cell.feeAmount) <= 0
      ? "none"
      : Number(cell.paid) >= Number(cell.feeAmount)
        ? "paid"
        : Number(cell.paid) > 0
          ? "partial"
          : "unpaid";

  const begin = () => {
    if (!editable || saving || editing) return;
    skipBlur.current = false;
    setVal(initial);
    setEditing(true);
  };
  const commit = async () => {
    setEditing(false);
    const next = val.trim();
    if (next === "" || Number(next) === Number(initial)) return;
    setSaving(true);
    const ok = await onSave(next);
    setSaving(false);
    if (ok) {
      setFlash(true);
      setTimeout(() => setFlash(false), 900);
    }
  };

  return (
    <td
      data-year={year.label}
      onClick={begin}
      className={`${TD_BASE} whitespace-nowrap text-right transition-colors ${
        flash ? "bg-emerald-200/70 dark:bg-emerald-500/30" : CELL_TINT[state]
      } ${editable && !editing ? "cursor-pointer" : ""}`}
    >
      {editing ? (
        <input
          autoFocus
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              skipBlur.current = true;
              void commit();
            } else if (e.key === "Escape") {
              skipBlur.current = true;
              setEditing(false);
            }
          }}
          onBlur={() => {
            if (skipBlur.current) {
              skipBlur.current = false;
              return;
            }
            void commit();
          }}
          className={`${CELL_INPUT} w-24 text-right tabular`}
        />
      ) : waived && cell ? (
        <StatusBadge status={cell.status} />
      ) : cell ? (
        <span className="inline-flex items-center gap-1.5">
          {saving && <TinySpinner />}
          <span className="font-semibold tabular">{formatINR(cell.paid)}</span>
          <span className="text-[10px] text-slate-400">
            / {formatINR(cell.feeAmount)}
          </span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          {saving && <TinySpinner />}
          <span className="text-slate-400">—</span>
        </span>
      )}
    </td>
  );
}

/* -------------------------------------------------------------- MusterGrid */

export function MusterGrid({
  data,
  locale,
  perms,
  canViewFees,
  wa,
}: {
  data: MusterData;
  locale: string;
  perms: {
    editMember: boolean;
    pay: boolean;
    create: boolean;
    deactivate: boolean;
  };
  canViewFees: boolean;
  wa: WaClickContext | null;
}) {
  const t = useTranslations("muster");
  const tm = useTranslations("members");
  const tc = useTranslations("common");
  const pfx = locale === "en" ? "" : `/${locale}`;

  const [members, setMembers] = useState<MusterMember[]>(data.members);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  // Year scope for the Excel downloads ("" = all years).
  const [exportYear, setExportYear] = useState("");

  const [toast, setToast] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (kind: "ok" | "error", text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, text });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  /* quick add */
  const [addName, setAddName] = useState("");
  const [addMobile, setAddMobile] = useState("");
  const [addErr, setAddErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const q = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      members.filter((m) => {
        if (!showInactive && !m.isActive) return false;
        if (!q) return true;
        return [m.memberCode, m.fullName, m.fullNameEn ?? "", m.mobile ?? ""].some(
          (s) => s.toLowerCase().includes(q),
        );
      }),
    [members, q, showInactive],
  );

  const totals = useMemo(() => {
    const perYear: Record<string, { paid: number; fee: number }> = {};
    for (const y of data.years) perYear[y.id] = { paid: 0, fee: 0 };
    let pending = 0;
    for (const m of visible) {
      for (const y of data.years) {
        const c = m.cells[y.id];
        if (!c) continue;
        perYear[y.id].paid += Number(c.paid);
        perYear[y.id].fee += Number(c.feeAmount);
        pending += Number(c.pending);
      }
    }
    return { perYear, pending };
  }, [visible, data.years]);

  /* ------------------------------------------------------------- mutations */

  const saveField = async (
    m: MusterMember,
    field: "fullName" | "fullNameEn" | "mobile",
    value: string,
  ): Promise<boolean> => {
    const res = await musterUpdateMemberAction({ memberId: m.id, field, value });
    if (res.ok) {
      setMembers((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, [field]: value } : x)),
      );
      return true;
    }
    showToast("error", t(`errors.${res.error}`));
    return false;
  };

  const savePaid = async (
    m: MusterMember,
    y: MusterYear,
    totalPaid: string,
  ): Promise<boolean> => {
    const res = await musterSetPaidAction({
      memberId: m.id,
      financialYearId: y.id,
      totalPaid,
    });
    if (res.ok) {
      setMembers((prev) =>
        prev.map((x) =>
          x.id === m.id ? { ...x, cells: { ...x.cells, [y.id]: res.cell } } : x,
        ),
      );
      if (res.receiptNumber) {
        showToast("ok", t("receiptSaved", { number: res.receiptNumber }));
      }
      return true;
    }
    showToast("error", t(`errors.${res.error}`));
    return false;
  };

  const submitAdd = async () => {
    const fullName = addName.trim();
    if (!fullName) {
      setAddErr(t("errors.NAME_REQUIRED"));
      return;
    }
    setAdding(true);
    setAddErr(null);
    const res = await musterQuickAddAction({
      fullName,
      fullNameEn: locale === "en" ? fullName : null,
      mobile: addMobile.trim() || null,
    });
    setAdding(false);
    if (res.ok) {
      setMembers((prev) =>
        [...prev, res.member].sort((a, b) =>
          a.memberCode.localeCompare(b.memberCode, undefined, { numeric: true }),
        ),
      );
      setAddName("");
      setAddMobile("");
    } else {
      setAddErr(t(`errors.${res.error}`));
    }
  };

  const deactivate = async (m: MusterMember) => {
    if (!window.confirm(t("confirmDeactivate"))) return;
    const res = await musterDeactivateAction(m.id);
    if (res.ok) {
      setMembers((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, isActive: false } : x)),
      );
    } else {
      showToast("error", t(`errors.${res.error}`));
    }
  };

  const restore = async (m: MusterMember) => {
    const res = await musterRestoreAction(m.id);
    if (res.ok) {
      setMembers((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, isActive: true } : x)),
      );
    } else {
      showToast("error", t(`errors.${res.error}`));
    }
  };

  /* --------------------------------------------------------------- render */

  const yearColCount = canViewFees ? data.years.length + 1 : 0; // years + total pending

  return (
    <div>
      {/* toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Input
          data-testid="muster-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            data-testid="muster-show-inactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          {t("showInactive")}
        </label>
        <span className="text-sm text-slate-500">
          {t("membersCount", { count: visible.length })}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Download className="h-3.5 w-3.5" />
            {t("export")}
          </span>
          <select
            data-testid="muster-export-year"
            value={exportYear}
            onChange={(e) => setExportYear(e.target.value)}
            className="h-8 rounded-xl border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 shadow-sm focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">{t("yearAll")}</option>
            {data.years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </select>
          <div
            data-testid="muster-export"
            className="inline-flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800"
          >
            <a
              href={`${pfx}/muster/export?filter=all${exportYear ? `&year=${exportYear}` : ""}`}
              className="inline-flex h-8 items-center px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t("exportAll")}
            </a>
            <a
              href={`${pfx}/muster/export?filter=pending${exportYear ? `&year=${exportYear}` : ""}`}
              className="inline-flex h-8 items-center border-l border-slate-200 px-3 text-xs font-medium text-rose-700 transition hover:bg-rose-50 dark:border-slate-600 dark:text-rose-400 dark:hover:bg-slate-700"
            >
              {t("exportPending")}
            </a>
            <a
              href={`${pfx}/muster/export?filter=complete${exportYear ? `&year=${exportYear}` : ""}`}
              className="inline-flex h-8 items-center border-l border-slate-200 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 dark:border-slate-600 dark:text-emerald-400 dark:hover:bg-slate-700"
            >
              {t("exportComplete")}
            </a>
          </div>
        </div>
      </div>

      {/* register */}
      <div className="elev max-h-[72vh] overflow-auto rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className={`${TH_BASE} z-30 w-20 min-w-20 sm:left-0 sm:w-24 sm:min-w-24`}>
                {tm("memberCode")}
              </th>
              <th className={`${TH_BASE} left-0 z-30 w-36 min-w-36 sm:left-24 sm:w-56 sm:min-w-56`}>
                {tm("fullName")}
              </th>
              <th className={`${TH_BASE} z-20`}>{tm("mobile")}</th>
              {canViewFees &&
                data.years.map((y) => (
                  <th key={y.id} className={`${TH_BASE} z-20 text-right`}>
                    <div>{y.label}</div>
                    <div className="text-[10px] font-normal normal-case tracking-normal text-slate-400 tabular">
                      {formatINR(y.feeAmount)}
                    </div>
                  </th>
                ))}
              {canViewFees && (
                <th className={`${TH_BASE} z-20 text-right`}>{t("totalPending")}</th>
              )}
              <th className={`${TH_BASE} z-20`}>{tc("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {perms.create && (
              <tr data-testid="muster-add-row">
                <td className={`${STICKY_C1} text-slate-400`}>
                  <Plus className="h-4 w-4" />
                </td>
                <td className={STICKY_C2}>
                  <input
                    data-testid="muster-add-name"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitAdd();
                    }}
                    placeholder={t("addName")}
                    className={`${CELL_INPUT} w-full`}
                  />
                  {addErr && (
                    <p className="mt-1 text-xs text-rose-600">{addErr}</p>
                  )}
                </td>
                <td className={TD_BASE}>
                  <input
                    data-testid="muster-add-mobile"
                    value={addMobile}
                    onChange={(e) => setAddMobile(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitAdd();
                    }}
                    placeholder={t("addMobile")}
                    inputMode="tel"
                    className={`${CELL_INPUT} w-32`}
                  />
                </td>
                {Array.from({ length: yearColCount }, (_, i) => (
                  <td key={i} className={TD_BASE} />
                ))}
                <td className={TD_BASE}>
                  <Button
                    size="sm"
                    data-testid="muster-add-btn"
                    disabled={adding}
                    onClick={() => void submitAdd()}
                  >
                    {t("add")}
                  </Button>
                </td>
              </tr>
            )}
            {visible.map((m) => {
              const rowPending = data.years.reduce(
                (s, y) => s + Number(m.cells[y.id]?.pending ?? 0),
                0,
              );
              return (
                <tr
                  key={m.id}
                  data-testid={`muster-row-${m.memberCode}`}
                  className={m.isActive ? "" : "opacity-60"}
                >
                  <td className={`${STICKY_C1} font-mono text-xs`}>
                    {m.memberCode}
                  </td>
                  <td className={STICKY_C2}>
                    <div className="flex min-w-0 items-center gap-2">
                      <EditableTextCell
                        display={memberName(m, locale)}
                        editValue={
                          locale === "en"
                            ? (m.fullNameEn ?? m.fullName)
                            : m.fullName
                        }
                        canEdit={perms.editMember}
                        onSave={(v) =>
                          saveField(
                            m,
                            locale === "en" ? "fullNameEn" : "fullName",
                            v,
                          )
                        }
                      />
                      {!m.isActive && (
                        <Badge tone="slate">{t("inactive")}</Badge>
                      )}
                    </div>
                  </td>
                  <td className={`${TD_BASE} tabular text-slate-600 dark:text-slate-300`}>
                    <EditableTextCell
                      display={m.mobile || "—"}
                      editValue={m.mobile ?? ""}
                      canEdit={perms.editMember}
                      onSave={(v) => saveField(m, "mobile", v)}
                    />
                  </td>
                  {canViewFees &&
                    data.years.map((y) => (
                      <VarganiCell
                        key={y.id}
                        year={y}
                        cell={m.cells[y.id]}
                        canPay={perms.pay}
                        onSave={(v) => savePaid(m, y, v)}
                      />
                    ))}
                  {canViewFees && (
                    <td
                      className={`${TD_BASE} whitespace-nowrap text-right font-semibold tabular ${
                        rowPending > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      {formatINR(rowPending)}
                    </td>
                  )}
                  <td className={TD_BASE}>
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <Link
                        href={`/members/${m.id}`}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        {tc("view")}
                      </Link>
                      {(() => {
                        const waNum = wa
                          ? normalizeWaNumber(m.whatsappNumber || m.mobile)
                          : null;
                        if (!waNum || !wa) return null;
                        const unpaid = rowPending > 0;
                        const text = unpaid
                          ? fillTemplate(wa.reminderBody, {
                              memberName: m.fullName,
                              organizationName: wa.orgName,
                              totalPending: formatINR(rowPending),
                              pendingAmount: formatINR(rowPending),
                              contactNumber: wa.contactNumber,
                            })
                          : fillTemplate(wa.thankyouBody, {
                              memberName: m.fullName,
                              organizationName: wa.orgName,
                              contactNumber: wa.contactNumber,
                            });
                        return (
                          <a
                            href={waLink(waNum, text)}
                            target="_blank"
                            rel="noreferrer"
                            data-testid={`muster-wa-${m.memberCode}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {unpaid ? tm("remind") : tm("thanks")}
                          </a>
                        );
                      })()}
                      {perms.deactivate &&
                        (m.isActive ? (
                          <button
                            type="button"
                            data-testid={`muster-deactivate-${m.memberCode}`}
                            onClick={() => void deactivate(m)}
                            title={t("deactivate")}
                            aria-label={t("deactivate")}
                            className="text-slate-300 transition hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            data-testid={`muster-restore-${m.memberCode}`}
                            onClick={() => void restore(m)}
                            className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                          >
                            {t("restore")}
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className={`${TF_BASE} z-30 sm:left-0`} />
              <td className={`${TF_BASE} left-0 z-30 sm:left-24`}>
                {t("membersCount", { count: visible.length })}
              </td>
              <td className={`${TF_BASE} z-20`} />
              {canViewFees &&
                data.years.map((y) => (
                  <td
                    key={y.id}
                    className={`${TF_BASE} z-20 whitespace-nowrap text-right`}
                  >
                    {formatINR(totals.perYear[y.id]?.paid ?? 0)}
                    <span className="font-normal text-slate-400">
                      {" "}
                      / {formatINR(totals.perYear[y.id]?.fee ?? 0)}
                    </span>
                  </td>
                ))}
              {canViewFees && (
                <td
                  className={`${TF_BASE} z-20 whitespace-nowrap text-right ${
                    totals.pending > 0 ? "text-rose-600 dark:text-rose-400" : ""
                  }`}
                >
                  {formatINR(totals.pending)}
                </td>
              )}
              <td className={`${TF_BASE} z-20`} />
            </tr>
          </tfoot>
        </table>
      </div>

      {toast && <Toast kind={toast.kind} text={toast.text} />}
    </div>
  );
}
