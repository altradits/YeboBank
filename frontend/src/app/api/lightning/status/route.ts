import { NextRequest, NextResponse } from "next/server";
import { mutate, read } from "@/server/store";
import { getAltradits } from "@/server/altradits";
import { requireUser, ok, fail, throttle } from "@/server/http";
import { creditLightningDeposit } from "@/server/lightning-credit";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "ln-status", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const hash = req.nextUrl.searchParams.get("hash") || "";
  if (!/^[0-9a-f]{64}$/.test(hash)) return fail(400, "Payment hash required");

  let status;
  try {
    status = await getAltradits().getStatus(hash);
  } catch (e) {
    return fail(502, e instanceof Error ? e.message : "Status failed");
  }
  if (status.status === "settled") {
    const uid = (user as { id: string }).id;
    const mine = read((db) => {
      const rows = (db.docs.invoices || []) as unknown as Array<{ hash: string; userId: string }>;
      return rows.some((r) => r.hash === hash && r.userId === uid);
    });
    if (mine) {
      await mutate((db) => creditLightningDeposit(db, uid, hash, status.amountSats));
    }
  }
  return ok({ status: status.status, amountSats: status.amountSats, settledAt: status.settledAt });
}
