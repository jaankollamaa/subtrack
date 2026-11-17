// Small date helpers. All dates are handled in the user's local time zone.
// Dates are stored as "YYYY-MM-DD" strings and converted to Date objects for math.

export function parseISODate(isoString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoString);
  if (!match) {
    throw new Error(`Invalid date: ${isoString}`);
  }

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day); // months are 0-based in JavaScript

  // Date silently rolls impossible days over (Feb 31 becomes Mar 3),
  // so we check that the result still matches what was typed.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date: ${isoString}`);
  }

  return date;
}

export function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Same date at 00:00, so comparisons ignore the time of day.
export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// Adds whole months, clamping to the last day of the target month
// (Jan 31 + 1 month = Feb 28, or Feb 29 in a leap year).
export function addMonths(date, months) {
  // Day 0 of the following month is the last day of the target month.
  const lastDayOfTargetMonth = new Date(
    date.getFullYear(),
    date.getMonth() + months + 1,
    0
  ).getDate();
  const day = Math.min(date.getDate(), lastDayOfTargetMonth);

  return new Date(date.getFullYear(), date.getMonth() + months, day);
}