import { NextRequest } from "next/server";
import {
  collectionReport,
  paymentModeReport,
  incomeByCategoryReport,
  expenseByCategoryReport,
  expenseByYearReport,
  whatsappReport,
  memberReport,
} from "@/features/reports/query";
import { listPendingDues } from "@/features/finance/fee-query";
import { toXlsx, type Cell } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  try {
    let headers: string[];
    let data: Cell[][];
    let sheet = "Report";

    if (type === "collection") {
      const rows = await collectionReport();
      sheet = "Collection";
      headers = ["Financial Year", "Expected", "Collected", "Pending", "Percent"];
      data = rows.map((r) => [r.label, r.expected, r.collected, r.pending, r.percent]);
    } else if (type === "payment-modes") {
      const rows = await paymentModeReport();
      sheet = "Payment Modes";
      headers = ["Mode", "Count", "Total"];
      data = rows.map((r) => [r.name, r.count, r.total]);
    } else if (type === "income") {
      const rows = await incomeByCategoryReport();
      sheet = "Income";
      headers = ["Category", "Count", "Total"];
      data = rows.map((r) => [r.name, r.count, r.total]);
    } else if (type === "expense") {
      const rows = await expenseByCategoryReport();
      sheet = "Expense";
      headers = ["Category", "Count", "Total"];
      data = rows.map((r) => [r.name, r.count, r.total]);
    } else if (type === "expense-yearwise") {
      const rows = await expenseByYearReport();
      sheet = "Expense by Year";
      headers = ["Year", "Count", "Total"];
      data = rows.map((r) => [r.year, r.count, r.total]);
    } else if (type === "whatsapp") {
      const rows = await whatsappReport();
      sheet = "WhatsApp";
      headers = ["Status", "Count"];
      data = rows.map((r) => [r.name, r.count]);
    } else if (
      type === "members" ||
      type === "members-pending" ||
      type === "members-paid"
    ) {
      const all = await memberReport();
      const rows =
        type === "members-pending"
          ? all.filter((r) => Number(r.pending) > 0)
          : type === "members-paid"
            ? all.filter((r) => Number(r.expected) > 0 && Number(r.pending) === 0)
            : all;
      sheet = "Members";
      headers = ["Member Code", "Name", "Mobile", "Fee", "Paid", "Pending"];
      data = rows.map((r) => [
        r.memberCode,
        r.name,
        r.mobile,
        r.expected,
        r.paid,
        r.pending,
      ]);
    } else if (type === "pending") {
      const rows = await listPendingDues();
      sheet = "Pending Dues";
      headers = ["Member Code", "Name", "Mobile", "Pending Years", "Total Pending"];
      data = rows.map((r) => [
        r.memberCode,
        r.memberName,
        r.mobile ?? "",
        r.pendingYears,
        r.totalPending,
      ]);
    } else {
      return new Response("Unknown report", { status: 404 });
    }

    const buffer = await toXlsx(headers, data, sheet);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}-report.xlsx"`,
      },
    });
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
}
