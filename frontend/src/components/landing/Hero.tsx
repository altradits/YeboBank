"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";

// ── Web Audio synthesizer (module-level singleton) ────────────────────────────
let _actx: AudioContext | null = null;

function getACtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
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

type Phase = 0 | 1 | 2 | 3 | 4;

const WORDS: { t: string; cls?: string }[] = [
  { t: "Save" }, { t: "in" }, { t: "Bitcoin.", cls: "gold" },
  { t: "Spend" }, { t: "in" }, { t: "shillings.", cls: "grn" },
];
const KEYS       = ["1","2","3","4","5","6","7","8","9",".","0","⌫"] as const;
const DEMO_PHONE = "+254712345678";
const DEMO_KES   = 500;

export default function Hero() {
  const router = useRouter();
  const rate   = useRate();

  // simulation
  const [phase,        setPhase]        = useState<Phase>(0);
  const [typedPhone,   setTypedPhone]   = useState("");
  const [typedAmount,  setTypedAmount]  = useState("");
  const [pinDots,      setPinDots]      = useState(0);
  const [simConfirmed, setSimConfirmed] = useState(false);

  // cursor
  const [cursorPos,  setCursorPos]  = useState({ x: 149, y: 260 });
  const [clicking,   setClicking]   = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // converter (phase 4)
  const [view,     setView]     = useState<"sats"|"kes"|"btc">("sats");
  const [editSats, setEditSats] = useState(0);
  const [rawInput, setRawInput] = useState("0");

  const hRef      = useRef<HTMLHeadingElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const depositSats = Math.round(DEMO_KES * rate.satsPerKes);

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

  /* ── phase progression ── */
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 2400),
      setTimeout(() => setPhase(2), 4400),
      setTimeout(() => setPhase(3), 6200),
      setTimeout(() => setPhase(4), 8000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  /* ── typing: phone digits, amount digits, PIN dots (with key sounds) ── */
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];

    // Phase 0: type phone number char by char
    DEMO_PHONE.split("").forEach((ch, i) =>
      t.push(setTimeout(() => { setTypedPhone(p => p + ch); playKey(); }, 520 + i * 120))
    );

    // Phase 1: type "500"
    ["5","0","0"].forEach((ch, i) =>
      t.push(setTimeout(() => { setTypedAmount(p => p + ch); playKey(); }, 2820 + i * 260))
    );

    // Phase 2: PIN dots fill one by one
    [0,1,2,3].forEach(i =>
      t.push(setTimeout(() => { setPinDots(i + 1); playKey(); }, 4720 + i * 280))
    );
    t.push(setTimeout(() => setSimConfirmed(true), 5700));

    return () => t.forEach(clearTimeout);
  }, []);

  /* ── notification sounds ── */
  useEffect(() => {
    if (simConfirmed) playNotify("confirm");
  }, [simConfirmed]);

  useEffect(() => {
    if (phase !== 3) return;
    const t = setTimeout(() => playNotify("deposit"), 120);
    return () => clearTimeout(t);
  }, [phase]);

  /* ── cursor choreography ── */
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

    // Phase 3 — balance screen, then hide
    mv(149, 230, 6300);
    t.push(setTimeout(() => setShowCursor(false), 7600));

    return () => t.forEach(clearTimeout);
  }, []);

  /* ── headline reveal ── */
  useEffect(() => {
    const id = setTimeout(() => hRef.current?.classList.add("go"), 150);
    return () => clearTimeout(id);
  }, []);

  /* ── auto-focus hidden input when converter appears ── */
  useEffect(() => {
    if (phase !== 4) return;
    const t = setTimeout(() => hiddenRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [phase]);

  /* ── converter helpers ── */
  function fmtBtc(sats: number) {
    const btc = sats / 1e8;
    if (btc === 0) return "0.00000";
    return btc.toFixed(Math.max(5, -Math.floor(Math.log10(Math.abs(btc))) + 1));
  }
  function rawDisplay() {
    if (view === "sats") return `${rawInput} sats`;
    if (view === "kes")  return `KES ${rawInput}`;
    return `${rawInput} BTC`;
  }
  function setFromRaw(raw: string) {
    setRawInput(raw);
    const n = parseFloat(raw) || 0;
    if      (view === "sats") setEditSats(Math.round(n));
    else if (view === "kes")  setEditSats(Math.round(n * rate.satsPerKes));
    else                      setEditSats(Math.round(n * 1e8));
  }
  function handleKey(k: string) {
    if (phase !== 4) return;
    if (k === "⌫") {
      if (rawInput !== "0") playKey();
      setFromRaw(rawInput.slice(0, -1) || "0");
      return;
    }
    if (k === "." && (rawInput.includes(".") || view === "sats")) return;
    playKey();
    setFromRaw(rawInput === "0" && k !== "." ? k : rawInput + k);
  }
  function handleToggle(v: "sats"|"kes"|"btc") {
    const r = v === "sats" ? String(editSats)
            : v === "kes"  ? (editSats * rate.kesPerSat).toFixed(2)
            :                fmtBtc(editSats);
    setView(v); setRawInput(r);
  }
  function convLine() {
    if (view === "kes") return `${num(editSats)} sats`;
    return `KES ${num(editSats * rate.kesPerSat, 2)}`;
  }
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace")          { e.preventDefault(); handleKey("⌫"); return; }
    if (e.key === "." || e.key === ",") { e.preventDefault(); handleKey("."); return; }
    if (/^[0-9]$/.test(e.key))         { e.preventDefault(); handleKey(e.key); }
  }
  function go(path: string) {
    router.push(`/login?redirect=${encodeURIComponent(path)}`);
  }

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
          <div className="hero-stats reveal d2">
            <div className="hstat"><span className="hn">12,000+</span><span className="nl">Kenyans saving</span></div>
            <div className="hstat"><span className="hn">~5.2%</span><span className="nl">Target APY in sats</span></div>
            <div className="hstat"><span className="hn">KES 0</span><span className="nl">Account fees</span></div>
          </div>
        </div>

        {/* ── Phone frame ── */}
        <div className="hero-phone reveal d2">
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

              {phase < 4 && (
                <div className="hp-dots" aria-hidden="true">
                  {[0,1,2,3].map(i => (
                    <span key={i} className={i === phase ? "on" : i < phase ? "done" : ""} />
                  ))}
                </div>
              )}

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

              {/* ── Phase 4: Interactive converter ── */}
              {phase === 4 && (
                <>
                  <input ref={hiddenRef} className="hp-hidden-input"
                    type="text" inputMode="none" value="" onChange={() => {}}
                    onKeyDown={handleKeyDown} aria-label="Enter amount" />
                  <div className="hp-lbl">Enter amount to convert</div>
                  <div className="hp-amt hp-amt-counting"
                    onClick={() => hiddenRef.current?.focus()}
                    style={{ cursor: "text" }}>
                    {rawDisplay()}
                  </div>
                  <div className="hp-conv">≈ {convLine()}</div>
                  <div className="hp-tog" role="tablist" aria-label="Balance unit">
                    {(["sats","kes","btc"] as const).map(v => (
                      <button key={v} className={view === v ? "on" : ""} onClick={() => handleToggle(v)}>
                        {v === "btc" ? "BTC" : v === "kes" ? "KES" : "Sats"}
                      </button>
                    ))}
                  </div>
                  <div className="hp-bottom">
                    <div className="hp-kbd">
                      {KEYS.map(k => (
                        <button key={k}
                          className={`hp-key${k==="⌫"?" del":""}${k==="."&&view==="sats"?" dim":""}`}
                          onClick={() => handleKey(k)}
                          aria-label={k === "⌫" ? "Delete" : k}>
                          {k === "⌫" ? <i className="ti ti-backspace" /> : k}
                        </button>
                      ))}
                    </div>
                    <div className="hp-actions">
                      <button onClick={() => go("/deposit")}><i className="ti ti-arrow-down" /><span>Add</span></button>
                      <button onClick={() => go("/savings/lock")}><i className="ti ti-lock" /><span>Lock</span></button>
                      <button onClick={() => go("/send")}><i className="ti ti-send" /><span>Send</span></button>
                      <button onClick={() => go("/chama")}><i className="ti ti-users" /><span>Chama</span></button>
                    </div>
                  </div>
                  <div className="hp-home" aria-hidden="true" />
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
