import { NextRequest } from "next/server";
import { mutate, read, nextId } from "@/server/store";
import { hashPin, weakPinReason } from "@/server/pin";
import { createSession, ensureSeeded, sessionCookie, csrfCookie } from "@/server/auth";
import { ok, fail, throttle, readJson } from "@/server/http";
import { normalisePhone, isText, isPin } from "@/server/validate";

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const limited = throttle(req, "register", 10, 60_000);
  if (limited) return limited;
  const body = await readJson(req);
  const phone = body ? normalisePhone(body.phone) : null;
  const fullName = body?.fullName;
  const pin = body?.pin;
  if (!phone) return fail(400, "Valid Kenyan phone required");
  if (!isText(fullName, 80)) return fail(400, "Full name required");
  if (!isPin(pin)) return fail(400, "6-digit PIN required");
  const weak = weakPinReason(pin);
  if (weak) return fail(400, weak);

  const exists = read((db) => db.users.some((u) => !u.archivedAt && u.phone === phone));
  if (exists) return fail(409, "That number already has an account");

  const outcome = await mutate((db) => {
    const id = nextId(db, "u");
    const handle = "@user" + id.slice(2, 8);
    const now = new Date().toISOString();
    db.users.push({
      id,
      phone,
      fullName: String(fullName),
      handle,
      role: "customer",
      lightningAddress: `${handle.slice(1)}@yebobank.com`,
      language: "en",
      isAgent: false,
      relationship: "none",
      ffVerified: false,
      accessStatus: "none",
      pinHash: hashPin(pin),
      pinStrikes: 0,
      pinLockedUntil: null,
      createdAt: now,
      archivedAt: null,
    });
    return { id };
  });
  // Demo: the session starts at registration; /verify just returns the user.
  const { token, csrfToken } = await createSession(outcome.id);
  const res = ok({ otpSent: true });
  res.headers.append("Set-Cookie", sessionCookie(token));
  res.headers.append("Set-Cookie", csrfCookie(csrfToken));
  return res;
}
