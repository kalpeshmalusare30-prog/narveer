import { getSessionUser } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { db } from "@/lib/db/prisma";

export type SearchResults = {
  members: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    memberCode: string;
    mobile: string | null;
  }[];
  receipts: {
    id: string;
    receiptNumber: string;
    memberName: string;
    memberNameEn: string | null;
  }[];
};

export async function globalSearch(q: string): Promise<SearchResults> {
  const empty: SearchResults = { members: [], receipts: [] };
  const user = await getSessionUser();
  const term = q.trim();
  if (!user || !user.organizationId || term.length < 1) return empty;

  return runWithTenant(
    { organizationId: user.organizationId, userId: user.id },
    async () => {
      const members = user.permissions.includes("member.view")
        ? await db.member.findMany({
            where: {
              OR: [
                { fullName: { contains: term, mode: "insensitive" } },
                { fullNameEn: { contains: term, mode: "insensitive" } },
                { memberCode: { contains: term, mode: "insensitive" } },
                { mobile: { contains: term, mode: "insensitive" } },
              ],
            },
            take: 10,
            orderBy: { fullName: "asc" },
            select: {
              id: true,
              fullName: true,
              fullNameEn: true,
              memberCode: true,
              mobile: true,
            },
          })
        : [];
      const receiptRows = user.permissions.includes("receipt.view")
        ? await db.receipt.findMany({
            where: { receiptNumber: { contains: term, mode: "insensitive" } },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              member: { select: { fullName: true, fullNameEn: true } },
            },
          })
        : [];
      return {
        members,
        receipts: receiptRows.map((r) => ({
          id: r.id,
          receiptNumber: r.receiptNumber,
          memberName: r.member.fullName,
          memberNameEn: r.member.fullNameEn,
        })),
      };
    },
  );
}
