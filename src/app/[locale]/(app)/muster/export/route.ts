import { getMusterData } from "@/features/muster/query";
import { toXlsx, type Cell } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

const r2 = (n: number) => Math.round(n * 100) / 100;

export async function GET(request: Request) {
  try {
    const f = new URL(request.url).searchParams.get("filter");
    const filter = f === "pending" || f === "complete" ? f : "all";
    const data = await getMusterData();

    const headers = [
      "Code",
      "Name",
      "Name (English)",
      "Mobile",
      "Active",
      ...data.years.flatMap((y) => [
        `${y.label} Fee`,
        `${y.label} Paid`,
        `${y.label} Pending`,
      ]),
      "Total Paid",
      "Total Pending",
    ];

    const built = data.members.map((m) => {
      let totalPaid = 0;
      let totalPending = 0;
      const yearCells: Cell[] = [];
      for (const y of data.years) {
        const c = m.cells[y.id];
        if (c) {
          yearCells.push(Number(c.feeAmount), Number(c.paid), Number(c.pending));
          totalPaid += Number(c.paid);
          totalPending += Number(c.pending);
        } else {
          yearCells.push("", "", "");
        }
      }
      const row: Cell[] = [
        m.memberCode,
        m.fullName,
        m.fullNameEn ?? "",
        m.mobile ?? "",
        m.isActive ? "Yes" : "No",
        ...yearCells,
        r2(totalPaid),
        r2(totalPending),
      ];
      return { row, totalPending: r2(totalPending) };
    });

    const rows: Cell[][] = built
      .filter((b) =>
        filter === "pending"
          ? b.totalPending > 0
          : filter === "complete"
            ? b.totalPending === 0
            : true,
      )
      .map((b) => b.row);

    const sheet =
      filter === "pending" ? "Pending" : filter === "complete" ? "Paid" : "Muster";
    const buffer = await toXlsx(headers, rows, sheet);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="muster-${filter}.xlsx"`,
      },
    });
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
}
