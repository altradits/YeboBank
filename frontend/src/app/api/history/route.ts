import { NextRequest, NextResponse } from "next/server";
import { read } from "@/server/store";
import { requireUser, ok, throttle } from "@/server/http";
import type { LedgerEntry } from "@/types";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "history", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const account = `user:${user.id}`;
  const entries = read((db) => {
    const legs = db.legs
      .filter((l) => !l.archivedAt && l.account === account)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    let running = 0;
    const out: LedgerEntry[] = legs.map((leg) => {
      running += leg.creditSats - leg.debitSats;
      const net = leg.creditSats - leg.debitSats;
      return {
        id: leg.id,
        type: leg.type,
        direction: net >= 0 ? "credit" : "debit",
        amountSats: Math.abs(net),
        balanceAfter: running,
        note: leg.note,
        createdAt: leg.createdAt,
        status: "confirmed",
      };
    });
    return out.reverse();
  });
  return ok(entries);
}
