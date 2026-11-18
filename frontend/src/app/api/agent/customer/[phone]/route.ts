import { NextRequest, NextResponse } from "next/server";
import { read } from "@/server/store";
import { requireAgent, ok, fail, throttle } from "@/server/http";
import { normalisePhone } from "@/server/validate";

export async function GET(
  req: NextRequest,
  { params }: { params: { phone: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "agent", 60, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const phone = normalisePhone(decodeURIComponent(params.phone));
  if (!phone) return fail(400, "Valid phone required");
  const found = read((db) => db.users.find((u) => !u.archivedAt && u.phone === phone) ?? null);
  if (!found) return ok({ phone, name: null, isMember: false });
  return ok({ phone, name: found.fullName, isMember: true });
}
