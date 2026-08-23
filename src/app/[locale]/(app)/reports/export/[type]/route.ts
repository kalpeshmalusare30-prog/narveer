import { NextRequest } from "next/server";
import {
  collectionReport,
  paymentModeReport,
  incomeByCategoryReport,
  expenseByCategoryReport,
  whatsappReport,
} from "@/features/reports/query";
import { listPendingDues } from "@/features/finance/fee-query";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  try {
    let csv: string;
    if (type === "collection") {
      const rows = await collectionReport();
      csv = toCsv(
        ["Financial Year", "Expected", "Collected", "Pending", "Percent"],
        rows.map((r) => [r.label, r.expected, r.collected, r.pending, r.percent]),
      );
    } else if (type === "payment-modes") {
      const rows = await paymentModeReport();
      csv = toCsv(
        ["Mode", "Count", "Total"],
        rows.map((r) => [r.name, r.count, r.total]),
      );
    } else if (type === "income") {
      const rows = await incomeByCategoryReport();
      csv = toCsv(
        ["Category", "Count", "Total"],
        rows.map((r) => [r.name, r.count, r.total]),
      );
    } else if (type === "expense") {
      const rows = await expenseByCategoryReport();
      csv = toCsv(
        ["Category", "Count", "Total"],
        rows.map((r) => [r.name, r.count, r.total]),
      );
    } else if (type === "whatsapp") {
      const rows = await whatsappReport();
      csv = toCsv(
        ["Status", "Count"],
        rows.map((r) => [r.name, r.count]),
      );
    } else if (type === "pending") {
      const rows = await listPendingDues();
      csv = toCsv(
        ["Member Code", "Name", "Mobile", "Pending Years", "Total Pending"],
        rows.map((r) => [
          r.memberCode,
          r.memberName,
          r.mobile ?? "",
          r.pendingYears,
          r.totalPending,
        ]),
      );
    } else {
      return new Response("Unknown report", { status: 404 });
    }
    return new Response("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-report.csv"`,
      },
    });
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
}
