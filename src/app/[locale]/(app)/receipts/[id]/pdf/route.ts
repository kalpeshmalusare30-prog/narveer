import { NextRequest } from "next/server";
import { getReceiptForPdf } from "@/features/receipts/query";
import { rawDb } from "@/lib/db/raw";
import { storage } from "@/lib/storage";
import { renderReceiptPdf } from "@/lib/pdf/receipt";

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

  let logoDataUri: string | undefined;
  if (org.logoRef) {
    try {
      const buf = await storage.read(org.logoRef);
      logoDataUri = `data:image/png;base64,${buf.toString("base64")}`;
    } catch {
      /* logo optional */
    }
  }

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
    memberName: receipt.member.fullName,
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
