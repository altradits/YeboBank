/**
 * Number to words conversion and comparison utility for banking transaction validation.
 */

const ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];

const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
];

function convertBelowThousand(n: number): string {
  let result = "";
  if (n >= 100) {
    result += ONES[Math.floor(n / 100)] + " hundred ";
    n %= 100;
  }
  if (n >= 20) {
    result += TENS[Math.floor(n / 10)] + (n % 10 > 0 ? " " + ONES[n % 10] : "");
  } else if (n > 0) {
    result += ONES[n];
  }
  return result.trim();
}

/**
 * Converts a number to English words.
 * E.g., 50 -> "Fifty", 500 -> "Five Hundred", 1000 -> "One Thousand", 2500 -> "Two Thousand Five Hundred"
 */
export function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  if (isNaN(num)) return "";

  const isNegative = num < 0;
  let n = Math.floor(Math.abs(num));

  if (n === 0) return "Zero";

  let words = "";

  if (n >= 1_000_000_000) {
    words += convertBelowThousand(Math.floor(n / 1_000_000_000)) + " billion ";
    n %= 1_000_000_000;
  }
  if (n >= 1_000_000) {
    words += convertBelowThousand(Math.floor(n / 1_000_000)) + " million ";
    n %= 1_000_000;
  }
  if (n >= 1_000) {
    words += convertBelowThousand(Math.floor(n / 1_000)) + " thousand ";
    n %= 1_000;
  }
  if (n > 0) {
    words += convertBelowThousand(n);
  }

  words = words.trim();
  if (isNegative) words = "minus " + words;

  // Capitalize each word nicely
  return words
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Normalizes a text string for comparison (lowercases, removes punctuation/dashes, trims spaces).
 */
export function normalizeWords(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if the user's typed confirmation matches the numeric amount in words.
 * Handles variations like "fifty dollars", "50", "fifty", "five hundred shillings", etc.
 */
export function validateAmountInWords(
  typed: string,
  amount: number,
  currencyName?: string
): boolean {
  if (!typed.trim() || amount <= 0) return false;

  const targetWords = normalizeWords(numberToWords(amount));
  const userTyped = normalizeWords(typed);

  // Accept exact words match
  if (userTyped === targetWords) return true;

  // Accept words + currency (e.g. "fifty dollars", "five hundred sats", "one thousand shillings")
  if (currencyName) {
    const normCur = normalizeWords(currencyName);
    if (userTyped === `${targetWords} ${normCur}`) return true;
    if (userTyped === `${normCur} ${targetWords}`) return true;
  }

  // Accept basic currency words even if not specified
  const commonCurrencies = ["dollars", "dollar", "kes", "shillings", "shilling", "sats", "satoshis", "btc", "bitcoin"];
  for (const c of commonCurrencies) {
    if (userTyped === `${targetWords} ${c}` || userTyped === `${c} ${targetWords}`) {
      return true;
    }
  }

  return false;
}
