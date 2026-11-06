import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), "yebo-locks-")), "db.json");

import { mutate, read, resetCacheForTests } from "@/server/store";
import { postTx, balanceOf } from "@/server/ledger";
import { createLock, contribute, myInvites, acceptInvite, lockMessages, postLockMessage } from "@/server/locks";

const me = { id: "u1", handle: "@wanjiku", name: "Wanjiku Kamau" };

async function fund(sats: number): Promise<void> {
  await mutate((db) =>
    postTx(
      db,
      [
        { account: "external:mpesa-fake", debitSats: sats },
        { account: "user:u1", creditSats: sats },
      ],
      { type: "deposit_mpesa", note: "seed" },
    ),
  );
}

beforeEach(() => {
  process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), "yebo-locks-")), "db.json");
  resetCacheForTests();
});

describe("savings locks", () => {
  it("creates a lock and moves user sats into it", async () => {
    await fund(10000);
    const lock = await mutate((db) => createLock(db, me, { sats: 4000, years: 2 }));
    expect(lock.principalSats).toBe(4000);
    expect(read((db) => balanceOf(db, "user:u1"))).toBe(6000);
    expect(read((db) => balanceOf(db, `lock:${lock.id}`))).toBe(4000);
  });

  it("refuses locks beyond the balance", async () => {
    await fund(100);
    await expect(mutate((db) => createLock(db, me, { sats: 5000, years: 1 }))).rejects.toThrow(
      "Insufficient",
    );
  });

  it("contributes and tracks participants", async () => {
    await fund(10000);
    const lock = await mutate((db) => createLock(db, me, { sats: 1000, years: 1 }));
    const updated = await mutate((db) =>
      contribute(db, { id: "u1", handle: "@otieno", name: "Otieno" }, lock.id, 500),
    );
    expect(updated.principalSats).toBe(1500);
    expect(updated.participants?.find((p) => p.handle === "@otieno")?.contributedSats).toBe(500);
  });

  it("invites group members who accept and join", async () => {
    await fund(10000);
    const lock = await mutate((db) =>
      createLock(db, me, { sats: 1000, years: 1, kind: "group", title: "Safari", handles: ["@otieno"] }),
    );
    const invites = read((db) => myInvites(db, "@otieno"));
    expect(invites).toHaveLength(1);
    expect(invites[0]?.targetId).toBe(lock.id);
    await mutate((db) => acceptInvite(db, "@otieno", invites[0]?.id as string));
    expect(read((db) => myInvites(db, "@otieno"))).toHaveLength(0);
  });

  it("posts and lists lock messages", async () => {
    await fund(10000);
    const lock = await mutate((db) => createLock(db, me, { sats: 1000, years: 1 }));
    await mutate((db) =>
      postLockMessage(db, lock.id, { kind: "text", authorHandle: me.handle, authorName: me.name, body: "Twende!" }),
    );
    const msgs = read((db) => lockMessages(db, lock.id));
    expect(msgs.some((m) => m.body === "Twende!")).toBe(true);
  });
});
