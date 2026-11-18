// End-to-end smoke test for the YeboBank bitcoin rail + demo backend.
// Spins up `next dev` and exercises auth, invoices, settlement webhooks,
// ledger credits, payments, quotes, agent flows, and LNURL.
// Provider from env (default: altradits fake). No credentials, no network.
// Usage:
//   npm run bitcoin:smoke                    # altradits fake (default path)
//   BITCOIN_PROVIDER=mock npm run bitcoin:smoke   # full-interface mock

import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = 3107;
const BASE = `http://127.0.0.1:${PORT}`;
const PROVIDER = process.env.BITCOIN_PROVIDER || "altradits";
const DB = join(tmpdir(), `yebo-smoke-${process.pid}.json`);
let failures = 0;

function check(name, cond, detail = "") {
  if (cond) {
    console.log(`  PASS ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// --- cookie jars + CSRF (one session per persona) ---
function newJar() { return { cookie: "", csrf: "" }; }
const jars = { member: newJar(), agent: newJar(), mlinzi: newJar() };
function storeCookies(res, jar) {
  const set = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const pairs = [];
  for (const c of set) {
    const [pair] = c.split(";");
    pairs.push(pair);
    const m = /^yebo_csrf=([^;]+)/.exec(pair.trim());
    if (m) jar.csrf = m[1];
  }
  if (pairs.length) jar.cookie = pairs.join("; ");
}
async function api(method, path, body, { as = null } = {}) {
  const headers = { "Content-Type": "application/json" };
  const auth = as !== null;
  if (auth) {
    headers.Cookie = jars[as].cookie;
    if (method !== "GET" && method !== "HEAD") headers["x-csrf-token"] = jars[as].csrf;
  }
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (as) storeCookies(res, jars[as]);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json, text };
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
  console.log(`[smoke] provider=${PROVIDER} db=${DB}`);
  const proc = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "-p", String(PORT)], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env, BITCOIN_PROVIDER: PROVIDER, PORT: String(PORT),
      DATABASE_PATH: DB, ALTRADITS_WEBHOOK_SECRET: "test-secret",
      WEBHOOK_INTERNAL_TOKEN: "test-internal",
    },
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

    // 1. status (public)
    const status = (await api("GET", "/api/bitcoin/status")).json;
    check("status provider matches", status.provider === PROVIDER, JSON.stringify(status));
    check("status mode=sandbox", status.node?.mode === "sandbox");
    check("status leaks no secrets", !/macaroon|secret|api[_-]?key/i.test(JSON.stringify(status)));

    // 2. money routes require auth
    const anon = await api("POST", "/api/deposit/lightning", { sats: 5000 });
    check("deposit rejects anonymous", anon.status === 401, `got ${anon.status}`);

    // 3. login as seeded demo users (PIN documented in server/auth.ts)
    const login = await api("POST", "/api/login", { phone: "+254712345678", pin: "284649" }, { as: "member" });
    check("login works", login.status === 200 && !!jars.member.csrf, `got ${login.status}`);
    const loginAgent = await api("POST", "/api/login", { phone: "+254700000002", pin: "284649" }, { as: "agent" });
    check("agent login works", loginAgent.status === 200 && !!jars.agent.csrf, `got ${loginAgent.status}`);
    const loginMlinzi = await api("POST", "/api/login", { phone: "+254700000001", pin: "284649" }, { as: "mlinzi" });
    check("mlinzi login works", loginMlinzi.status === 200 && !!jars.mlinzi.csrf, `got ${loginMlinzi.status}`);
    const A = { as: "member" };
    const AG = { as: "agent" };
    const ML = { as: "mlinzi" };

    // 4. fresh wallet is empty
    const w0 = await api("GET", "/api/wallet", undefined, A);
    check("wallet starts at 0", w0.json?.balanceSats === 0, JSON.stringify(w0.json));

    // 5. quotes
    const quote = (await api("GET", "/api/bitcoin/quote?from=KES&to=SATS&amount=1000")).json;
    check("quote positive w/ 0.5% fee", quote.result > 0 && quote.feePct === 0.5, JSON.stringify(quote));
    const badQuote = await api("GET", "/api/bitcoin/quote?from=KES&to=XXX&amount=1000");
    check("quote rejects bad currency", badQuote.status === 400);

    // 6. create invoice
    const invRes = await api("POST", "/api/deposit/lightning", { sats: 5000 }, A);
    const inv = invRes.json;
    const fakePrefix = PROVIDER === "mock" ? "lnbc" : "lntbs";
    check("create invoice 200", invRes.status === 200, JSON.stringify(inv).slice(0, 200));
    check(`invoice is ${fakePrefix} fake`, typeof inv.invoice === "string" && inv.invoice.startsWith(fakePrefix));
    check("paymentHash is 64 hex", /^[0-9a-f]{64}$/i.test(inv.paymentHash ?? ""));
    check("nothing credited yet", inv.satsCredited === 0);

    // 7. both status paths agree
    const lookup = (await api("GET", `/api/bitcoin/invoices/${inv.paymentHash}`)).json;
    check("rail lookup open/5000", lookup.status === "open" && lookup.amountSats === 5000, JSON.stringify(lookup));
    const theirs = (await api("GET", `/api/lightning/status?hash=${inv.paymentHash}`, undefined, A)).json;
    check("backend status pending/5000", theirs.status === "pending" && theirs.amountSats === 5000, JSON.stringify(theirs));
    const w1 = (await api("GET", "/api/wallet", undefined, A)).json;
    check("wallet still 0 before settlement", w1.balanceSats === 0);

    // 8. canonical webhook settles → ledger credits (contract signature)
    async function signedWebhook(payload, { tamper = false, ts = String(Date.now()) } = {}) {
      const raw = JSON.stringify(payload);
      const sig = createHmac("sha256", "test-secret").update(`${ts}.${raw}`).digest("hex");
      const res = await fetch(`${BASE}/api/webhooks/altradits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-altradits-timestamp": ts,
          "x-altradits-signature": tamper ? "00".repeat(32) : sig,
        },
        body: raw,
      });
      return { status: res.status, json: await res.json().catch(() => null) };
    }
    const good = { event: "invoice.settled", paymentHash: inv.paymentHash, amountSats: 5000 };
    const wh1 = await signedWebhook(good);
    check("webhook accepts valid signature", wh1.status === 200, `got ${wh1.status}`);
    const w2 = (await api("GET", "/api/wallet", undefined, A)).json;
    check("wallet credited 5000", w2.balanceSats === 5000, JSON.stringify(w2));
    const replay = await signedWebhook(good);
    const w3 = (await api("GET", "/api/wallet", undefined, A)).json;
    check("webhook replay idempotent", replay.status === 200 && w3.balanceSats === 5000, JSON.stringify(w3));
    const wrongAmt = await signedWebhook({ ...good, amountSats: 999 });
    const w4 = (await api("GET", "/api/wallet", undefined, A)).json;
    check("amount mismatch credits nothing", wrongAmt.status === 200 && w4.balanceSats === 5000);
    const unknown = await signedWebhook({ ...good, paymentHash: "ab".repeat(32) });
    check("unknown invoice acknowledged", unknown.status === 200);
    const bad = await signedWebhook(good, { tamper: true });
    check("webhook rejects bad signature", bad.status === 401, `got ${bad.status}`);
    const stale = await signedWebhook(good, { ts: String(Date.now() - 10 * 60_000) });
    check("webhook rejects stale timestamp", stale.status === 401, `got ${stale.status}`);

    // 9. withdraw: pay a fresh invoice, balance-checked
    const inv2 = (await api("POST", "/api/deposit/lightning", { sats: 2000 }, A)).json;
    const pay1 = await api("POST", "/api/withdraw/lightning",
      { invoiceOrAddress: inv2.invoice, sats: 2000 }, A);
    check("withdraw settles", pay1.json?.ok === true, JSON.stringify(pay1.json));
    const w5 = (await api("GET", "/api/wallet", undefined, A)).json;
    check("wallet debited to 3000", w5.balanceSats === 3000, JSON.stringify(w5));
    const broke = await api("POST", "/api/withdraw/lightning",
      { invoiceOrAddress: inv2.invoice, sats: 999999 }, A);
    check("insufficient balance → 402", broke.status === 402, `got ${broke.status}`);

    // 10. idempotent pay retry debits once
    const key = { "Idempotency-Key": "smoke-key-1" };
    const mkPay = () => fetch(`${BASE}/api/withdraw/lightning`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: jars.member.cookie, "x-csrf-token": jars.member.csrf, ...key },
      body: JSON.stringify({ invoiceOrAddress: inv2.invoice, sats: 1000 }),
    }).then(async (r) => ({ status: r.status, json: await r.json() }));
    const p1 = await mkPay();
    const p2 = await mkPay();
    const w6 = (await api("GET", "/api/wallet", undefined, A)).json;
    check("idempotent retry same payment", p1.json?.paymentId && p1.json.paymentId === p2.json?.paymentId,
      `${JSON.stringify(p1.json)} vs ${JSON.stringify(p2.json)}`);
    check("idempotent retry debits once", w6.balanceSats === 2000, JSON.stringify(w6));

    // 11. validation
    const tiny = await api("POST", "/api/deposit/lightning", { sats: 1 }, A);
    check("rejects 1-sat invoice", tiny.status === 400);
    const badPay = await api("POST", "/api/withdraw/lightning", { invoiceOrAddress: "not-an-invoice", sats: 100 }, A);
    check("rejects bad destination", badPay.status === 400);

    // 12. agent flows (agent session; members are forbidden)
    const agentInv = (await api("POST", "/api/agent/invoice", { amountSats: 2500 }, AG)).json;
    check("agent invoice", typeof agentInv.invoice === "string" && agentInv.invoice.startsWith(fakePrefix));
    const topup = (await api("POST", "/api/agent/float/topup", { amountSats: 10000 }, AG)).json;
    check("agent float topup", typeof topup.invoice === "string" && topup.invoice.startsWith(fakePrefix));
    const agentPay = (await api("POST", "/api/agent/pay",
      { invoiceOrAddress: agentInv.invoice, amountSats: 2500 }, AG)).json;
    check("agent pay", agentPay.ok === true, JSON.stringify(agentPay));
    const agentAnon = await api("POST", "/api/agent/invoice", { amountSats: 10 });
    check("agent routes reject anonymous", agentAnon.status === 401);
    const agentMember = await api("POST", "/api/agent/invoice", { amountSats: 10 }, A);
    check("agent routes reject non-agent member", agentMember.status === 403, `got ${agentMember.status}`);
    const agentState = await api("GET", "/api/agent", undefined, AG);
    check("agent state loads", agentState.status === 200, `got ${agentState.status}`);

    // 13. on-chain: mock serves, altradits 501s per contract
    const addrRes = await api("GET", "/api/bitcoin/onchain-address");
    if (PROVIDER === "mock") {
      check("mock onchain address marked", addrRes.json?.address?.includes("yebomock"), JSON.stringify(addrRes.json));
    } else {
      check("altradits onchain unsupported", addrRes.status === 501, `got ${addrRes.status}`);
    }

    // 14. LNURL-pay
    const lnurlp = (await api("GET", "/.well-known/lnurlp/wanjiku")).json;
    check("lnurlp metadata", lnurlp.tag === "payRequest" && String(lnurlp.callback).includes("/api/lnurlp/callback"));
    const cb = (await api("GET", "/api/lnurlp/callback?username=wanjiku&amount=5000000")).json;
    check("lnurlp callback returns invoice", typeof cb.pr === "string" && cb.pr.startsWith(fakePrefix),
      JSON.stringify(cb).slice(0, 120));
    const noUser = await api("GET", "/.well-known/lnurlp/nouser00");
    check("lnurlp unknown user → 404", noUser.status === 404, `got ${noUser.status}`);
    const noUserCb = await api("GET", "/api/lnurlp/callback?username=nouser00&amount=5000000");
    check("lnurlp callback unknown user → 404", noUserCb.status === 404, `got ${noUserCb.status}`);

    // 15. internal poller webhook
    const noTok = await fetch(`${BASE}/api/bitcoin/webhook`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "invoice.settled", payment_hash: inv.paymentHash }),
    });
    check("internal webhook rejects no token", noTok.status === 401, `got ${noTok.status}`);
    const withTok = await fetch(`${BASE}/api/bitcoin/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-token": "test-internal" },
      body: JSON.stringify({ type: "invoice.settled", payment_hash: "cd".repeat(32) }),
    });
    check("internal webhook accepts token", withTok.status === 200, `got ${withTok.status}`);

    // 16. merged backend groups mount with the same auth model
    const chamaAnon = await api("GET", "/api/chama");
    check("chamas reject anonymous", chamaAnon.status === 401, `got ${chamaAnon.status}`);
    const chamas = await api("GET", "/api/chama", undefined, A);
    check("chamas list loads", chamas.status === 200 && Array.isArray(chamas.json), `got ${chamas.status}`);
    const savingsAnon = await api("GET", "/api/savings");
    check("savings reject anonymous", savingsAnon.status === 401, `got ${savingsAnon.status}`);
    const savings = await api("GET", "/api/savings", undefined, A);
    check("savings list loads", savings.status === 200 && Array.isArray(savings.json), `got ${savings.status}`);
    const mlinziMember = await api("GET", "/api/mlinzi/access", undefined, A);
    check("mlinzi routes reject member", mlinziMember.status === 403, `got ${mlinziMember.status}`);
    const mlinziOk = await api("GET", "/api/mlinzi/access", undefined, ML);
    check("mlinzi routes load for mlinzi", mlinziOk.status === 200, `got ${mlinziOk.status}`);
    const mpesaAnon = await api("POST", "/api/deposit/mpesa", { kes: 1000 });
    check("mpesa deposit rejects anonymous", mpesaAnon.status === 401, `got ${mpesaAnon.status}`);
    const wBefore = (await api("GET", "/api/wallet", undefined, A)).json.balanceSats;
    const mpesa = await api("POST", "/api/deposit/mpesa", { kes: 1000 }, A);
    const wAfter = (await api("GET", "/api/wallet", undefined, A)).json.balanceSats;
    check("simulated mpesa deposit credits", mpesa.status === 200 && wAfter > wBefore,
      `status=${mpesa.status} ${wBefore}->${wAfter}`);

    // 17. chama action PIN is verified server-side (seed PIN 284649)
    const CHAMA = "c_demo_mboga";
    const tNoPin = await api("POST", `/api/chama/${CHAMA}/transfer`,
      { toHandle: "@wanjiku", sats: 500 }, A);
    check("transfer without PIN → 400", tNoPin.status === 400, `got ${tNoPin.status}`);
    const tBadPin = await api("POST", `/api/chama/${CHAMA}/transfer`,
      { toHandle: "@wanjiku", sats: 500, pin: "000000" }, A);
    check("transfer wrong PIN → 401", tBadPin.status === 401, `got ${tBadPin.status}`);
    const wPre = (await api("GET", "/api/wallet", undefined, A)).json.balanceSats;
    const dep = await api("POST", `/api/chama/${CHAMA}/deposit`, { sats: 3000 }, A);
    const wPostDep = (await api("GET", "/api/wallet", undefined, A)).json.balanceSats;
    check("chama deposit debits wallet", dep.status === 200 && wPostDep === wPre - 3000,
      `status=${dep.status} ${wPre}->${wPostDep}`);
    const tOk = await api("POST", `/api/chama/${CHAMA}/transfer`,
      { toHandle: "@wanjiku", sats: 500, pin: "284649" }, A);
    check("transfer correct PIN passes", tOk.status === 200, `got ${tOk.status} ${JSON.stringify(tOk.json)}`);
    const wBadPin = await api("POST", `/api/chama/${CHAMA}/withdraw`, { sats: 500, pin: "000000" }, A);
    check("withdraw wrong PIN → 401", wBadPin.status === 401, `got ${wBadPin.status}`);
    const wBefore2 = (await api("GET", "/api/wallet", undefined, A)).json.balanceSats;
    const wOk = await api("POST", `/api/chama/${CHAMA}/withdraw`, { sats: 500, pin: "284649" }, A);
    const wAfter2 = (await api("GET", "/api/wallet", undefined, A)).json.balanceSats;
    check("withdraw correct PIN credits wallet",
      wOk.status === 200 && wAfter2 === wBefore2 + 500,
      `status=${wOk.status} ${wBefore2}->${wAfter2}`);

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
