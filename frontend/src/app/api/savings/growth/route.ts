import { NextRequest, NextResponse } from "next/server";
import { read } from "@/server/store";
import { requireUser, ok, throttle } from "@/server/http";
import type { SavingsGrowthPoint } from "@/types";

// Simulated growth: principal from the user's lock legs, value with a small
// illustrative uplift. Labelled simulated in the UI.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "savings", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const uid = (user as { id: string }).id;
  const points = read((db) => {
    const byMonth = new Map<string, number>();
    for (const leg of db.legs) {
      if (leg.archivedAt || !leg.account.startsWith("lock:")) continue;
      if (leg.creditSats <= 0) continue;
      const month = leg.createdAt.slice(0, 7);
      byMonth.set(month, (byMonth.get(month) || 0) + leg.creditSats);
    }
    const months = [...byMonth.keys()].sort().slice(-12);
    let principal = 0;
    const out: SavingsGrowthPoint[] = months.map((date, i) => {
      principal += byMonth.get(date) || 0;
      const uplift = Math.round(principal * 0.004 * (i + 1)); // ~5%/yr illustrative
      return { date, principalSats: principal, valueSats: principal + uplift };
    });
    return out;
  });
  return ok(points);
}
