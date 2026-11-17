import { PAYMENTS_PER_YEAR } from "./constants.js";

// All money values are integers in cents (1299 = 12.99 EUR).

export function getAnnualCost(subscription) {
  const { billingCycle, priceCents } = subscription;

  // Object.hasOwn checks the cycle is one of our own keys. A plain lookup
  // could return unexpected values for names like "toString".
  if (!Object.hasOwn(PAYMENTS_PER_YEAR, billingCycle)) {
    throw new Error(`Unknown billing cycle: ${billingCycle}`);
  }

  return priceCents * PAYMENTS_PER_YEAR[billingCycle];
}

export function getMonthlyCost(subscription) {
  return Math.round(getAnnualCost(subscription) / 12);
}

// Totals only include active subscriptions.
export function getTotalAnnualCost(subscriptions) {
  return subscriptions
    .filter((subscription) => subscription.status === "active")
    .reduce((total, subscription) => total + getAnnualCost(subscription), 0);
}

export function getTotalMonthlyCost(subscriptions) {
  return Math.round(getTotalAnnualCost(subscriptions) / 12);
}