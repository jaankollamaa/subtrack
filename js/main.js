import { validateSubscription } from "./validation.js";
import {
  loadSubscriptions,
  saveSubscriptions,
  STORAGE_KEY,
  BACKUP_KEY,
} from "./storage.js";

const valid = {
  id: "1",
  name: "Netflix",
  priceCents: 1299,
  currency: "EUR",
  billingCycle: "monthly",
  startDate: "2026-01-15",
  category: "Streaming",
  status: "active",
  notes: "",
};

function check(name, condition) {
  console.log(condition ? "PASS" : "FAIL", name);
}

function throwsError(fn) {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
}

function resetStorage() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
}

// ---- Validation ----
check("valid subscription has no errors", validateSubscription(valid).length === 0);

const brokenErrors = validateSubscription({
  ...valid,
  name: "   ",
  priceCents: 12.5,
  billingCycle: "daily",
  startDate: "2026-02-31",
  status: "gone",
});
check("5 broken fields give 5 errors", brokenErrors.length === 5);
check("null is rejected", validateSubscription(null).length > 0);

// ---- Storage ----
resetStorage();
check("empty storage loads as empty list", loadSubscriptions().length === 0);

saveSubscriptions([valid]);
check(
  "saved data loads back identical",
  JSON.stringify(loadSubscriptions()) === JSON.stringify([valid])
);

check(
  "saving invalid data throws",
  throwsError(() => saveSubscriptions([{ ...valid, priceCents: -5 }]))
);
check(
  "saving duplicate ids throws",
  throwsError(() => saveSubscriptions([valid, valid]))
);

resetStorage();
localStorage.setItem(STORAGE_KEY, "{not json");
check("damaged JSON loads as empty list", loadSubscriptions().length === 0);
check("damaged JSON is backed up", localStorage.getItem(BACKUP_KEY) === "{not json");

resetStorage();
localStorage.setItem(
  STORAGE_KEY,
  JSON.stringify({ version: 1, subscriptions: [valid, { name: "broken" }] })
);
check("only valid items are kept", loadSubscriptions().length === 1);
check("partially invalid data is backed up", localStorage.getItem(BACKUP_KEY) !== null);

resetStorage();