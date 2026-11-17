import { DEFAULT_CURRENCY } from "./constants.js";
import { addDays, formatISODate, startOfDay } from "./dates.js";

// Demo subscriptions for first launch. Start dates are given as "days ago",
// so the upcoming payments always look realistic whenever the app is opened.
const SAMPLES = [
  { name: "Netflix", priceCents: 1299, billingCycle: "monthly", category: "Streaming", daysAgo: 20 },
  { name: "Spotify", priceCents: 1099, billingCycle: "monthly", category: "Streaming", daysAgo: 9 },
  { name: "Xbox Game Pass", priceCents: 1499, billingCycle: "monthly", category: "Gaming", daysAgo: 25 },
  { name: "Adobe Creative Cloud", priceCents: 6049, billingCycle: "monthly", category: "Software", daysAgo: 14 },
  { name: "iCloud+", priceCents: 299, billingCycle: "monthly", category: "Cloud Storage", daysAgo: 5 },
  { name: "Amazon Prime", priceCents: 4999, billingCycle: "annual", category: "Membership", daysAgo: 200 },
  { name: "Language app", priceCents: 8999, billingCycle: "annual", category: "Software", daysAgo: 120 },
  { name: "Audible", priceCents: 999, billingCycle: "monthly", category: "Other", daysAgo: 30, status: "paused" },
  { name: "Magazine", priceCents: 1999, billingCycle: "quarterly", category: "Other", daysAgo: 45, status: "cancelled" },
];

export function createSampleSubscriptions(today = new Date()) {
  const todayStart = startOfDay(today);

  return SAMPLES.map(({ daysAgo, ...fields }, index) => ({
    id: `sample-${index + 1}`,
    currency: DEFAULT_CURRENCY,
    status: "active", // replaced by fields.status when the sample sets one
    ...fields,
    startDate: formatISODate(addDays(todayStart, -daysAgo)),
    notes: "",
    isSample: true,
  }));
}