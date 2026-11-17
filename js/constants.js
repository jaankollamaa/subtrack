// Central place for values that several files need to agree on.
// If we ever add a new billing cycle, we change it here and nowhere else.

export const BILLING_CYCLES = Object.freeze([
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
]);

export const STATUSES = Object.freeze(["active", "paused", "cancelled"]);

export const DEFAULT_CURRENCY = "EUR";