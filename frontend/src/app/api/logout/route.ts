import { NextRequest, NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE, clearSessionCookie } from "@/server/auth";
import { ok, requireCsrf } from "@/server/http";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  await destroySession(req.cookies.get(SESSION_COOKIE)?.value);
  const res = ok({ ok: true });
  res.headers.append("Set-Cookie", clearSessionCookie());
  return res;
}
