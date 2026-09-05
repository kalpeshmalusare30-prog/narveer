import { getMusterData } from "@/features/muster/query";
import {
  buildMusterExport,
  type MusterExportFilter,
} from "@/features/muster/export";
import { toXlsx } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const f = url.searchParams.get("filter");
    const filter: MusterExportFilter =
      f === "pending" || f === "complete" ? f : "all";
    const yearId = url.searchParams.get("year");

    const data = await getMusterData();
    const { headers, rows, sheet, filename } = buildMusterExport(
      data,
      filter,
      yearId || null,
    );

    const buffer = await toXlsx(headers, rows, sheet);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
}
