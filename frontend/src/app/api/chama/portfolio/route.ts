import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { listChamas, stakeOf } from "@/server/chamas";
import { requireUser, ok, throttle } from "@/server/http";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "chama", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const u = user as { handle: string };
  return ok(
    await mutate((db) => {
      const member = listChamas(db, u.handle, true);
      const stakes = member.map((c) => stakeOf(db, u.handle, c.id));
      return {
        stakes,
        totalContributedSats: stakes.reduce((s, x) => s + x.myContributionSats, 0),
        totalValueSats: stakes.reduce((s, x) => s + x.myValueSats, 0),
        totalGainSats: stakes.reduce((s, x) => s + x.myGainSats, 0),
      };
    }),
  );
}
