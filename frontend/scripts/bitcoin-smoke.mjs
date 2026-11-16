// End-to-end smoke test for the YeboBank bitcoin rail.
// Spins up `next dev` on port 3107 in mock-provider mode and exercises every
// bitcoin API route. No credentials, no network, no external services.
// Usage: npm run bitcoin:smoke  (from frontend/)

import { spawn } from "node:child_process";

const PORT = 3107;
const BASE = `http://127.0.0.1:${PORT}`;
let failures = 0;

function check(name, cond, detail = "") {
  if (cond) {
    console.log(`  PASS ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function waitForServer(proc, timeoutMs = 120000) {
  const start = Date.now();
  for (;;) {
    if (Date.now() - start > timeoutMs) throw new Error("dev server did not start in time");
    try {
      const res = await fetch(`${BASE}/api/bitcoin/status`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1500));
    if (proc.exitCode !== null) throw new Error(`dev server exited early (code ${proc.exitCode})`);
  }
}

async function main() {
  console.log(`[smoke] starting next dev on :${PORT} (BITCOIN_PROVIDER=mock)…`);
  const proc = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "-p", String(PORT)], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, BITCOIN_PROVIDER: "mock", PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  proc.stdout.on("data", (d) => { serverLog += d.toString().slice(-4000); });
  proc.stderr.on("data", (d) => { serverLog += d.toString().slice(-4000); });

  const kill = () => { try { proc.kill("SIGTERM"); } catch {} };
  process.on("exit", kill);

  try {
    await waitForServer(proc);
    console.log("[smoke] server up — running checks");

    // 1. status
    const status = await (await fetch(`${BASE}/api/bitcoin/status`)).json();
    check("status provider=mock", status.provider === "mock", JSON.stringify(status));
    check("status mode=sandbox", status.node?.mode === "sandbox", JSON.stringify(status.node));
    check("status leaks no secrets", JSON.stringify(status).toLowerCase().includes("macaroon") === false);

    // 2. quote
    const quote = await (await fetch(`${BASE}/api/bitcoin/quote?from=KES&to=SATS&amount=1000`)).json();
    check("quote returns positive sats", quote.result > 0 && quote.feePct === 1, JSON.stringify(quote));
    const badQuote = await fetch(`${BASE}/api/bitcoin/quote?from=KES&to=XXX&amount=1000`);
    check("quote rejects bad currency", badQuote.status === 400);

    // 3. create invoice
    const invRes = await fetch(`${BASE}/api/deposit/lightning`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sats: 5000 }),
    });
    const inv = await invRes.json();
    check("create invoice 200", invRes.status === 200, JSON.stringify(inv).slice(0, 200));
    check("invoice looks like bolt11", typeof inv.invoice === "string" && inv.invoice.startsWith("lnbc"));
    check("paymentHash is 64 hex", /^[0-9a-f]{64}$/i.test(inv.paymentHash ?? ""));

    // 4. lookup invoice
    const lookup = await (await fetch(`${BASE}/api/bitcoin/invoices/${inv.paymentHash}`)).json();
    check("lookup shows open/5000", lookup.status === "open" && lookup.amountSats === 5000, JSON.stringify(lookup));

    // 5. validation
    const tiny = await fetch(`${BASE}/api/deposit/lightning`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sats: 1 }),
    });
    check("rejects 1-sat invoice", tiny.status === 400);
    const badPay = await fetch(`${BASE}/api/withdraw/lightning`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceOrAddress: "not-an-invoice", sats: 100 }),
    });
    check("rejects bad destination", badPay.status === 400);

    // 6. pay invoice (idempotent)
    const payBody = JSON.stringify({ invoiceOrAddress: inv.invoice, sats: 5000 });
    const pay1 = await (await fetch(`${BASE}/api/withdraw/lightning`, {
      method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": "smoke-key-1" },
      body: payBody,
    })).json();
    const pay2 = await (await fetch(`${BASE}/api/withdraw/lightning`, {
      method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": "smoke-key-1" },
      body: payBody,
    })).json();
    check("pay settles", pay1.ok === true && pay1.status === "settled", JSON.stringify(pay1));
    check("idempotent retry returns same payment", pay1.paymentId && pay1.paymentId === pay2.paymentId);

    // 7. agent routes
    const agentInv = await (await fetch(`${BASE}/api/agent/invoice`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountSats: 2500 }),
    })).json();
    check("agent invoice", typeof agentInv.invoice === "string" && agentInv.invoice.startsWith("lnbc"));
    const topup = await (await fetch(`${BASE}/api/agent/float/topup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountSats: 10000 }),
    })).json();
    check("agent float topup", typeof topup.invoice === "string" && topup.invoice.startsWith("lnbc"));
    const agentPay = await (await fetch(`${BASE}/api/agent/pay`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceOrAddress: agentInv.invoice, amountSats: 2500 }),
    })).json();
    check("agent pay", agentPay.ok === true, JSON.stringify(agentPay));

    // 8. on-chain address
    const addr = await (await fetch(`${BASE}/api/bitcoin/onchain-address`)).json();
    check("onchain address (mock-marked)", typeof addr.address === "string" && addr.address.includes("yebomock"), addr.address);

    // 9. LNURL-pay
    const lnurlp = await (await fetch(`${BASE}/.well-known/lnurlp/wanjiku`)).json();
    check("lnurlp metadata", lnurlp.tag === "payRequest" && String(lnurlp.callback).includes("/api/lnurlp/callback"));
    const cbUrl = new URL(lnurlp.callback);
    cbUrl.searchParams.set("amount", "5000000"); // 5000 sats in msats
    // callback URL points at APP_BASE_URL (localhost:3000 default) — re-target to the smoke server
    const cbTarget = `${BASE}/api/lnurlp/callback?username=wanjiku&amount=5000000`;
    const cb = await (await fetch(cbTarget)).json();
    check("lnurlp callback returns invoice", typeof cb.pr === "string" && cb.pr.startsWith("lnbc"), JSON.stringify(cb).slice(0, 120));

    // 10. webhook auth
    const unsigned = await fetch(`${BASE}/api/bitcoin/webhook`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "invoice.settled", invoice_id: "x" }),
    });
    check("webhook rejects unsigned", unsigned.status === 401);

    console.log(failures === 0 ? "[smoke] ALL CHECKS PASSED" : `[smoke] ${failures} CHECK(S) FAILED`);
    process.exitCode = failures === 0 ? 0 : 1;
  } catch (e) {
    console.error("[smoke] ERROR:", e?.message ?? e);
    console.error(serverLog.slice(-2000));
    process.exitCode = 1;
  } finally {
    kill();
  }
}

main();
