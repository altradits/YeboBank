import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { getChamaRow, stakeOf } from "@/server/chamas";
import { requireUser, ok, fail, throttle } from "@/server/http";
import type { ChamaGrowthPoint } from "@/types";

// Simulated growth: straight-line from pool entry to current stake value.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "chama", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const u = user as { handle: string };
  try {
    return ok(
      await mutate((db) => {
        const row = getChamaRow(db, params.id);
        if (!row) throw new Error("missing");
        const stake = stakeOf(db, u.handle, params.id);
        const points: ChamaGrowthPoint[] = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const f = (12 - i) / 12;
          points.push({
            date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            contributedSats: Math.round(stake.myContributionSats * f),
            valueSats: Math.round(stake.myValueSats * f),
          });
        }
        return points;
      }),
    );
  } catch {
    return fail(404, "Chama not found");
  }
}
