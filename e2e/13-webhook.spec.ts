import { test, expect } from "@playwright/test";

// The WhatsApp webhook is a public endpoint (verified by token), so no login.
test("webhook verification handshake", async ({ request }) => {
  const ok = await request.get(
    "/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=mandal-crm-verify-dev&hub.challenge=CHALLENGE123",
  );
  expect(ok.status()).toBe(200);
  expect(await ok.text()).toBe("CHALLENGE123");

  const bad = await request.get(
    "/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=X",
  );
  expect(bad.status()).toBe(403);
});

test("webhook accepts a status callback payload", async ({ request }) => {
  const res = await request.post("/api/whatsapp/webhook", {
    data: {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [{ id: "wamid.nonexistent", status: "delivered" }],
              },
            },
          ],
        },
      ],
    },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.updated).toBe(0); // unknown wamid → no-op, but accepted
});
