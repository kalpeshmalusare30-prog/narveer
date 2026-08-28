import { NextRequest } from "next/server";
import { getMember } from "@/features/members/query";
import { rawDb } from "@/lib/db/raw";
import { renderIdCardPdf } from "@/lib/pdf/idcard";
import { memberName } from "@/features/members/name";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; locale: string }> },
) {
  const { id, locale } = await params;

  let member;
  try {
    member = await getMember(id); // permission + tenant scoped
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  if (!member) return new Response("Not found", { status: 404 });

  const org = await rawDb.organization.findUnique({
    where: { id: member.organizationId },
  });
  if (!org) return new Response("Not found", { status: 404 });

  const buffer = await renderIdCardPdf({
    locale: locale === "mr" ? "mr" : "en",
    org: {
      name: org.name,
      logoDataUri: org.logoDataUri ?? undefined,
    },
    member: {
      name: memberName(member, locale),
      memberCode: member.memberCode,
      area: member.area,
      photoDataUri: member.photoDataUri ?? undefined,
    },
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${member.memberCode}-idcard.pdf"`,
    },
  });
}
