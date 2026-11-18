// Converts between what a person types ("9,99") and how we store money (999 cents).
// Display formatting ("€9.99") lives in format.js.

// Up to 6 digits, optionally followed by . or , and 1-2 decimals.
// Accepts "9.99", "9,99", "10", "0.5". Rejects "-5", ".5", "9.999", "1,299.99".
const PRICE_PATTERN = /^(\d{1,6})(?:[.,](\d{1,2}))?$/;

// Returns whole cents, or null if the text is not a valid price.
// Cents are built from the digits, never by multiplying a float by 100:
// 19.99 * 100 is 1998.9999999999998 in JavaScript.
export function parsePriceToCents(text) {
  const match = PRICE_PATTERN.exec(text.trim());
  if (!match) {
    return null;
  }

  const [, whole, fraction = ""] = match;
  // padEnd turns "5" into "50", so 9.5 means 950 cents, not 905.
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

// 1299 -> "12.99", 50 -> "0.50". Used to fill the price input when editing.
export function centsToInputValue(cents) {
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}