import { rawDb } from "@/lib/db/raw";

/**
 * Atomically increment the organization's receipt sequence and return the next
 * receipt number (prefix + zero-padded). Unique per org even under concurrency.
 */
export async function nextReceiptNumber(
  organizationId: string,
): Promise<string> {
  return rawDb.$transaction(async (tx) => {
    const org = await tx.organization.update({
      where: { id: organizationId },
      data: { receiptSeq: { increment: 1 } },
      select: { receiptNumberPrefix: true, receiptSeq: true },
    });
    return `${org.receiptNumberPrefix}${String(org.receiptSeq).padStart(4, "0")}`;
  });
}
