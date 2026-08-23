import { rawDb } from "@/lib/db/raw";

/**
 * Atomically increment the organization's member-code sequence and return the
 * next code (prefix + zero-padded number). Safe under concurrency because the
 * increment happens in a single UPDATE ... RETURNING inside a transaction.
 */
export async function nextMemberCode(organizationId: string): Promise<string> {
  return rawDb.$transaction(async (tx) => {
    const org = await tx.organization.update({
      where: { id: organizationId },
      data: { memberCodeSeq: { increment: 1 } },
      select: { memberCodePrefix: true, memberCodeSeq: true },
    });
    return `${org.memberCodePrefix}${String(org.memberCodeSeq).padStart(4, "0")}`;
  });
}
