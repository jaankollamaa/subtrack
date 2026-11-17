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

// Controls how numbers and dates are written on screen.
// "en-IE" = English text with euro-style formatting (€12.99).
// Use "et-EE" for Estonian conventions (12,99 €).
export const LOCALE = "en-IE";

// How far ahead the dashboard's upcoming-payments list looks.
export const UPCOMING_WINDOW_DAYS = 30;