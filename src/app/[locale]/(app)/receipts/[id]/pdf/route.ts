import { NextRequest } from "next/server";
import { getReceiptForPdf } from "@/features/receipts/query";
import { rawDb } from "@/lib/db/raw";
import { renderReceiptPdf } from "@/lib/pdf/receipt";
import { memberName } from "@/features/members/name";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; locale: string }> },
) {
  const { id, locale } = await params;

  let receipt;
  try {
    receipt = await getReceiptForPdf(id); // permission + tenant scoped
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  if (!receipt) return new Response("Not found", { status: 404 });

  const org = await rawDb.organization.findUnique({
    where: { id: receipt.organizationId },
  });
  if (!org) return new Response("Not found", { status: 404 });

  const logoDataUri: string | undefined = org.logoDataUri ?? undefined;

  let collectedByName: string | null = null;
  if (receipt.payment.collectedBy) {
    const u = await rawDb.user.findUnique({
      where: { id: receipt.payment.collectedBy },
      select: { fullName: true },
    });
    collectedByName = u?.fullName ?? null;
  }

  const buffer = await renderReceiptPdf({
    // follow the chosen UI locale so an English UI never yields a Marathi receipt
    locale: locale === "mr" ? "mr" : "en",
    org: {
      name: org.name,
      address: org.address,
      city: org.city,
      contactNumber: org.contactNumber,
      email: org.email,
      logoDataUri,
    },
    receiptNumber: receipt.receiptNumber,
    receiptDate: new Date(receipt.receiptDate).toLocaleDateString("en-IN"),
    memberName: memberName(receipt.member, locale),
    memberCode: receipt.member.memberCode,
    modeName: receipt.payment.paymentMode.name,
    referenceNumber: receipt.payment.referenceNumber,
    collectedByName,
    lines: receipt.payment.allocations.map((a) => ({
      yearLabel: a.annualFee.financialYear.label,
      amount: a.amount.toString(),
    })),
    total: receipt.payment.amount.toString(),
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receipt.receiptNumber}.pdf"`,
    },
  });
}
