import { beforeEach, expect, test } from "vitest";
import { resetDb, testDb } from "@/test/db";
import { processStatusUpdate } from "./webhook";

beforeEach(resetDb);

function status(id: string, s: string, errors?: { title: string }[]) {
  return { entry: [{ changes: [{ value: { statuses: [{ id, status: s, errors }] } }] }] };
}

test("progresses sent -> delivered -> read and ignores downgrades", async () => {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
  });
  const msg = await testDb.whatsAppMessage.create({
    data: {
      organizationId: org.id,
      type: "reminder",
      toNumber: "919900000000",
      content: "x",
      status: "Sent",
      providerMessageId: "wamid.1",
    },
  });

  await processStatusUpdate(status("wamid.1", "delivered"));
  expect(
    (await testDb.whatsAppMessage.findUnique({ where: { id: msg.id } }))!.status,
  ).toBe("Delivered");

  await processStatusUpdate(status("wamid.1", "read"));
  expect(
    (await testDb.whatsAppMessage.findUnique({ where: { id: msg.id } }))!.status,
  ).toBe("Read");

  // a late "delivered" must not downgrade a "read"
  await processStatusUpdate(status("wamid.1", "delivered"));
  expect(
    (await testDb.whatsAppMessage.findUnique({ where: { id: msg.id } }))!.status,
  ).toBe("Read");

  // unknown wamid is a no-op
  const r = await processStatusUpdate(status("unknown", "read"));
  expect(r.updated).toBe(0);
});

test("records failure reason", async () => {
  const org = await testDb.organization.create({
    data: { name: "O2", shortName: "O2" },
  });
  const msg = await testDb.whatsAppMessage.create({
    data: {
      organizationId: org.id,
      type: "reminder",
      toNumber: "1",
      content: "x",
      status: "Sent",
      providerMessageId: "wamid.2",
    },
  });
  await processStatusUpdate(
    status("wamid.2", "failed", [{ title: "Invalid number" }]),
  );
  const m = await testDb.whatsAppMessage.findUnique({ where: { id: msg.id } });
  expect(m!.status).toBe("Failed");
  expect(m!.failureReason).toBe("Invalid number");
});
