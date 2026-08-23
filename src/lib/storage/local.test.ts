import { expect, test } from "vitest";
import { rm } from "node:fs/promises";
import { LocalStorageProvider } from "./local";

test("saves and reads a file", async () => {
  const dir = "./uploads-test-storage";
  const s = new LocalStorageProvider(dir);
  const ref = await s.save("logos/x.png", Buffer.from("hello"), "image/png");
  expect(await s.read(ref)).toEqual(Buffer.from("hello"));
  expect(s.url(ref)).toContain("x.png");
  await rm(dir, { recursive: true, force: true });
});
