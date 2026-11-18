import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { positionById } from "@/server/sim";
import { requireMlinzi, ok, throttle } from "@/server/http";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 60, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  return ok(await mutate((db) => positionById(db, decodeURIComponent(params.id))));
}
