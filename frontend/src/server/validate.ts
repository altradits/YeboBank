// Small input validators. Every API route runs its body through these and
// returns 400 on the first problem. No exceptions escape to the client.

export function isPhone(v: unknown): v is string {
  return typeof v === "string" && /^\+254\d{9}$/.test(v);
}

/** Local Kenyan format accepted at the edge, normalised to +254. */
export function normalisePhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const clean = v.replace(/[\s-]/g, "");
  if (/^\+254\d{9}$/.test(clean)) return clean;
  if (/^0\d{9}$/.test(clean)) return "+254" + clean.slice(1);
  if (/^254\d{9}$/.test(clean)) return "+" + clean;
  return null;
}

export function isSats(v: unknown): v is number {
  return typeof v === "number" && Number.isSafeInteger(v) && v > 0;
}

export function isKes(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 && v <= 10_000_000;
}

export function isHandle(v: unknown): v is string {
  return typeof v === "string" && /^@[a-zA-Z0-9_]{2,30}$/.test(v);
}

export function isId(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_:-]{1,80}$/.test(v);
}

export function isText(v: unknown, max = 500): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= max;
}

export function isPin(v: unknown): v is string {
  return typeof v === "string" && /^[0-9]{6}$/.test(v);
}
