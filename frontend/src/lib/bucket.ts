import type { SavingsDeposit } from "@/types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

export type Preset =
  | "Daily" | "Weekly" | "Monthly"
  | "Q1" | "Q2" | "Q3"
  | "1Y" | "2Y" | "3Y" | "4Y"
  | "5Y" | "6Y" | "7Y" | "8Y" | "9Y" | "10Y";

export const PRESETS: Preset[] = [
  "Daily", "Weekly", "Monthly", "Q1", "Q2", "Q3",
  "1Y", "2Y", "3Y", "4Y", "5Y", "6Y", "7Y", "8Y", "9Y", "10Y",
];

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

// Returns the Monday (UTC) of the week containing d.
function mondayOf(d: Date): Date {
  const dow = d.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
}

function quarterOf(d: Date): number {
  return Math.floor(d.getUTCMonth() / 3) + 1;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

interface Bucket { key: string; label: string; valueSats: number; }

/**
 * Sums deposits into time buckets for the given preset.
 * All date arithmetic is UTC. Values remain in satoshis.
 */
export function bucketDeposits(
  deposits: SavingsDeposit[],
  preset: Preset,
  now: Date = new Date(),
): { label: string; valueSats: number }[] {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yr = today.getUTCFullYear();
  const mo = today.getUTCMonth(); // 0-indexed

  const buckets: Bucket[] = [];
  const idx: Record<string, number> = {};
  let getKey: (dateStr: string) => string = (s) => s;
  let winFrom = today;
  let winTo = today;

  if (preset === "Daily") {
    // 30 daily buckets ending today
    winFrom = addDays(today, -29);
    winTo = today;
    for (let i = 0; i < 30; i++) {
      const d = addDays(winFrom, i);
      const key = isoDay(d);
      idx[key] = buckets.length;
      buckets.push({ key, label: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, valueSats: 0 });
    }
    getKey = (s) => s;

  } else if (preset === "Weekly") {
    // 12 weekly buckets ending at current week
    const curMon = mondayOf(today);
    winFrom = addDays(curMon, -77); // 11 prior weeks
    winTo = today;
    for (let i = 11; i >= 0; i--) {
      const d = addDays(curMon, -7 * i);
      const key = isoDay(d);
      idx[key] = buckets.length;
      buckets.push({ key, label: `Wk of ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, valueSats: 0 });
    }
    getKey = (s) => isoDay(mondayOf(new Date(s + "T00:00:00Z")));

  } else if (preset === "Monthly" || preset === "1Y") {
    // 12 monthly buckets ending at current month
    winFrom = new Date(Date.UTC(yr, mo - 11, 1));
    winTo = today;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(yr, mo - i, 1));
      const key = monthKey(d);
      idx[key] = buckets.length;
      buckets.push({ key, label: MONTHS[d.getUTCMonth()] ?? key, valueSats: 0 });
    }
    getKey = (s) => s.slice(0, 7);

  } else if (preset === "Q1" || preset === "Q2" || preset === "Q3") {
    // Weekly buckets within the named calendar quarter (current year)
    const qStartMo = preset === "Q1" ? 0 : preset === "Q2" ? 3 : 6; // 0=Jan, 3=Apr, 6=Jul
    winFrom = new Date(Date.UTC(yr, qStartMo, 1));
    const qEndDay = new Date(Date.UTC(yr, qStartMo + 3, 0)); // last day of quarter
    winTo = qEndDay < today ? qEndDay : today;
    // First Monday on or after the quarter start
    let w = mondayOf(winFrom);
    if (w < winFrom) w = addDays(w, 7);
    while (w <= winTo) {
      const key = isoDay(w);
      idx[key] = buckets.length;
      buckets.push({ key, label: `Wk of ${w.getUTCDate()} ${MONTHS[w.getUTCMonth()]}`, valueSats: 0 });
      w = addDays(w, 7);
    }
    getKey = (s) => isoDay(mondayOf(new Date(s + "T00:00:00Z")));

  } else if (preset === "2Y" || preset === "3Y" || preset === "4Y") {
    // Quarterly buckets: 8, 12, or 16 quarters ending at current quarter
    const numQ = preset === "2Y" ? 8 : preset === "3Y" ? 12 : 16;
    const curQ = quarterOf(today);
    for (let i = numQ - 1; i >= 0; i--) {
      let q = curQ - i;
      let y = yr;
      while (q <= 0) { q += 4; y--; }
      const key = `${y}-Q${q}`;
      idx[key] = buckets.length;
      buckets.push({ key, label: `Q${q} '${String(y).slice(2)}`, valueSats: 0 });
    }
    // Window from start of earliest quarter
    let fq = curQ - numQ + 1;
    let fy = yr;
    while (fq <= 0) { fq += 4; fy--; }
    winFrom = new Date(Date.UTC(fy, (fq - 1) * 3, 1));
    winTo = today;
    getKey = (s) => {
      const d = new Date(s + "T00:00:00Z");
      return `${d.getUTCFullYear()}-Q${quarterOf(d)}`;
    };

  } else {
    // 5Y–10Y: yearly buckets, N bars ending at current year
    const n = parseInt(preset.replace("Y", ""), 10);
    const startYr = yr - n + 1;
    for (let y = startYr; y <= yr; y++) {
      const key = `${y}`;
      idx[key] = buckets.length;
      buckets.push({ key, label: key, valueSats: 0 });
    }
    winFrom = new Date(Date.UTC(startYr, 0, 1));
    winTo = today;
    getKey = (s) => s.slice(0, 4);
  }

  const fromStr = isoDay(winFrom);
  const toStr = isoDay(winTo);

  for (const dep of deposits) {
    if (dep.date < fromStr || dep.date > toStr) continue;
    const key = getKey(dep.date);
    const i = idx[key];
    if (i !== undefined) buckets[i]!.valueSats += dep.amountSats;
  }

  return buckets.map(({ label, valueSats }) => ({ label, valueSats }));
}
