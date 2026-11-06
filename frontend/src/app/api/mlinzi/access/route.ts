import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { listAccess } from "@/server/sim";
import { requireMlinzi, ok, throttle } from "@/server/http";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 60, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  return ok(await mutate((db) => listAccess(db)));
}
