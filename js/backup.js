import { validateSubscription } from "./validation.js";

// Building and reading backup files. No DOM code here: the page handles files
// and messages, this file only decides what a valid backup is.

const BACKUP_APP = "subtrack";
const BACKUP_VERSION = 1;
const MAX_SUBSCRIPTIONS = 5000;
const MAX_PROBLEMS_SHOWN = 5;

// Exported so the page can reject a huge file before reading it into memory.
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

// Fields copied from an imported file. Anything else in the file is dropped.
const KNOWN_FIELDS = [
  "id",
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

export function createBackup(subscriptions, now = new Date()) {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    // A machine timestamp, so UTC (toISOString) is the right choice here.
    exportedAt: now.toISOString(),
    subscriptions,
  };
}

function pickKnownFields(subscription) {
  const picked = {};
  for (const field of KNOWN_FIELDS) {
    if (subscription[field] !== undefined) {
      picked[field] = subscription[field];
    }
  }
  return picked;
}

// Turns the text of a backup file into a list of subscriptions.
// Throws an Error with a readable message if anything is wrong. Nothing is
// saved here, and either every subscription is valid or an error is thrown.
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON, so it cannot be a SubTrack backup.");
  }

  if (
    typeof data !== "object" ||
    data === null ||
    data.app !== BACKUP_APP ||
    !Array.isArray(data.subscriptions)
  ) {
    throw new Error("This file is not a SubTrack backup.");
  }

  if (data.version !== BACKUP_VERSION) {
    throw new Error("This backup uses a file format this version of SubTrack does not support.");
  }

  if (data.subscriptions.length > MAX_SUBSCRIPTIONS) {
    throw new Error(`This backup has more than ${MAX_SUBSCRIPTIONS} subscriptions.`);
  }

  const problems = [];
  const seenIds = new Set();

  data.subscriptions.forEach((subscription, index) => {
    const errors = validateSubscription(subscription);
    for (const error of errors) {
      problems.push(`Item ${index + 1}: ${error}`);
    }

    // Only check duplicates for items with a valid id.
    if (errors.length === 0) {
      if (seenIds.has(subscription.id)) {
        problems.push(`Item ${index + 1}: duplicate ID.`);
      }
      seenIds.add(subscription.id);
    }
  });

  if (problems.length > 0) {
    const shown = problems.slice(0, MAX_PROBLEMS_SHOWN).join(" ");
    const hidden = problems.length - MAX_PROBLEMS_SHOWN;
    const more = hidden > 0 ? ` (and ${hidden} more)` : "";
    throw new Error(`The backup contains invalid data, so nothing was imported. ${shown}${more}`);
  }

  return data.subscriptions.map(pickKnownFields);
}