import { BILLING_CYCLES, STATUSES } from "./constants.js";
import { parseISODate } from "./dates.js";

const MAX_ID_LENGTH = 100;
const MAX_NAME_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 50;
const MAX_NOTES_LENGTH = 500;

function isNonEmptyString(value, maxLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

// Returns a list of problems. An empty list means the subscription is valid.
export function validateSubscription(subscription) {
  if (
    typeof subscription !== "object" ||
    subscription === null ||
    Array.isArray(subscription)
  ) {
    return ["Subscription must be an object."];
  }

  const errors = [];

  if (!isNonEmptyString(subscription.id, MAX_ID_LENGTH)) {
    errors.push("id must be a non-empty string.");
  }

  if (!isNonEmptyString(subscription.name, MAX_NAME_LENGTH)) {
    errors.push(`name must be 1-${MAX_NAME_LENGTH} characters.`);
  }

  // Free trials can cost 0, so zero is allowed.
  if (!Number.isSafeInteger(subscription.priceCents) || subscription.priceCents < 0) {
    errors.push("priceCents must be a whole number (cents), 0 or more.");
  }

  if (
    typeof subscription.currency !== "string" ||
    !/^[A-Z]{3}$/.test(subscription.currency)
  ) {
    errors.push('currency must be a 3-letter uppercase code, e.g. "EUR".');
  }

  if (!BILLING_CYCLES.includes(subscription.billingCycle)) {
    errors.push(`billingCycle must be one of: ${BILLING_CYCLES.join(", ")}.`);
  }

  // parseISODate throws if the date is malformed or does not exist (Feb 31).
  try {
    parseISODate(subscription.startDate);
  } catch {
    errors.push("startDate must be a real date in YYYY-MM-DD format.");
  }

  if (!isNonEmptyString(subscription.category, MAX_CATEGORY_LENGTH)) {
    errors.push(`category must be 1-${MAX_CATEGORY_LENGTH} characters.`);
  }

  if (!STATUSES.includes(subscription.status)) {
    errors.push(`status must be one of: ${STATUSES.join(", ")}.`);
  }

  if (
    typeof subscription.notes !== "string" ||
    subscription.notes.length > MAX_NOTES_LENGTH
  ) {
    errors.push(`notes must be text of at most ${MAX_NOTES_LENGTH} characters.`);
  }

  // Optional: marks demo data so it can be removed without touching real entries.
  if (
    subscription.isSample !== undefined &&
    typeof subscription.isSample !== "boolean"
  ) {
    errors.push("isSample must be true or false when present.");
  }

  return errors;
}