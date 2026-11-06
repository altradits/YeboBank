import { NextRequest } from "next/server";
import { mutate, read } from "@/server/store";
import { verifyPin, lockoutMs } from "@/server/pin";
import { createSession, ensureSeeded, sessionCookie, csrfCookie } from "@/server/auth";
import { ok, fail, throttle, readJson, publicUser } from "@/server/http";
import { normalisePhone, isPin } from "@/server/validate";
import { allow } from "@/server/rate";

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const limited = throttle(req, "login", 30, 60_000);
  if (limited) return limited;
  const body = await readJson(req);
  const phone = body ? normalisePhone(body.phone) : null;
  const pin = body?.pin;
  if (!phone || !isPin(pin)) return fail(400, "Phone and 6-digit PIN required");
  if (!allow(`login-phone:${phone}`, 5, 60_000)) {
    return fail(429, "Too many attempts for this number, try later");
  }

  const user = read((db) => db.users.find((u) => !u.archivedAt && u.phone === phone) ?? null);
  if (!user) return fail(401, "Wrong phone or PIN");
  if (user.pinLockedUntil && new Date(user.pinLockedUntil) > new Date()) {
    return fail(423, "PIN locked, try later");
  }
  if (!verifyPin(pin, user.pinHash)) {
    await mutate((db) => {
      const u = db.users.find((x) => x.id === user.id);
      if (!u) return;
      u.pinStrikes += 1;
      const ms = lockoutMs(u.pinStrikes);
      u.pinLockedUntil = ms > 0 ? new Date(Date.now() + ms).toISOString() : u.pinLockedUntil;
    });
    return fail(401, "Wrong phone or PIN");
  }
  await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) {
      u.pinStrikes = 0;
      u.pinLockedUntil = null;
    }
  });
  const { token, csrfToken } = await createSession(user.id);
  const res = ok(publicUser(user));
  res.headers.append("Set-Cookie", sessionCookie(token));
  res.headers.append("Set-Cookie", csrfCookie(csrfToken));
  return res;
}
