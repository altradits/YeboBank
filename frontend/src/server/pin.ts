// PIN hashing and lockout (Altradits ywallet pattern, demo scope).
// scrypt N=16384, per-PIN random salt, constant-time compare, pattern
// rejection for weak PINs, 5-strike escalating lockout 15m / 1h / 24h.

import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 32;

export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(pin, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${SCRYPT_N}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  try {
    const [algo, nStr, saltHex, keyHex] = stored.split("$");
    if (algo !== "scrypt" || !nStr || !saltHex || !keyHex) return false;
    const key = scryptSync(pin, Buffer.from(saltHex, "hex"), KEY_LEN, {
      N: Number(nStr),
      r: SCRYPT_R,
      p: SCRYPT_P,
    });
    const expected = Buffer.from(keyHex, "hex");
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

/** Reject blank, short, repeated-digit, and sequential PINs. */
export function weakPinReason(pin: string): string | null {
  if (!/^[0-9]{6}$/.test(pin)) return "PIN must be 6 digits";
  if (/^(\d)\1+$/.test(pin)) return "PIN must not repeat one digit";
  const asc = "0123456789";
  const desc = "9876543210";
  if (asc.includes(pin) || desc.includes(pin)) return "PIN must not be sequential";
  return null;
}

/** Lockout duration after `strikes` consecutive failures (ms, 0 = none yet). */
export function lockoutMs(strikes: number): number {
  if (strikes < 5) return 0;
  if (strikes < 10) return 15 * 60_000;
  if (strikes < 15) return 60 * 60_000;
  return 24 * 60 * 60_000;
}
