import { getNextPaymentDate } from "./calculations.js";
import { parseISODate, formatISODate } from "./dates.js";

const tests = [
  { name: "Monthly, regular day", billingCycle: "monthly", startDate: "2026-01-15", today: "2026-11-17", expected: "2026-12-15" },
  { name: "Monthly on the 31st, February", billingCycle: "monthly", startDate: "2026-01-31", today: "2026-02-10", expected: "2026-02-28" },
  { name: "Monthly on the 31st, back to 31", billingCycle: "monthly", startDate: "2026-01-31", today: "2026-03-01", expected: "2026-03-31" },
  { name: "Annual on Feb 29, non-leap year", billingCycle: "annual", startDate: "2024-02-29", today: "2026-11-17", expected: "2027-02-28" },
  { name: "Annual on Feb 29, leap year", billingCycle: "annual", startDate: "2024-02-29", today: "2027-03-01", expected: "2028-02-29" },
  { name: "Weekly, due today", billingCycle: "weekly", startDate: "2026-11-10", today: "2026-11-17", expected: "2026-11-17" },
  { name: "Weekly, across the year", billingCycle: "weekly", startDate: "2026-01-01", today: "2026-12-30", expected: "2026-12-31" },
  { name: "Start date in the future", billingCycle: "monthly", startDate: "2026-12-01", today: "2026-11-17", expected: "2026-12-01" },
  { name: "Quarterly on the 31st, year rollover", billingCycle: "quarterly", startDate: "2026-01-31", today: "2026-11-17", expected: "2027-01-31" },
];

for (const test of tests) {
  const subscription = {
    billingCycle: test.billingCycle,
    startDate: test.startDate,
  };
  const next = getNextPaymentDate(subscription, parseISODate(test.today));
  const actual = formatISODate(next);

  console.log(
    actual === test.expected ? "PASS" : "FAIL",
    test.name,
    "| expected:", test.expected,
    "| got:", actual
  );
}