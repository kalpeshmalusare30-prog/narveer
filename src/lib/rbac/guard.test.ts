import { expect, test, vi, beforeEach } from "vitest";
import * as session from "@/lib/auth/session";
import { withAction, withSuperAdmin } from "./guard";

beforeEach(() => vi.restoreAllMocks());

test("withAction denies when permission missing", async () => {
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u1",
    fullName: "U",
    organizationId: "o1",
    isSuperAdmin: false,
    permissions: ["member.view"],
  });
  await expect(
    withAction({ permission: "member.create" }, async () => "ok"),
  ).rejects.toThrow(/FORBIDDEN/);
});

test("withAction allows and runs within tenant when permitted", async () => {
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u1",
    fullName: "U",
    organizationId: "o1",
    isSuperAdmin: false,
    permissions: ["member.create"],
  });
  const r = await withAction(
    { permission: "member.create" },
    async (ctx) => ctx.organizationId,
  );
  expect(r).toBe("o1");
});

test("withSuperAdmin denies a non-super-admin", async () => {
  vi.spyOn(session, "getSessionUser").mockResolvedValue({
    id: "u1",
    fullName: "U",
    organizationId: "o1",
    isSuperAdmin: false,
    permissions: ["org.create"],
  });
  await expect(
    withSuperAdmin({ permission: "org.create" }, async () => "ok"),
  ).rejects.toThrow(/FORBIDDEN/);
});
