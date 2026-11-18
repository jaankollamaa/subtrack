import { BILLING_CYCLES, STATUSES } from "./constants.js";
import { parseISODate } from "./dates.js";

// Maximum lengths. Exported so the form's inputs can use the same limits.
export const FIELD_LIMITS = Object.freeze({
  id: 100,
  name: 100,
  category: 50,
  notes: 500,
});

function isNonEmptyString(value, maxLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

// Checks the fields a user can edit. Returns one message per invalid field,
// e.g. { name: "Name must be ..." }. An empty object means everything is valid.
// Expects an object (validateSubscription below checks that first).
export function validateSubscriptionFields(subscription) {
  const errors = {};

  if (!isNonEmptyString(subscription.name, FIELD_LIMITS.name)) {
    errors.name = `Name must be 1–${FIELD_LIMITS.name} characters.`;
  }

  // Free trials can cost 0, so zero is allowed.
  if (!Number.isSafeInteger(subscription.priceCents) || subscription.priceCents < 0) {
    errors.priceCents = "Price must be a whole number of cents, 0 or more.";
  }

  if (
    typeof subscription.currency !== "string" ||
    !/^[A-Z]{3}$/.test(subscription.currency)
  ) {
    errors.currency = 'Currency must be a 3-letter uppercase code, e.g. "EUR".';
  }

  if (!BILLING_CYCLES.includes(subscription.billingCycle)) {
    errors.billingCycle = `Billing cycle must be one of: ${BILLING_CYCLES.join(", ")}.`;
  }

  // parseISODate throws if the date is malformed or does not exist (Feb 31).
  try {
    parseISODate(subscription.startDate);
  } catch {
    errors.startDate = "Start date must be a real date.";
  }

  if (!isNonEmptyString(subscription.category, FIELD_LIMITS.category)) {
    errors.category = `Category must be 1–${FIELD_LIMITS.category} characters.`;
  }

  if (!STATUSES.includes(subscription.status)) {
    errors.status = `Status must be one of: ${STATUSES.join(", ")}.`;
  }

  if (
    typeof subscription.notes !== "string" ||
    subscription.notes.length > FIELD_LIMITS.notes
  ) {
    errors.notes = `Notes must be text of at most ${FIELD_LIMITS.notes} characters.`;
  }

  return errors;
}

// Checks a complete stored subscription. Returns a list of problems.
// An empty list means the subscription is valid.
export function validateSubscription(subscription) {
  if (
    typeof subscription !== "object" ||
    subscription === null ||
    Array.isArray(subscription)
  ) {
    return ["Subscription must be an object."];
  }

  const errors = [];

  if (!isNonEmptyString(subscription.id, FIELD_LIMITS.id)) {
    errors.push("ID must be a non-empty string.");
  }

  errors.push(...Object.values(validateSubscriptionFields(subscription)));

  // Optional: marks demo data so it can be removed without touching real entries.
  if (
    subscription.isSample !== undefined &&
    typeof subscription.isSample !== "boolean"
  ) {
    errors.push("isSample must be true or false when present.");
  }

  return errors;
}