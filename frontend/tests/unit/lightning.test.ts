import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), "yebo-ln-")), "db.json");

import {
  fakeCreateInvoice, fakeGetStatus, fakeSettleInvoice, fakePay, resetFakeForTests,
} from "@/server/altradits-fake";
import { regtestCreateInvoice, regtestGetStatus } from "@/server/altradits-fake";
import {
  signWebhook, verifyWebhookSignature, parseWebhookEvent,
} from "@/lib/altradits";
import { mutate, read, resetCacheForTests } from "@/server/store";
import { postTx, balanceOf, reconcile } from "@/server/ledger";

beforeEach(() => {
  process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), "yebo-ln-")), "db.json");
  resetCacheForTests();
  resetFakeForTests();
});

describe("Lightning flow (fake)", () => {
  it("creates a pending invoice and settles it", async () => {
    const inv = await fakeCreateInvoice(5000, "deposit");
    expect(inv.invoice.startsWith("lntbs")).toBe(true);
    expect(inv.paymentHash).toMatch(/^[0-9a-f]{64}$/);
    expect((await fakeGetStatus(inv.paymentHash)).status).toBe("pending");
    expect(fakeSettleInvoice(inv.paymentHash)).toBe(true);
    const st = await fakeGetStatus(inv.paymentHash);
    expect(st.status).toBe("settled");
    expect(st.amountSats).toBe(5000);
    expect((await fakeGetStatus("0".repeat(64))).status).toBe("unknown");
  });

  it("pays out and reports settled", async () => {
    const r = await fakePay("lntbs123", 1000);
    expect(r.status).toBe("settled");
    expect(r.paymentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifies webhooks and rejects tampering and replays", () => {
    const secret = "whsec_test";
    const raw = JSON.stringify({ event: "invoice.settled", paymentHash: "a".repeat(64), amountSats: 5000 });
    const ts = String(Date.now());
    const sig = signWebhook(secret, ts, raw);
    expect(verifyWebhookSignature(secret, ts, raw, sig)).toBe(true);
    expect(verifyWebhookSignature(secret, ts, raw + " ", sig)).toBe(false);
    expect(verifyWebhookSignature("wrong", ts, raw, sig)).toBe(false);
    const staleTs = String(Date.now() - 10 * 60_000);
    expect(verifyWebhookSignature(secret, staleTs, raw, signWebhook(secret, staleTs, raw))).toBe(false);
    expect(parseWebhookEvent(JSON.parse(raw))).toEqual({
      event: "invoice.settled", paymentHash: "a".repeat(64), amountSats: 5000,
    });
    expect(parseWebhookEvent({ event: "nope" })).toBeNull();
  });

  it("credits the ledger idempotently by payment hash", async () => {
    const hash = "b".repeat(64);
    const credit = () =>
      mutate((db) =>
        postTx(
          db,
          [
            { account: "external:lightning", debitSats: 5000 },
            { account: "user:u9", creditSats: 5000 },
          ],
          { type: "deposit_lightning", note: "t", ref: `ln:${hash}` },
        ),
      );
    await credit();
    await credit(); // webhook replay
    expect(read((db) => balanceOf(db, "user:u9"))).toBe(5000);
    expect(read((db) => reconcile(db))).toEqual([]);
  });
});

// Live regtest suite: runs only when the fake's regtest internals are wired.
// Without LND_REGTEST_* this suite skips (reported, not green).
const regtest = process.env.LND_REGTEST_REST_URL && process.env.LND_REGTEST_INVOICE_MACAROON
  ? describe
  : describe.skip;

regtest("Lightning flow (regtest LND)", () => {
  it("creates and reads an invoice on regtest", async () => {
    const inv = await regtestCreateInvoice(1000, "yebo regtest probe");
    expect(inv.invoice.length).toBeGreaterThan(20);
    const st = await regtestGetStatus(inv.paymentHash);
    expect(["pending", "settled"]).toContain(st.status);
  });
});
