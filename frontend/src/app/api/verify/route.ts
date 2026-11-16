import { NextRequest } from "next/server";
import { destroySession, SESSION_COOKIE } from "@/server/auth";
import { ok, fail, throttle, readJson } from "@/server/http";
import { currentUser } from "@/server/http";
import { publicUser } from "@/server/http";

export async function POST(req: NextRequest) {
  const limited = throttle(req, "verify", 20, 60_000);
  if (limited) return limited;
  const body = await readJson(req);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  // Demo: any 4+ character code verifies while the registration session holds.
  if (code.length < 4) return fail(400, "Verification code required");
  const user = await currentUser(req);
  if (!user) return fail(401, "Not signed in");
  return ok(publicUser(user));
}

export async function DELETE(req: NextRequest) {
  await destroySession(req.cookies.get(SESSION_COOKIE)?.value);
  return ok({ ok: true });
}
