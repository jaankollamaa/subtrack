import {
  getAnnualCost,
  getMonthlyCost,
  getTotalAnnualCost,
  getTotalMonthlyCost,
} from "./calculations.js";

const testSubscriptions = [
  { name: "Netflix", priceCents: 1299, billingCycle: "monthly", status: "active" },
  { name: "Gym", priceCents: 500, billingCycle: "weekly", status: "active" },
  { name: "Cloud storage", priceCents: 12000, billingCycle: "annual", status: "active" },
  { name: "Old magazine", priceCents: 999, billingCycle: "monthly", status: "paused" },
];

for (const subscription of testSubscriptions) {
  console.log(
    subscription.name,
    "| annual:", getAnnualCost(subscription),
    "| monthly:", getMonthlyCost(subscription)
  );
}

console.log("Total annual:", getTotalAnnualCost(testSubscriptions));
console.log("Total monthly:", getTotalMonthlyCost(testSubscriptions));