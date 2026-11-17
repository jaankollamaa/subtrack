// Central place for values that several files need to agree on.

// How many payments of each billing cycle fit into one year.
// This is the single source of truth: the list of valid cycles is derived from it.
export const PAYMENTS_PER_YEAR = Object.freeze({
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
});

export const BILLING_CYCLES = Object.freeze(Object.keys(PAYMENTS_PER_YEAR));

export const STATUSES = Object.freeze(["active", "paused", "cancelled"]);

export const DEFAULT_CURRENCY = "EUR";