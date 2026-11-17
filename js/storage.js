import { validateSubscription } from "./validation.js";

export const STORAGE_KEY = "subtrack:subscriptions";
export const BACKUP_KEY = "subtrack:subscriptions:backup";
const STORAGE_VERSION = 1;

// LocalStorage only stores text, so data is converted with JSON.stringify
// when saving and JSON.parse when loading.

// Keeps a copy of data we could not fully use, so it is never destroyed silently.
// Only the most recent backup is kept.
function backUpRawData(raw) {
  console.warn("SubTrack: stored data was damaged. A backup was kept.");
  try {
    localStorage.setItem(BACKUP_KEY, raw);
  } catch {
    // If even the backup fails (e.g. storage full), there is nothing more to do.
  }
}

// True if anything has ever been saved. Used to detect the very first launch:
// an empty saved list still counts, a missing key does not.
export function hasSavedData() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

// Returns an array of valid subscriptions. Never throws.
export function loadSubscriptions() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Some browser settings block storage entirely.
    console.warn("SubTrack: LocalStorage is not available.");
    return [];
  }

  // Nothing saved yet: normal on first launch.
  if (raw === null) {
    return [];
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    backUpRawData(raw);
    return [];
  }

  if (
    typeof data !== "object" ||
    data === null ||
    data.version !== STORAGE_VERSION ||
    !Array.isArray(data.subscriptions)
  ) {
    backUpRawData(raw);
    return [];
  }

  const valid = data.subscriptions.filter(
    (subscription) => validateSubscription(subscription).length === 0
  );

  if (valid.length !== data.subscriptions.length) {
    backUpRawData(raw);
  }

  return valid;
}

// Saves the full list. Throws an Error if the data is invalid or cannot be stored.
export function saveSubscriptions(subscriptions) {
  if (!Array.isArray(subscriptions)) {
    throw new Error("Subscriptions must be an array.");
  }

  const problems = [];
  const seenIds = new Set();

  subscriptions.forEach((subscription, index) => {
    for (const error of validateSubscription(subscription)) {
      problems.push(`Item ${index}: ${error}`);
    }
    if (seenIds.has(subscription?.id)) {
      problems.push(`Item ${index}: duplicate id "${subscription.id}".`);
    }
    seenIds.add(subscription?.id);
  });

  if (problems.length > 0) {
    throw new Error(`Cannot save invalid data:\n${problems.join("\n")}`);
  }

  const payload = { version: STORAGE_VERSION, subscriptions };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    throw new Error("Could not save to LocalStorage (it may be full or disabled).");
  }
}