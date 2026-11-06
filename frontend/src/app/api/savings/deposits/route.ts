import { NextRequest, NextResponse } from "next/server";
import { read } from "@/server/store";
import { requireUser, ok, throttle } from "@/server/http";
import type { SavingsDeposit } from "@/types";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "savings", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const rows = read((db) => {
    const byDay = new Map<string, number>();
    for (const leg of db.legs) {
      if (leg.archivedAt || !leg.account.startsWith("lock:")) continue;
      if (leg.creditSats <= 0) continue;
      const day = leg.createdAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + leg.creditSats);
    }
    const out: SavingsDeposit[] = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amountSats]) => ({ date, amountSats }));
    return out;
  });
  return ok(rows);
}
