import { DEFAULT_CURRENCY } from "./constants.js";
import { loadSubscriptions, saveSubscriptions, hasSavedData } from "./storage.js";
import { createSampleSubscriptions } from "./sampleData.js";

// The only fields a caller may set. Anything else (including id) is ignored.
// isSample is listed so that editing a demo subscription can set it to false:
// the person has made it their own, and "clear sample data" must keep it.
const EDITABLE_FIELDS = [
  "name",
  "priceCents",
  "currency",
  "billingCycle",
  "startDate",
  "category",
  "status",
  "notes",
  "isSample",
];

function generateId() {
  // crypto.randomUUID only exists in "secure contexts" (https or localhost).
  // Opening the site from a phone over a local network address would lack it.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Copies only the allowed fields that were actually provided.
function pickEditableFields(input) {
  if (typeof input !== "object" || input === null) {
    throw new Error("Expected an object with subscription fields.");
  }

  const picked = {};
  for (const field of EDITABLE_FIELDS) {
    if (input[field] !== undefined) {
      picked[field] = input[field];
    }
  }
  return picked;
}

// Light cleanup of text fields. Non-text values are left alone so that
// validation reports them instead of hiding the problem.
function normalizeFields(fields) {
  const normalized = { ...fields };

  for (const field of ["name", "category", "notes"]) {
    if (typeof normalized[field] === "string") {
      normalized[field] = normalized[field].trim();
    }
  }
  if (typeof normalized.currency === "string") {
    normalized.currency = normalized.currency.trim().toUpperCase();
  }

  return normalized;
}

// ---------- Read ----------

export function getAllSubscriptions() {
  return loadSubscriptions();
}

// Returns the subscription, or undefined if there is none with this id.
export function getSubscriptionById(id) {
  return loadSubscriptions().find((subscription) => subscription.id === id);
}

// ---------- Create / update / delete ----------

// Throws if the data is invalid (nothing is saved in that case).
export function addSubscription(input) {
  const subscription = {
    id: generateId(),
    currency: DEFAULT_CURRENCY,
    status: "active",
    notes: "",
    ...normalizeFields(pickEditableFields(input)),
  };

  saveSubscriptions([...loadSubscriptions(), subscription]);
  return subscription;
}

// Only the fields present in `changes` are modified. The id never changes.
// Throws if the subscription does not exist or the result would be invalid.
export function updateSubscription(id, changes) {
  const subscriptions = loadSubscriptions();
  const existing = subscriptions.find((subscription) => subscription.id === id);

  if (!existing) {
    throw new Error(`No subscription with id "${id}".`);
  }

  const updated = {
    ...existing,
    ...normalizeFields(pickEditableFields(changes)),
  };

  saveSubscriptions(
    subscriptions.map((subscription) => (subscription.id === id ? updated : subscription))
  );
  return updated;
}

// Convenience for pause / reactivate / cancel buttons.
export function setSubscriptionStatus(id, status) {
  return updateSubscription(id, { status });
}

// Returns true if something was deleted, false if the id was not found.
export function deleteSubscription(id) {
  const subscriptions = loadSubscriptions();
  const remaining = subscriptions.filter((subscription) => subscription.id !== id);

  if (remaining.length === subscriptions.length) {
    return false;
  }

  saveSubscriptions(remaining);
  return true;
}

// ---------- Sample data ----------

// Adds demo data only if nothing was ever saved. Returns true if it seeded.
export function seedSampleDataIfFirstLaunch(today = new Date()) {
  if (hasSavedData()) {
    return false;
  }

  saveSubscriptions(createSampleSubscriptions(today));
  return true;
}

// Removes only the demo subscriptions. Returns how many were removed.
export function clearSampleData() {
  const subscriptions = loadSubscriptions();
  const remaining = subscriptions.filter((subscription) => !subscription.isSample);

  if (remaining.length !== subscriptions.length) {
    saveSubscriptions(remaining);
  }
  return subscriptions.length - remaining.length;
}