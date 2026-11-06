import { NextRequest, NextResponse } from "next/server";
import { read } from "@/server/store";
import { balanceOf } from "@/server/ledger";
import { requireUser, ok, throttle } from "@/server/http";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "wallet", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const balanceSats = read((db) => balanceOf(db, `user:${user.id}`));
  return ok({ balanceSats });
}
