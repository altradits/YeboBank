"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";

// ── Web Audio synthesizer (module-level singleton) ────────────────────────────
let _actx: AudioContext | null = null;

function getACtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  try {
    if (!_actx || _actx.state === "closed") _actx = new AudioContext();
    return _actx;
  } catch { return null; }
}

// Short noise-burst — phone keyboard tap / PIN digit
function playKey() {
  const ctx = getACtx();
  if (!ctx || ctx.state !== "running") return;
  const sr  = ctx.sampleRate;
  const len = Math.floor(sr * 0.048);
  const buf = ctx.createBuffer(1, len, sr);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++)
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.006));
  const src  = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buf;
  gain.gain.setValueAtTime(0.22, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.048);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

// Rising chime — M-Pesa-style notification
type Note = [number, number, number]; // [delaySec, hz, vol]
function playNotify(variant: "confirm" | "deposit" = "confirm") {
  const ctx = getACtx();
  if (!ctx || ctx.state !== "running") return;
  const notes: Note[] = variant === "deposit"
    ? [[0, 784, 0.18], [0.13, 988, 0.15], [0.26, 1175, 0.11]]  // G5 B5 D6
    : [[0, 1046.5, 0.18], [0.15, 1318.5, 0.14]];                // C6 E6
  notes.forEach(([delay, freq, vol]) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.42);
  });
}
// ─────────────────────────────────────────────────────────────────────────────

// 0: login  1: deposit amount  2: M-Pesa STK  3: deposit confirmed  4: lock savings
type Phase = 0 | 1 | 2 | 3 | 4;

const WORDS: { t: string; cls?: string }[] = [
  { t: "Save" }, { t: "in" }, { t: "Bitcoin.", cls: "gold" },
  { t: "Spend" }, { t: "in" }, { t: "shillings.", cls: "grn" },
];
const DEMO_PHONE = "0707172370";
const DEMO_KES   = 500;

