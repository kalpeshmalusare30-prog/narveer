import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";

export async function getCommunicationConfig() {
  return withAction({ permission: "communication.manage" }, async (ctx) =>
    rawDb.organization.findUnique({
      where: { id: ctx.organizationId },
      select: {
        upiId: true,
        upiPayeeName: true,
        paymentGatewayProvider: true,
        paymentGatewayKeyId: true,
        paymentGatewayConfigured: true,
        smsProvider: true,
        smsSenderId: true,
        smsConfigured: true,
        emailProvider: true,
        emailFromAddress: true,
        emailConfigured: true,
      },
    }),
  );
}

export type CommunicationConfig = NonNullable<
  Awaited<ReturnType<typeof getCommunicationConfig>>
>;
