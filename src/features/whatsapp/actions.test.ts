import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";
import { sendPendingReminder } from "./actions";
import { listMessages } from "./query";

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

async function setup() {
  const org = await testDb.organization.create({
    data: { name: "Mandal", shortName: "M", whatsappConfigured: false },
  });
  const status = await testDb.memberStatus.create({
    data: { organizationId: org.id, name: "Active" },
  });
  const member = await testDb.member.create({
    data: {
      organizationId: org.id,
      memberCode: "M1",
      fullName: "Ramesh",
      mobile: "9990001111",
      statusId: status.id,
    },
  });
  const fy = await testDb.financialYear.create({
    data: {
      organizationId: org.id,
      label: "2024-25",
      startDate: new Date(),
      endDate: new Date(),
      feeAmount: "1000",
    },
  });
  await testDb.annualFee.create({
    data: {
      organizationId: org.id,
      memberId: member.id,
      financialYearId: fy.id,
      feeAmount: "1000",
    },
  });
  await testDb.whatsAppTemplate.create({
    data: {
      organizationId: org.id,
      type: "reminder",
      name: "Reminder",
      body: "नमस्कार {{memberName}}, थकबाकी {{totalPending}}. {{organizationName}}",
    },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: ["whatsapp.send", "whatsapp.view"],
  });
  return { org, member };
}

test("unconfigured WhatsApp records a queued message with clear reason", async () => {
  const { member } = await setup();
  const res = await sendPendingReminder(member.id);
  expect(res.configured).toBe(false);
  expect(res.status).toBe("Pending");
  expect(res.failureReason).toBe("not_configured");

  const msgs = await listMessages();
  expect(msgs).toHaveLength(1);
  expect(msgs[0].content).toContain("Ramesh");
  expect(msgs[0].content).toContain("₹1,000.00");
  expect(msgs[0].toNumber).toBe("9990001111");
  expect(msgs[0].type).toBe("reminder");
});

test("messages are tenant-scoped", async () => {
  const { member } = await setup();
  await sendPendingReminder(member.id);
  const other = await testDb.organization.create({
    data: { name: "Other", shortName: "O2" },
  });
  await testDb.whatsAppMessage.create({
    data: {
      organizationId: other.id,
      type: "reminder",
      toNumber: "1",
      content: "x",
    },
  });
  const msgs = await listMessages();
  expect(msgs).toHaveLength(1);
});
