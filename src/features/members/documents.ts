import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";

// NOTE: MemberDocument / MemberRelation are not in the tenant-scoped client's
// auto-injection allowlist (src/lib/db/prisma.ts), so organizationId is
// filtered explicitly here rather than relying on implicit injection.

export async function listMemberDocuments(memberId: string) {
  return withAction({ permission: "document.view" }, async (ctx) =>
    db.memberDocument.findMany({
      where: { memberId, organizationId: ctx.organizationId },
      select: {
        id: true,
        name: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function getMemberDocument(id: string) {
  return withAction({ permission: "document.view" }, async (ctx) =>
    db.memberDocument.findFirst({
      where: { id, organizationId: ctx.organizationId },
    }),
  );
}

export async function listMemberRelations(memberId: string) {
  return withAction({ permission: "member.view" }, async (ctx) =>
    db.memberRelation.findMany({
      where: { memberId, organizationId: ctx.organizationId },
      include: {
        relatedMember: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            memberCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}
