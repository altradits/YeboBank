import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), "yebo-chama-")), "db.json");

import { mutate, read, resetCacheForTests, nextId, type DbShape } from "@/server/store";
import { postTx, balanceOf } from "@/server/ledger";
import {
  createChama, requestJoin, voteOnJoin, createVote, castVote, deposit, withdraw, stakeOf,
} from "@/server/chamas";

const admin = { handle: "@admin", name: "Admin" };

function addMember(db: DbShape, chamaId: string, handle: string): void {
  (db.docs.chamaMembers as unknown as Array<Record<string, unknown>>).push({
    id: nextId(db, "m"),
    chamaId,
    name: handle,
    handle,
    role: "member",
    contributedSats: 0,
    archivedAt: null,
  });
}

beforeEach(() => {
  process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), "yebo-chama-")), "db.json");
  resetCacheForTests();
});

describe("chama votes (>75% threshold)", () => {
  it("approves a join request only past 75%", async () => {
    const chama = await mutate((db) => createChama(db, admin, "Testers", 1000));
    await mutate((db) => {
      addMember(db, chama.id, "@m2");
      addMember(db, chama.id, "@m3");
      addMember(db, chama.id, "@m4");
    });
    // 4 members: need > 3 approvals, i.e. all four.
    const jr = await mutate((db) => requestJoin(db, { handle: "@new", name: "New" }, chama.id));
    for (const h of ["@admin", "@m2", "@m3"]) {
      const r = await mutate((db) => voteOnJoin(db, h, chama.id, jr.id, true));
      expect(r.status).toBe("pending");
    }
    const done = await mutate((db) => voteOnJoin(db, "@m4", chama.id, jr.id, true));
    expect(done.status).toBe("approved");
    expect(
      read((db) => (db.docs.chamaMembers as unknown as Array<{ chamaId: string }>).filter((m) => m.chamaId === chama.id).length),
    ).toBe(5);
  });

  it("rejects on a no vote", async () => {
    const chama = await mutate((db) => createChama(db, admin, "Testers", 1000));
    const jr = await mutate((db) => requestJoin(db, { handle: "@new", name: "New" }, chama.id));
    const r = await mutate((db) => voteOnJoin(db, "@admin", chama.id, jr.id, false));
    expect(r.status).toBe("rejected");
  });

  it("passes a poll past 75% and fails an impossible one", async () => {
    const chama = await mutate((db) => createChama(db, admin, "Voters", 0));
    await mutate((db) => {
      addMember(db, chama.id, "@m2");
      addMember(db, chama.id, "@m3");
      addMember(db, chama.id, "@m4");
    });
    const vote = await mutate((db) => createVote(db, chama.id, "Go?", ["yes", "no"]));
    await mutate((db) => castVote(db, "@admin", chama.id, vote.id, "yes"));
    await mutate((db) => castVote(db, "@m2", chama.id, vote.id, "yes"));
    const mid = await mutate((db) => castVote(db, "@m3", chama.id, vote.id, "yes"));
    expect(mid.status).toBe("open"); // 3 of 4 is not > 75%
    const fin = await mutate((db) => castVote(db, "@m4", chama.id, vote.id, "yes"));
    expect(fin.status).toBe("passed");

    const doomed = await mutate((db) => createVote(db, chama.id, "No?", ["a", "b"]));
    await mutate((db) => castVote(db, "@admin", chama.id, doomed.id, "a"));
    await mutate((db) => castVote(db, "@m2", chama.id, doomed.id, "b"));
    await mutate((db) => castVote(db, "@m3", chama.id, doomed.id, "b"));
    const closed = await mutate((db) => castVote(db, "@m4", chama.id, doomed.id, "b"));
    expect(closed.status).toBe("failed"); // best possible 3 of 4 can't pass
  });
});

describe("chama money", () => {
  it("deposits and withdraws through the ledger", async () => {
    const chama = await mutate((db) => createChama(db, admin, "Pooled", 1000));
    await mutate((db) =>
      postTx(
        db,
        [
          { account: "external:mpesa-fake", debitSats: 9000 },
          { account: "user:u-admin", creditSats: 9000 },
        ],
        { type: "deposit_mpesa", note: "seed" },
      ),
    );
    const who = { id: "u-admin", handle: "@admin", name: "Admin" };
    await mutate((db) => deposit(db, who, chama.id, 3000));
    expect(read((db) => balanceOf(db, `chama:${chama.id}`))).toBe(3000);
    expect(read((db) => balanceOf(db, "user:u-admin"))).toBe(6000);
    await mutate((db) => withdraw(db, who, chama.id, 1000));
    expect(read((db) => balanceOf(db, `chama:${chama.id}`))).toBe(2000);
    const stake = read((db) => stakeOf(db, "@admin", chama.id));
    expect(stake.myContributionSats).toBe(2000);
    expect(stake.mySharePct).toBe(100);
  });
});
