import { rawDb } from "@/lib/db/raw";
import { getTenant } from "@/lib/db/tenant-context";
import { Prisma } from "@prisma/client";

export async function writeAudit(input: {
  action: string;
  module: string;
  recordType: string;
  recordId: string;
  oldValue?: unknown;
  newValue?: unknown;
}): Promise<void> {
  const ctx = getTenant();
  await rawDb.auditLog.create({
    data: {
      organizationId: ctx?.organizationId ?? null,
      userId: ctx?.userId ?? null,
      action: input.action,
      module: input.module,
      recordType: input.recordType,
      recordId: input.recordId,
      oldValue:
        input.oldValue === undefined
          ? undefined
          : (input.oldValue as Prisma.InputJsonValue),
      newValue:
        input.newValue === undefined
          ? undefined
          : (input.newValue as Prisma.InputJsonValue),
    },
  });
}
