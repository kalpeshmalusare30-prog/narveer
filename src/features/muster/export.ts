import type { Cell } from "@/lib/xlsx";
import type { MusterData } from "./types";
import { formatINR } from "@/lib/money/money";

/**
 * Shape the muster register into Excel-ready rows.
 *
 * - all      → full register (optionally one year's columns only)
 * - pending  → only members who owe, with each pending year and its amount
 * - complete → only members fully settled, with the years they actually paid
 *              (members with no fee assigned are NOT "paid" — they're omitted)
 *
 * Pure function so it can be unit-tested without a database.
 */

export type MusterExportFilter = "all" | "pending" | "complete";

const r2 = (n: number) => Math.round(n * 100) / 100;
const fileSafe = (s: string) => s.replace(/[^\wऀ-ॿ-]+/g, "-");

export function buildMusterExport(
  data: MusterData,
  filter: MusterExportFilter,
  yearId: string | null,
): { headers: string[]; rows: Cell[][]; sheet: string; filename: string } {
  const years = yearId ? data.years.filter((y) => y.id === yearId) : data.years;
  const yearLabel = yearId ? (years[0]?.label ?? "") : "";

  const stats = data.members.map((m) => {
    let totalPaid = 0;
    let totalPending = 0;
    let hasFee = false;
    const paidYears: string[] = [];
    const pendingParts: string[] = [];
    for (const y of years) {
      const c = m.cells[y.id];
      if (!c) continue;
      hasFee = true;
      totalPaid += Number(c.paid);
      const pend = Number(c.pending);
      totalPending += pend;
      if (c.status === "Paid") paidYears.push(y.label);
      if (pend > 0) pendingParts.push(`${y.label}: ${formatINR(pend)}`);
    }
    return {
      m,
      totalPaid: r2(totalPaid),
      totalPending: r2(totalPending),
      hasFee,
      paidYears,
      pendingParts,
    };
  });

  type Stat = (typeof stats)[number];
  const idHeaders = ["Code", "Name", "Name (English)", "Mobile"];
  const base = (s: Stat): Cell[] => [
    s.m.memberCode,
    s.m.fullName,
    s.m.fullNameEn ?? "",
    s.m.mobile ?? "",
  ];

  let headers: string[];
  let rows: Cell[][];
  let sheet: string;

  if (filter === "pending") {
    headers = [...idHeaders, "Pending Years", "Total Pending"];
    rows = stats
      .filter((s) => s.totalPending > 0)
      .map((s) => [...base(s), s.pendingParts.join(", "), s.totalPending]);
    sheet = "Pending";
  } else if (filter === "complete") {
    headers = [...idHeaders, "Years Paid", "Total Paid"];
    rows = stats
      .filter((s) => s.hasFee && s.totalPending === 0 && s.paidYears.length > 0)
      .map((s) => [...base(s), s.paidYears.join(", "), s.totalPaid]);
    sheet = "Paid";
  } else {
    headers = [
      ...idHeaders,
      "Active",
      ...years.flatMap((y) => [
        `${y.label} Fee`,
        `${y.label} Paid`,
        `${y.label} Pending`,
      ]),
      "Total Paid",
      "Total Pending",
    ];
    rows = stats.map((s) => {
      const yearCells: Cell[] = [];
      for (const y of years) {
        const c = s.m.cells[y.id];
        if (c) {
          yearCells.push(Number(c.feeAmount), Number(c.paid), Number(c.pending));
        } else {
          yearCells.push("", "", "");
        }
      }
      return [
        ...base(s),
        s.m.isActive ? "Yes" : "No",
        ...yearCells,
        s.totalPaid,
        s.totalPending,
      ];
    });
    sheet = "Muster";
  }

  if (yearLabel) sheet = `${sheet} ${yearLabel}`.slice(0, 31); // Excel limit
  const filename = `muster-${filter}${yearLabel ? "-" + fileSafe(yearLabel) : ""}.xlsx`;
  return { headers, rows, sheet, filename };
}
