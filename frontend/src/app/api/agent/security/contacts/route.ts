import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { saveContacts } from "@/server/sim";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isText, normalisePhone } from "@/server/validate";
import type { EmergencyContact } from "@/types";

const TIERS = ["personal", "legal", "life_death"];

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 30, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const contacts = body?.contacts;
  if (!Array.isArray(contacts)) return fail(400, "Contacts required");
  const clean: EmergencyContact[] = [];
  for (const c of contacts as Array<Record<string, unknown>>) {
    if (!isText(c?.name, 120)) return fail(400, "Bad contact name");
    const phone = normalisePhone(c?.phone);
    if (!phone) return fail(400, "Bad contact phone");
    if (!TIERS.includes(c?.tier as string)) return fail(400, "Bad contact tier");
    clean.push({
      id: typeof c.id === "string" ? c.id : `ec_${clean.length}`,
      name: String(c.name),
      phone,
      tier: c.tier as EmergencyContact["tier"],
      priority: typeof c.priority === "number" ? c.priority : clean.length + 1,
    });
  }
  const u = user as { id: string };
  const agent = await mutate((db) => saveContacts(db, u.id, clean));
  return ok(agent);
}
