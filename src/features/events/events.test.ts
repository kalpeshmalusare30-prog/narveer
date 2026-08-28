import { beforeEach, expect, test, vi } from "vitest";
import { resetDb, testDb } from "@/test/db";
import * as session from "@/lib/auth/session";

// Server actions call revalidatePath, which needs Next's request context.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
import { createEventRecord, setAttendance } from "./actions";
import { listEvents, getEvent } from "./query";

const PERMS = ["event.view", "event.manage", "member.view"];

async function setup() {
  const org = await testDb.organization.create({
    data: { name: "O", shortName: "O" },
  });
  const status = await testDb.memberStatus.create({
    data: { organizationId: org.id, name: "Active" },
  });
  const member = await testDb.member.create({
    data: {
      organizationId: org.id,
      memberCode: "M1",
      fullName: "अ",
      statusId: status.id,
    },
  });
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u",
    fullName: "U",
    organizationId: org.id,
    isSuperAdmin: false,
    permissions: PERMS,
  });
  return { org, member };
}

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

test("create an event and list it", async () => {
  await setup();
  await createEventRecord({ title: "AGM", type: "Meeting", eventDate: "2026-09-01" });
  const rows = await listEvents();
  expect(rows).toHaveLength(1);
  expect(rows[0].title).toBe("AGM");
  expect(rows[0].type).toBe("Meeting");
});

test("marking attendance upserts (no duplicate rows)", async () => {
  const { member } = await setup();
  const ev = await createEventRecord({ title: "E", type: "Event", eventDate: "2026-09-01" });
  await setAttendance(ev.id, member.id, "Present");
  await setAttendance(ev.id, member.id, "Absent");
  const detail = await getEvent(ev.id);
  expect(detail!.attendances).toHaveLength(1);
  expect(detail!.attendances[0].status).toBe("Absent");
});

test("events are tenant-scoped", async () => {
  const { org } = await setup();
  await createEventRecord({ title: "Mine", type: "Event", eventDate: "2026-09-01" });
  const other = await testDb.organization.create({
    data: { name: "B", shortName: "B" },
  });
  await testDb.event.create({
    data: { organizationId: other.id, title: "Theirs", type: "Event", eventDate: new Date() },
  });
  const rows = await listEvents();
  expect(rows).toHaveLength(1);
  expect(rows[0].organizationId).toBe(org.id);
});
