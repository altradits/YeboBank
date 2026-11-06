import { NextRequest, NextResponse } from "next/server";
import { requireUser, ok, publicUser, throttle } from "@/server/http";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "me", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  return ok(publicUser(user));
}
