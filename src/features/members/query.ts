import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import type { Prisma } from "@prisma/client";

export type MemberListParams = {
  q?: string;
  statusId?: string;
  membershipTypeId?: string;
  area?: string;
  page?: number;
};

const PAGE_SIZE = 20;

export async function listMembers(params: MemberListParams) {
  return withAction({ permission: "member.view" }, async () => {
    const where: Prisma.MemberWhereInput = {};
    if (params.q && params.q.trim()) {
      const q = params.q.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { memberCode: { contains: q, mode: "insensitive" } },
        { mobile: { contains: q, mode: "insensitive" } },
      ];
    }
    if (params.statusId) where.statusId = params.statusId;
    if (params.membershipTypeId) where.membershipTypeId = params.membershipTypeId;
    if (params.area) where.area = { contains: params.area, mode: "insensitive" };

    const page = Math.max(1, params.page ?? 1);
    const [rows, total] = await Promise.all([
      db.member.findMany({
        where,
        include: { status: true, membershipType: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.member.count({ where }),
    ]);
    return { rows, total, page, pageSize: PAGE_SIZE };
  });
}

export async function getMember(id: string) {
  return withAction({ permission: "member.view" }, async () => {
    return db.member.findFirst({
      where: { id },
      include: { status: true, membershipType: true },
    });
  });
}

export async function listActiveMembers(): Promise<
  { id: string; fullName: string; memberCode: string }[]
> {
  return withAction({ permission: "member.view" }, async () =>
    db.member.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, memberCode: true },
      orderBy: { fullName: "asc" },
    }),
  );
}

export async function getMemberRefData() {
  return withAction({ permission: "member.view" }, async () => {
    const [statuses, types] = await Promise.all([
      db.memberStatus.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      db.membershipType.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { statuses, types };
  });
}
