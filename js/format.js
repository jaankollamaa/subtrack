import { LOCALE } from "./constants.js";

// Turns raw values into display text. Calculation code never calls these,
// and the UI never does math: each side stays in its own lane.

// Money is stored as whole cents and displayed as currency, e.g. 1299 -> "€12.99".
// Note: this assumes 100 cents per unit, which is true for EUR and most
// currencies. A few (like JPY) have no minor unit and would need extra handling.
export function formatMoney(cents, currency) {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency }).format(
    cents / 100
  );
}

// "Nov 23", or "May 1, 2027" when the date is in a different year than today.
export function formatDate(date, today = new Date()) {
  const options = { day: "numeric", month: "short" };
  if (date.getFullYear() !== today.getFullYear()) {
    options.year = "numeric";
  }
  return new Intl.DateTimeFormat(LOCALE, options).format(date);
}

export function formatDaysUntil(days) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

// Wording for "€12.99 / month". If a new billing cycle is added to
// constants.js and not here, it still displays (using its raw name).
const CYCLE_LABELS = Object.freeze({
  weekly: "week",
  monthly: "month",
  quarterly: "quarter",
  semiannual: "6 months",
  annual: "year",
});

export function formatCycle(billingCycle) {
  return Object.hasOwn(CYCLE_LABELS, billingCycle)
    ? CYCLE_LABELS[billingCycle]
    : billingCycle;
}