import { NextRequest } from "next/server";
import { getMemberDocument } from "@/features/members/documents";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string; locale: string }> },
) {
  const { id, docId } = await params;

  let doc;
  try {
    doc = await getMemberDocument(docId); // permission + tenant scoped
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  if (!doc || doc.memberId !== id) return new Response("Not found", { status: 404 });

  const commaIdx = doc.dataUri.indexOf(",");
  const base64 = commaIdx >= 0 ? doc.dataUri.slice(commaIdx + 1) : doc.dataUri;
  const buffer = Buffer.from(base64, "base64");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.name)}"`,
    },
  });
}
