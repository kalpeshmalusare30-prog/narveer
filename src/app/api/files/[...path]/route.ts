import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  // Require an authenticated session — stored assets are not public.
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { path } = await params;
  const ref = path.join("/");
  // Prevent path traversal outside the storage root.
  if (ref.includes("..")) return new Response("Bad request", { status: 400 });
  try {
    const data = await storage.read(ref);
    const ext = ref.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
