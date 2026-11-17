import { parseISODate } from "./dates.js";
import { STORAGE_KEY, BACKUP_KEY } from "./storage.js";
import { createSampleSubscriptions } from "./sampleData.js";
import {
  getAllSubscriptions,
  getSubscriptionById,
  addSubscription,
  updateSubscription,
  setSubscriptionStatus,
  deleteSubscription,
  seedSampleDataIfFirstLaunch,
  clearSampleData,
} from "./subscriptions.js";

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

const count = () => getAllSubscriptions().length;
const today = parseISODate("2026-11-17");
const sampleCount = createSampleSubscriptions(today).length;

const input = {
  name: "  Disney+  ",
  priceCents: 999,
  billingCycle: "monthly",
  startDate: "2026-11-01",
  category: "Streaming",
};

// ---- Sample data ----
resetStorage();
check("seeds on first launch", seedSampleDataIfFirstLaunch(today) === true);
check("all sample items are valid and saved", count() === sampleCount);
check(
  "does not seed twice",
  seedSampleDataIfFirstLaunch(today) === false && count() === sampleCount
);

// ---- Add ----
const added = addSubscription(input);
check("add returns an id", typeof added.id === "string" && added.id.length > 0);
check(
  "add trims the name and applies defaults",
  added.name === "Disney+" &&
    added.currency === "EUR" &&
    added.status === "active" &&
    added.notes === ""
);
check(
  "added item is stored",
  getSubscriptionById(added.id)?.name === "Disney+" && count() === sampleCount + 1
);
check(
  "add rejects invalid data and saves nothing",
  throwsError(() => addSubscription({ ...input, priceCents: "9.99" })) &&
    count() === sampleCount + 1
);

const sneaky = addSubscription({ ...input, name: "Sneaky", isSample: true, hacker: 1 });
check(
  "add ignores unknown fields",
  sneaky.isSample === undefined && !("hacker" in sneaky)
);

// ---- Update ----
const updated = updateSubscription(added.id, { priceCents: 1099, id: "hacked" });
check(
  "update changes fields but keeps the id",
  updated.priceCents === 1099 && updated.id === added.id && updated.name === "Disney+"
);
check("update is saved", getSubscriptionById(added.id).priceCents === 1099);
check(
  "invalid update throws and changes nothing",
  throwsError(() => updateSubscription(added.id, { priceCents: -1 })) &&
    getSubscriptionById(added.id).priceCents === 1099
);
check(
  "update of an unknown id throws",
  throwsError(() => updateSubscription("nope", { name: "x" }))
);
check(
  "status change is saved",
  setSubscriptionStatus(added.id, "paused").status === "paused" &&
    getSubscriptionById(added.id).status === "paused"
);

// ---- Delete ----
check(
  "delete removes the item",
  deleteSubscription(added.id) === true && getSubscriptionById(added.id) === undefined
);
check("deleting again returns false", deleteSubscription(added.id) === false);

// ---- Clearing sample data ----
// "Sneaky" is now the only non-sample item left.
check(
  "clearSampleData removes only sample items",
  clearSampleData() === sampleCount &&
    count() === 1 &&
    getAllSubscriptions()[0].id === sneaky.id
);

deleteSubscription(sneaky.id);
check(
  "samples do not come back after everything was deleted",
  count() === 0 && seedSampleDataIfFirstLaunch(today) === false && count() === 0
);

resetStorage();