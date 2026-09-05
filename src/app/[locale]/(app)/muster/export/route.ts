import { getMusterData } from "@/features/muster/query";
import { toXlsx, type Cell } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

const r2 = (n: number) => Math.round(n * 100) / 100;

export async function GET() {
  try {
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

    const rows: Cell[][] = data.members.map((m) => {
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
      return [
        m.memberCode,
        m.fullName,
        m.fullNameEn ?? "",
        m.mobile ?? "",
        m.isActive ? "Yes" : "No",
        ...yearCells,
        r2(totalPaid),
        r2(totalPending),
      ];
    });

    const buffer = await toXlsx(headers, rows, "Muster");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="muster.xlsx"`,
      },
    });
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
}
