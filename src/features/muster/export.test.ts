import { describe, expect, it } from "vitest";
import { buildMusterExport } from "./export";
import type { MusterData } from "./types";

/**
 * Pure fixture: two years (2026 newest-first, 2025), five members —
 *  - NTM1 fully paid both years
 *  - NTM2 paid 2026, pending 2025 (partial)
 *  - NTM3 unpaid 2026 only (no 2025 fee)
 *  - NTM4 no fees at all (must never count as "paid")
 *  - NTM5 waived 2026 only (settled nothing — not "paid", not "pending")
 */
const member = (
  code: string,
  cells: MusterData["members"][number]["cells"],
): MusterData["members"][number] => ({
  id: `id-${code}`,
  memberCode: code,
  fullName: `${code} नाव`,
  fullNameEn: `${code} Name`,
  mobile: "9000000000",
  whatsappNumber: null,
  isActive: true,
  cells,
});

const data: MusterData = {
  years: [
    { id: "y26", label: "2026", feeAmount: "1200" },
    { id: "y25", label: "2025", feeAmount: "1000" },
  ],
  members: [
    member("NTM1", {
      y26: { feeAmount: "1200", paid: "1200", pending: "0", status: "Paid" },
      y25: { feeAmount: "1000", paid: "1000", pending: "0", status: "Paid" },
    }),
    member("NTM2", {
      y26: { feeAmount: "1200", paid: "1200", pending: "0", status: "Paid" },
      y25: { feeAmount: "1000", paid: "400", pending: "600", status: "Partial" },
    }),
    member("NTM3", {
      y26: { feeAmount: "1200", paid: "0", pending: "1200", status: "Pending" },
    }),
    member("NTM4", {}),
    member("NTM5", {
      y26: { feeAmount: "1200", paid: "0", pending: "0", status: "Waived" },
    }),
  ],
};

const codes = (rows: unknown[][]) => rows.map((r) => r[0]);

describe("buildMusterExport", () => {
  it("all + all years: every member, full year columns", () => {
    const { headers, rows, filename } = buildMusterExport(data, "all", null);
    expect(rows).toHaveLength(5);
    expect(headers).toEqual([
      "Code",
      "Name",
      "Name (English)",
      "Mobile",
      "Active",
      "2026 Fee",
      "2026 Paid",
      "2026 Pending",
      "2025 Fee",
      "2025 Paid",
      "2025 Pending",
      "Total Paid",
      "Total Pending",
    ]);
    expect(filename).toBe("muster-all.xlsx");
  });

  it("pending: only owing members, each with year + amount", () => {
    const { headers, rows } = buildMusterExport(data, "pending", null);
    expect(codes(rows)).toEqual(["NTM2", "NTM3"]);
    expect(headers).toContain("Pending Years");
    const ntm2 = rows[0];
    expect(ntm2[4]).toContain("2025");
    expect(ntm2[4]).toContain("600");
    expect(ntm2[4]).not.toContain("2026"); // 2026 is settled
    expect(ntm2[5]).toBe(600);
  });

  it("complete: only fully-settled members with the years they paid", () => {
    const { rows } = buildMusterExport(data, "complete", null);
    // NTM2 owes 2025, NTM3 owes 2026, NTM4 has no fees, NTM5 only waived.
    expect(codes(rows)).toEqual(["NTM1"]);
    expect(rows[0][4]).toBe("2026, 2025");
    expect(rows[0][5]).toBe(2200);
  });

  it("year filter narrows every variant to that year only", () => {
    const all = buildMusterExport(data, "all", "y26");
    expect(all.headers).toContain("2026 Fee");
    expect(all.headers).not.toContain("2025 Fee");
    expect(all.filename).toBe("muster-all-2026.xlsx");

    const pending = buildMusterExport(data, "pending", "y26");
    expect(codes(pending.rows)).toEqual(["NTM3"]); // NTM2 settled 2026

    const complete = buildMusterExport(data, "complete", "y26");
    expect(codes(complete.rows)).toEqual(["NTM1", "NTM2"]);
    expect(complete.rows[1][4]).toBe("2026");
  });

  it("waived-only members appear in neither pending nor complete", () => {
    const pending = buildMusterExport(data, "pending", null);
    const complete = buildMusterExport(data, "complete", null);
    expect(codes(pending.rows)).not.toContain("NTM5");
    expect(codes(complete.rows)).not.toContain("NTM5");
  });
});
