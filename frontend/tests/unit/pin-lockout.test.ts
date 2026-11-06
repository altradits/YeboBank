import { describe, it, expect } from "vitest";
import { hashPin, verifyPin, weakPinReason, lockoutMs } from "@/server/pin";

describe("PIN hashing and lockout", () => {
  it("hashes and verifies", () => {
    const h = hashPin("284649");
    expect(h.startsWith("scrypt$16384$")).toBe(true);
    expect(verifyPin("284649", h)).toBe(true);
    expect(verifyPin("284650", h)).toBe(false);
    expect(verifyPin("284649", "garbage")).toBe(false);
  });

  it("rejects weak PINs", () => {
    expect(weakPinReason("000000")).toBeTruthy();
    expect(weakPinReason("123456")).toBeTruthy();
    expect(weakPinReason("987654")).toBeTruthy();
    expect(weakPinReason("12345")).toBeTruthy();
    expect(weakPinReason("abcdef")).toBeTruthy();
    expect(weakPinReason("284649")).toBeNull();
  });

  it("escalates lockout at 5/10/15 strikes", () => {
    expect(lockoutMs(0)).toBe(0);
    expect(lockoutMs(4)).toBe(0);
    expect(lockoutMs(5)).toBe(15 * 60_000);
    expect(lockoutMs(9)).toBe(15 * 60_000);
    expect(lockoutMs(10)).toBe(60 * 60_000);
    expect(lockoutMs(14)).toBe(60 * 60_000);
    expect(lockoutMs(15)).toBe(24 * 60 * 60_000);
    expect(lockoutMs(99)).toBe(24 * 60 * 60_000);
  });
});
