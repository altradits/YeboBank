import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), "yebo-ledger-")), "db.json");

import { mutate, read, resetCacheForTests } from "@/server/store";
import { postTx, balanceOf, reconcile } from "@/server/ledger";

beforeEach(() => {
  process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), "yebo-ledger-")), "db.json");
  resetCacheForTests();
});

describe("double-entry ledger", () => {
  it("derives balances from legs", async () => {
    await mutate((db) =>
      postTx(
        db,
        [
          { account: "external:mpesa-fake", debitSats: 8330 },
          { account: "user:u1", creditSats: 8330 },
        ],
        { type: "deposit_mpesa", note: "t" },
      ),
    );
    expect(read((db) => balanceOf(db, "user:u1"))).toBe(8330);
    expect(read((db) => balanceOf(db, "external:mpesa-fake"))).toBe(-8330);
  });

  it("rejects unbalanced transactions", async () => {
    await expect(
      mutate((db) =>
        postTx(
          db,
          [
            { account: "a", debitSats: 5 },
            { account: "b", creditSats: 4 },
          ],
          { type: "x", note: "bad" },
        ),
      ),
    ).rejects.toThrow("unbalanced");
  });

  it("is idempotent per ref", async () => {
    const legs = () =>
      [
        { account: "external:lightning", debitSats: 5000 },
        { account: "user:u1", creditSats: 5000 },
      ] as const;
    const tx1 = await mutate((db) =>
      postTx(db, [...legs()], { type: "deposit_lightning", note: "t", ref: "ln:abc" }),
    );
    const tx2 = await mutate((db) =>
      postTx(db, [...legs()], { type: "deposit_lightning", note: "t", ref: "ln:abc" }),
    );
    expect(tx1).toBe(tx2);
    expect(read((db) => balanceOf(db, "user:u1"))).toBe(5000);
  });

  it("reconciles clean books and detects tampering", async () => {
    await mutate((db) =>
      postTx(
        db,
        [
          { account: "external:mpesa-fake", debitSats: 100 },
          { account: "user:u1", creditSats: 100 },
        ],
        { type: "deposit_mpesa", note: "t" },
      ),
    );
    expect(read((db) => reconcile(db))).toEqual([]);
    // Tamper: archive one leg of the pair.
    await mutate((db) => {
      const leg = db.legs.find((l) => l.account === "user:u1");
      if (leg) leg.archivedAt = new Date().toISOString();
    });
    expect(read((db) => reconcile(db)).length).toBeGreaterThan(0);
  });

  it("enforces the money cap", async () => {
    await expect(
      mutate((db) =>
        postTx(
          db,
          [
            { account: "external:mpesa-fake", debitSats: 3e15 },
            { account: "user:u1", creditSats: 3e15 },
          ],
          { type: "x", note: "huge" },
        ),
      ),
    ).rejects.toThrow("money cap");
  });
});
