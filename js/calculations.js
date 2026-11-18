import { PAYMENTS_PER_YEAR } from "./constants.js";
import { parseISODate, startOfDay, addDays, addMonths, daysBetween } from "./dates.js";

// All money values are integers in cents (1299 = 12.99 EUR).

function assertKnownBillingCycle(billingCycle) {
  // Object.hasOwn checks the cycle is one of our own keys. A plain lookup
  // could return unexpected values for names like "toString".
  if (!Object.hasOwn(PAYMENTS_PER_YEAR, billingCycle)) {
    throw new Error(`Unknown billing cycle: ${billingCycle}`);
  }
}

// ---------- Costs ----------

export function getAnnualCost(subscription) {
  const { billingCycle, priceCents } = subscription;
  assertKnownBillingCycle(billingCycle);

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

// ---------- Payment dates ----------

// Date of payment number n (0 = the start date itself).
// Always calculated from the original start date, so a subscription that
// started on the 31st returns to the 31st in months that have one.
function getPaymentDate(billingCycle, startDate, n) {
  assertKnownBillingCycle(billingCycle);

  if (billingCycle === "weekly") {
    return addDays(startDate, 7 * n);
  }

  const monthsPerCycle = 12 / PAYMENTS_PER_YEAR[billingCycle];
  return addMonths(startDate, monthsPerCycle * n);
}

// First payment date that is today or later. Returns a Date object.
export function getNextPaymentDate(subscription, today = new Date()) {
  const { billingCycle, startDate } = subscription;
  const start = parseISODate(startDate);
  const todayStart = startOfDay(today);

  let n = 0;
  let paymentDate = getPaymentDate(billingCycle, start, n);

  // Dates can be compared with < and >=, which compare their timestamps.
  while (paymentDate < todayStart) {
    n++;
    paymentDate = getPaymentDate(billingCycle, start, n);
  }

  return paymentDate;
}

// Active subscriptions whose next payment is at most `withinDays` away
// (pass Infinity for no limit), soonest first. Each entry looks like
// { subscription, date, daysUntil }.
export function getUpcomingPayments(subscriptions, withinDays, today = new Date()) {
  return subscriptions
    .filter((subscription) => subscription.status === "active")
    .map((subscription) => {
      const date = getNextPaymentDate(subscription, today);
      return { subscription, date, daysUntil: daysBetween(today, date) };
    })
    .filter((payment) => payment.daysUntil <= withinDays)
    .sort(
      (a, b) =>
        a.date - b.date || a.subscription.name.localeCompare(b.subscription.name)
    );
}

// ---------- Statistics ----------

// Spending per category for active subscriptions, largest first.
// Each entry: { category, annualCost, monthlyCost, share } where share is
// 0 to 1. Annual costs are summed first (exact whole cents) and monthly is
// derived once, the same rule as the totals, so rounding never accumulates.
export function getSpendingByCategory(subscriptions) {
  const annualByCategory = new Map();
  let totalAnnual = 0;

  for (const subscription of subscriptions) {
    if (subscription.status !== "active") {
      continue;
    }
    const annual = getAnnualCost(subscription);
    annualByCategory.set(
      subscription.category,
      (annualByCategory.get(subscription.category) ?? 0) + annual
    );
    totalAnnual += annual;
  }

  return [...annualByCategory]
    .map(([category, annualCost]) => ({
      category,
      annualCost,
      monthlyCost: Math.round(annualCost / 12),
      // A total of 0 (only free subscriptions) would divide by zero.
      share: totalAnnual === 0 ? 0 : annualCost / totalAnnual,
    }))
    .sort((a, b) => b.annualCost - a.annualCost || a.category.localeCompare(b.category));
}

// The `limit` most expensive active subscriptions by annual cost, with their
// annual and monthly cost. Each entry: { subscription, annualCost, monthlyCost }.
export function getTopSubscriptions(subscriptions, limit) {
  return subscriptions
    .filter((subscription) => subscription.status === "active")
    .map((subscription) => ({
      subscription,
      annualCost: getAnnualCost(subscription),
      monthlyCost: getMonthlyCost(subscription),
    }))
    .sort(
      (a, b) =>
        b.annualCost - a.annualCost ||
        a.subscription.name.localeCompare(b.subscription.name)
    )
    .slice(0, limit);
}