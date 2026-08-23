import { NextRequest } from "next/server";
import { processStatusUpdate } from "@/features/whatsapp/webhook";

export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mandal-crm-verify";

// Meta webhook verification handshake.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (
    sp.get("hub.mode") === "subscribe" &&
    sp.get("hub.verify_token") === VERIFY_TOKEN
  ) {
    return new Response(sp.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Delivery/read/failed status callbacks.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await processStatusUpdate(body);
    return Response.json({ ok: true, ...result });
  } catch {
    return new Response("Bad request", { status: 400 });
  }
}