export default function Hero() {
  const router  = useRouter();
  const rate    = useRate();
  const [loopKey, setLoopKey] = useState(0);

  // simulation
  const [phase,        setPhase]        = useState<Phase>(0);
  const [typedPhone,   setTypedPhone]   = useState("");
  const [typedAmount,  setTypedAmount]  = useState("");
  const [pinDots,      setPinDots]      = useState(0);
  const [simConfirmed, setSimConfirmed] = useState(false);
  const [lockConfirmed, setLockConfirmed] = useState(false);

  // cursor
  const [cursorPos,  setCursorPos]  = useState({ x: 149, y: 260 });
  const [clicking,   setClicking]   = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  const hRef       = useRef<HTMLHeadingElement>(null);
  const depositSats = Math.round(DEMO_KES * rate.satsPerKes);

  /* ── Reset all sim state when loop restarts ── */
  useEffect(() => {
    setPhase(0);
    setTypedPhone("");
    setTypedAmount("");
    setPinDots(0);
    setSimConfirmed(false);
    setLockConfirmed(false);
    setCursorPos({ x: 149, y: 260 });
    setClicking(false);
    setShowCursor(true);
  }, [loopKey]);

  /* ── Resume AudioContext on first user gesture ── */
  useEffect(() => {
    const resume = () => getACtx()?.resume();
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown",     resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown",     resume);
    };
  }, []);

  /* ── Phase progression + loop ── */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase(4);
      setLockConfirmed(true);
      setShowCursor(false);
      return;
    }
    const t = [
      setTimeout(() => setPhase(1), 2400),
      setTimeout(() => setPhase(2), 4400),
      setTimeout(() => setPhase(3), 6200),
      setTimeout(() => setPhase(4), 8200),
      setTimeout(() => setLockConfirmed(true), 9600),
      setTimeout(() => setLoopKey(k => k + 1), 12000),
    ];
    return () => t.forEach(clearTimeout);
  }, [loopKey]);

  /* ── Typing: phone digits, amount, PIN dots ── */
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    DEMO_PHONE.split("").forEach((ch, i) =>
      t.push(setTimeout(() => { setTypedPhone(p => p + ch); playKey(); }, 520 + i * 120))
    );
    ["5","0","0"].forEach((ch, i) =>
      t.push(setTimeout(() => { setTypedAmount(p => p + ch); playKey(); }, 2820 + i * 260))
    );
    [0,1,2,3].forEach(i =>
      t.push(setTimeout(() => { setPinDots(i + 1); playKey(); }, 4720 + i * 280))
    );
    t.push(setTimeout(() => setSimConfirmed(true), 5700));
    return () => t.forEach(clearTimeout);
  }, [loopKey]);

  /* ── Notification sounds ── */
  useEffect(() => {
    if (simConfirmed) playNotify("confirm");
  }, [simConfirmed]);

  useEffect(() => {
    if (phase !== 3) return;
    const t = setTimeout(() => playNotify("deposit"), 120);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!lockConfirmed) return;
    playNotify("confirm");
  }, [lockConfirmed]);

  /* ── Cursor choreography ── */
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    const mv  = (x: number, y: number, ms: number) =>
      t.push(setTimeout(() => setCursorPos({ x, y }), ms));
    const tap = (ms: number) => {
      t.push(setTimeout(() => setClicking(true),  ms));
      t.push(setTimeout(() => setClicking(false), ms + 340));
    };

    // Phase 0 — phone number
    mv(149, 232, 100);  tap(260);
    mv(149, 322, 1980); tap(2130);

    // Phase 1 — deposit amount
    mv(149, 225, 2580); tap(2700);
    mv(149, 316, 3860); tap(4000);

    // Phase 2 — M-Pesa PIN
    mv(149, 300, 4500); tap(4680);

    // Phase 3 — tap the Lock prompt
    mv(149, 320, 6500); tap(6640);

    // Phase 4 — tap "Lock sats" button
    mv(149, 330, 8500); tap(8680);
    t.push(setTimeout(() => setShowCursor(false), 9900));

    return () => t.forEach(clearTimeout);
  }, [loopKey]);

  /* ── Headline reveal ── */
  useEffect(() => {
    const id = setTimeout(() => hRef.current?.classList.add("go"), 150);
    return () => clearTimeout(id);
  }, []);

  return (
    <header className="hero">
      <div className="wrap">

        {/* ── Left copy ── */}
        <div>
          <h1 className="hero-h" ref={hRef}>
            {WORDS.map((w, i) => (
              <span key={i} className={`word${w.cls ? " " + w.cls : ""}`}
                style={{ transitionDelay: `${i * 0.08}s` }}>
                {w.t}
              </span>
            ))}
          </h1>
          <p className="hero-sub reveal d1">
            Earn interest in sats. Top up and cash out through M-Pesa.
          </p>
          <div className="hero-cta reveal d2">
            <button className="hero-btn" onClick={() => router.push("/login")}>
              Open a free account
            </button>
          </div>
        </div>

        {/* ── Phone frame ── */}
        <div className="hero-phone reveal d3">
          <div className="hp-vol" aria-hidden="true" />
          <div className="hp-pwr" aria-hidden="true" />

          <div className="hp-body">
            <div className="hp-screen">
              <div className="hp-glow" aria-hidden="true" />
              <div className="hp-island" aria-hidden="true" />

              {showCursor && (
                <div className={`hp-cursor${clicking ? " click" : ""}`}
                  style={{ left: cursorPos.x, top: cursorPos.y }}
                  aria-hidden="true" />
              )}

              {/* Progress dots — 4 steps: login → deposit → confirm → lock */}
              <div className="hp-dots" aria-hidden="true">
                {[0,1,2,3].map(i => (
                  <span key={i} className={
                    phase >= 4 ? "done" :
                    i === phase ? "on" :
                    i < phase ? "done" : ""
                  } />
                ))}
              </div>

              {/* ── Phase 0: Enter phone number ── */}
              {phase === 0 && (
                <div className="hp-sim">
                  <div className="hp-sim-logo"><b className="hp-mk">Y</b> YeboBank</div>
                  <div className="hp-sim-title">Welcome back</div>
                  <div className="hp-sim-field-wrap">
                    <div className="hp-sim-field-label">Phone number</div>
                    <div className="hp-sim-field">
                      {typedPhone || <span className="hp-ph">+254 7XX XXX XXX</span>}
                    </div>
                  </div>
                  <div className="hp-sim-spacer" />
                  <div className="hp-sim-btn">Continue <i className="ti ti-arrow-right" /></div>
                </div>
              )}

              {/* ── Phase 1: Enter deposit amount ── */}
              {phase === 1 && (
                <div className="hp-sim">
                  <div className="hp-sim-back"><i className="ti ti-arrow-left" /> Add money</div>
                  <div className="hp-sim-title">How much?</div>
                  <div className="hp-sim-field-wrap">
                    <div className="hp-sim-field-label">Amount (KES)</div>
                    <div className={`hp-sim-field hp-sim-field-lg${typedAmount ? "" : " empty"}`}>
                      {typedAmount ? `KES ${typedAmount}` : <span className="hp-ph">KES 0</span>}
                    </div>
                    {typedAmount && (
                      <div className="hp-sim-rate">
                        ≈ {num(Math.round(parseFloat(typedAmount) * rate.satsPerKes))} sats at live rate
                      </div>
                    )}
                  </div>
                  <div className="hp-sim-spacer" />
                  <div className="hp-sim-btn hp-sim-mpesa">
                    <i className="ti ti-device-mobile" /> Send via M-Pesa
                  </div>
                </div>
              )}

              {/* ── Phase 2: M-Pesa STK Push ── */}
              {phase === 2 && (
                <div className="hp-sim">
                  <div className="hp-sim-stk-hdr">
                    M-PESA <span>STK Push</span>
                  </div>
                  <div className="hp-sim-card">
                    <div className="hp-sim-row"><span>Pay to</span><b>YeboBank</b></div>
                    <div className="hp-sim-row"><span>Amount</span><b>KES {DEMO_KES}</b></div>
                    <div className="hp-sim-row"><span>You receive</span><b className="grn">≈ {num(depositSats)} sats</b></div>
                  </div>
                  {!simConfirmed ? (
                    <div className="hp-sim-pin-wrap">
                      <div className="hp-sim-field-label">Enter M-Pesa PIN</div>
                      <div className="hp-sim-pin">
                        {[0,1,2,3].map(i => (
                          <div key={i} className={`hp-sim-pin-dot${i < pinDots ? " filled" : ""}`} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="hp-sim-ok">
                      <i className="ti ti-circle-check" /> Confirmed instantly
                    </div>
                  )}
                </div>
              )}

              {/* ── Phase 3: Deposit landed ── */}
              {phase === 3 && (
                <div className="hp-sim">
                  <div className="hp-sim-ok"><i className="ti ti-circle-check" /> Deposit received</div>
                  <div className="hp-sim-big">+{num(depositSats)} <small>sats</small></div>
                  <div className="hp-sim-conv">from KES {DEMO_KES} via M-Pesa</div>
                  <div className="hp-sim-card" style={{ marginTop: 10 }}>
                    <div className="hp-sim-row"><span>New balance</span><b>{num(depositSats)} sats</b></div>
                    <div className="hp-sim-row"><span>In shillings</span><b>KES {num(depositSats * rate.kesPerSat, 2)}</b></div>
                  </div>
                  <div className="hp-sim-earn">
                    <i className="ti ti-lock" /> Tap Lock to earn ~5.2% APY
                  </div>
                </div>
              )}

              {/* ── Phase 4: Lock savings ── */}
              {phase === 4 && (
                <div className="hp-sim">
                  <div className="hp-sim-back"><i className="ti ti-arrow-left" /> Your wallet</div>
                  <div className="hp-sim-title">Lock savings</div>
                  <div className="hp-sim-card">
                    <div className="hp-sim-row"><span>Amount</span><b>{num(depositSats)} sats</b></div>
                    <div className="hp-sim-row"><span>Term</span><b>5 years</b></div>
                    <div className="hp-sim-row"><span>Yield</span><b className="grn">~5.2% APY</b></div>
                  </div>
                  {!lockConfirmed ? (
                    <div className="hp-sim-btn hp-sim-lock">
                      <i className="ti ti-lock" /> Lock sats
                    </div>
                  ) : (
                    <div className="hp-sim-ok">
                      <i className="ti ti-circle-check" /> Locked for 5 years
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
