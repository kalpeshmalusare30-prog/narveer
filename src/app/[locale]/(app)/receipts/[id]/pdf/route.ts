import { NextRequest } from "next/server";
import { getReceiptForPdf } from "@/features/receipts/query";
import { rawDb } from "@/lib/db/raw";
import { renderReceiptPdf } from "@/lib/pdf/receipt";
import { amountInMarathiWords } from "@/lib/money/marathi-words";
import { feePending } from "@/lib/finance/calc";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function ddmmyyyy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; locale: string }> },
) {
  const { id } = await params;

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

  // Current remaining vargani for this receipt's year(s) — printed as बाकी
  // when the member paid partially.
  const feeIds = receipt.payment.allocations.map((a) => a.annualFeeId);
  let pendingAmount = new Prisma.Decimal(0);
  if (feeIds.length) {
    const paidAllocs = await rawDb.paymentAllocation.findMany({
      where: { annualFeeId: { in: feeIds } },
      include: { payment: { select: { isVoided: true } } },
    });
    const paidByFee: Record<string, Prisma.Decimal> = {};
    for (const a of paidAllocs) {
      if (a.payment.isVoided) continue;
      paidByFee[a.annualFeeId] = (
        paidByFee[a.annualFeeId] ?? new Prisma.Decimal(0)
      ).plus(a.amount);
    }
    for (const a of receipt.payment.allocations) {
      const paid = paidByFee[a.annualFeeId] ?? new Prisma.Decimal(0);
      pendingAmount = pendingAmount.plus(
        feePending(a.annualFee.feeAmount, paid, a.annualFee.status),
      );
    }
  }

  const buffer = await renderReceiptPdf({
    org: {
      // The traditional receipt is Marathi-first.
      name: org.nameMr?.trim() || org.name,
      address:
        org.addressMr?.trim() ||
        [org.address, org.city].filter(Boolean).join(", "),
      registrationNumber: org.registrationNumber,
      blessing: org.receiptBlessing,
      tagline1: org.receiptTagline1,
      tagline2: org.receiptTagline2,
      logoDataUri: org.logoDataUri,
      deityDataUri: org.receiptImageDataUri,
      treasurerSignDataUri: org.treasurerSignDataUri,
    },
    receiptNumber: receipt.receiptNumber,
    receiptDate: ddmmyyyy(new Date(receipt.receiptDate)),
    memberName: receipt.member.fullName,
    modeName: receipt.payment.paymentMode.name,
    yearLabels: receipt.payment.allocations.map(
      (a) => a.annualFee.financialYear.label,
    ),
    amountWords: amountInMarathiWords(receipt.payment.amount.toString()),
    total: receipt.payment.amount.toString(),
    pendingAmount: pendingAmount.toString(),
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receipt.receiptNumber}.pdf"`,
    },
  });
}
