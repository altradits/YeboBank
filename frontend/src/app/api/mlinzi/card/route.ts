import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { getCard, generateCard, updateCard, deleteCard } from "@/server/sim";
import { requireMlinzi, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 60, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  return ok(await mutate((db) => getCard(db)));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 20, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const period = body?.rotationPeriodSecs;
  const limit = body?.limitSats;
  if (period !== undefined && (typeof period !== "number" || period < 60)) return fail(400, "Bad rotation period");
  if (limit !== undefined && limit !== null && (typeof limit !== "number" || limit <= 0)) return fail(400, "Bad limit");
  return ok(await mutate((db) => generateCard(db, (period as number) ?? 900, (limit as number | null) ?? null)));
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 30, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const patch: Parameters<typeof updateCard>[1] = {};
  if (body?.status !== undefined) {
    if (body.status !== "active" && body.status !== "frozen") return fail(400, "Bad status");
    patch.status = body.status;
  }
  if (body?.limitSats !== undefined) {
    if (body.limitSats !== null && (typeof body.limitSats !== "number" || body.limitSats <= 0)) {
      return fail(400, "Bad limit");
    }
    patch.limitSats = body.limitSats;
  }
  if (body?.cvvRotationPeriodSecs !== undefined) {
    if (typeof body.cvvRotationPeriodSecs !== "number" || body.cvvRotationPeriodSecs < 60) {
      return fail(400, "Bad rotation period");
    }
    patch.cvvRotationPeriodSecs = body.cvvRotationPeriodSecs;
  }
  try {
    return ok(await mutate((db) => updateCard(db, patch)));
  } catch {
    return fail(404, "No card");
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 20, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  await mutate((db) => deleteCard(db));
  return ok({ deleted: true });
}
