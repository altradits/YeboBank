import { NextRequest, NextResponse } from "next/server";
import { mutate, read } from "@/server/store";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";

const ALLOWED_KEYS = new Set([
  "mpesaNumber", "dailyWithdrawLimitKes", "autoLockSavings",
  "tillNumber", "shopName", "lowFloatAlertSats",
  "payoutMpesaNumber", "statementFrequency", "compounding",
  "stewardFeePct", "cvvRotationMins", "defaultDeployMethod",
]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "setup", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const setup = read((db) => {
    const row = db.setups.find((s) => !s.archivedAt && s.userId === user.id);
    return row ? row.patch : {};
  });
  return ok(setup);
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "setup", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!body) return fail(400, "Setup object required");
  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.has(key)) return fail(400, `Unknown setup key: ${key}`);
  }
  const merged = await mutate((db) => {
    let row = db.setups.find((s) => !s.archivedAt && s.userId === (user as { id: string }).id);
    if (!row) {
      row = { userId: (user as { id: string }).id, patch: {}, updatedAt: "", archivedAt: null };
      db.setups.push(row);
    }
    row.patch = { ...row.patch, ...body };
    row.updatedAt = new Date().toISOString();
    return row.patch;
  });
  return ok(merged);
}
