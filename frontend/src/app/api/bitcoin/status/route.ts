// GET /api/bitcoin/status — rail health for ops + the UI status pill.
// Returns the active provider, node/rail info, and which backends are
// configured. NEVER includes secrets.

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never bake provider status at build time

import { getBitcoinProvider } from "@/server/bitcoin";
import { getBitcoinConfig, publicProviderStatus } from "@/server/bitcoin/config";
import { ok, toErrorResponse } from "../_lib";

export async function GET(): Promise<Response> {
  try {
    const cfg = getBitcoinConfig();
    const provider = getBitcoinProvider();
    const node = await provider.getNodeInfo();
    return ok({ ...publicProviderStatus(cfg), node });
  } catch (e) {
    return toErrorResponse(e);
  }
}
