import { BILLING_CYCLES, STATUSES, DEFAULT_CURRENCY } from "../constants.js";
import { FIELD_LIMITS, validateSubscriptionFields } from "../validation.js";
import {
  getAllSubscriptions,
  getSubscriptionById,
  addSubscription,
  updateSubscription,
} from "../subscriptions.js";
import { parsePriceToCents, centsToInputValue } from "../money.js";
import { formatISODate } from "../dates.js";
import { el, createLink } from "./dom.js";

// Suggestions for the category box. Categories already in use are added to these.
const SUGGESTED_CATEGORIES = [
  "Streaming",
  "Software",
  "Gaming",
  "Cloud Storage",
  "Membership",
  "Other",
];

const CYCLE_OPTION_LABELS = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannual: "Every 6 months",
  annual: "Yearly",
};

const PRICE_ERROR = "Enter a price like 9.99 or 9,99 (up to 999,999.99).";

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function createInput(type, value) {
  const input = el("input", "control");
  input.type = type;
  input.value = value;
  return input;
}

function createSelect(options, value) {
  const select = el("select", "control");
  for (const option of options) {
    const element = el("option", undefined, option.label);
    element.value = option.value;
    select.append(element);
  }
  select.value = value;
  return select;
}

// Wraps a control with its label, hint and error message, and links them for
// screen readers. Returns the wrapper plus a setError() to show or clear a message.
function createField({ name, label, control, hint }) {
  const id = `field-${name}`;
  control.id = id;
  control.name = name;

  const labelElement = el("label", "field-label", label);
  labelElement.htmlFor = id;

  const wrapper = el("div", "field");
  wrapper.append(labelElement, control);

  const describedBy = [];
  if (hint) {
    const hintElement = el("p", "field-hint", hint);
    hintElement.id = `${id}-hint`;
    describedBy.push(hintElement.id);
    wrapper.append(hintElement);
  }

  const error = el("p", "field-error");
  error.id = `${id}-error`;
  error.hidden = true;
  describedBy.push(error.id);
  wrapper.append(error);

  control.setAttribute("aria-describedby", describedBy.join(" "));

  return {
    element: wrapper,
    control,
    setError(message) {
      error.textContent = message ?? "";
      error.hidden = !message;
      if (message) {
        control.setAttribute("aria-invalid", "true");
      } else {
        control.removeAttribute("aria-invalid");
      }
    },
  };
}

function renderNotFound(container) {
  const card = el("section", "card");
  card.append(
    el("p", "empty-text", "That subscription no longer exists."),
    createLink("Back to subscriptions", "btn", "#/subscriptions")
  );
  container.replaceChildren(card);
}

// Draws the add form (no id) or the edit form (with the subscription's id).
export function renderSubscriptionForm(container, id) {
  const isEdit = id !== undefined;
  const existing = isEdit ? getSubscriptionById(id) : undefined;

  if (isEdit && !existing) {
    renderNotFound(container);
    return;
  }

  const initial = existing ?? {
    name: "",
    priceCents: undefined,
    currency: DEFAULT_CURRENCY,
    billingCycle: "monthly",
    startDate: formatISODate(new Date()),
    category: "",
    status: "active",
    notes: "",
  };

  // Suggestions plus categories already in use, without duplicates.
  const knownCategories = [
    ...new Set([
      ...SUGGESTED_CATEGORIES,
      ...getAllSubscriptions().map((subscription) => subscription.category),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  // ----- Controls -----

  const nameControl = createInput("text", initial.name);
  nameControl.maxLength = FIELD_LIMITS.name;
  nameControl.autocomplete = "off";
  nameControl.required = true;

  const priceControl = createInput(
    "text",
    initial.priceCents === undefined ? "" : centsToInputValue(initial.priceCents)
  );
  priceControl.inputMode = "decimal";
  priceControl.placeholder = "9.99";
  priceControl.autocomplete = "off";
  priceControl.required = true;

  const cycleControl = createSelect(
    BILLING_CYCLES.map((cycle) => ({
      value: cycle,
      label: CYCLE_OPTION_LABELS[cycle] ?? cycle,
    })),
    initial.billingCycle
  );

  const dateControl = createInput("date", initial.startDate);
  dateControl.required = true;

  const categoryControl = createInput("text", initial.category);
  categoryControl.maxLength = FIELD_LIMITS.category;
  categoryControl.autocomplete = "off";
  categoryControl.required = true;
  categoryControl.setAttribute("list", "category-options");

  const categoryOptions = el("datalist");
  categoryOptions.id = "category-options";
  for (const category of knownCategories) {
    const option = el("option");
    option.value = category;
    categoryOptions.append(option);
  }

  const notesControl = el("textarea", "control");
  notesControl.value = initial.notes;
  notesControl.maxLength = FIELD_LIMITS.notes;
  notesControl.rows = 3;

  // ----- Fields (the order here is the order on the page) -----

  const fields = {
    name: createField({ name: "name", label: "Name", control: nameControl }),
    priceCents: createField({
      name: "priceCents",
      label: `Price (${initial.currency})`,
      control: priceControl,
      hint: "What you pay each billing period.",
    }),
    billingCycle: createField({
      name: "billingCycle",
      label: "Billing cycle",
      control: cycleControl,
    }),
    startDate: createField({
      name: "startDate",
      label: "Start date",
      control: dateControl,
      hint:
        "Your first payment, or any past payment on your usual billing day. " +
        "Future payments are calculated from it.",
    }),
    category: createField({
      name: "category",
      label: "Category",
      control: categoryControl,
      hint: "Pick a suggestion or type your own.",
    }),
    // The status select only appears when editing; new subscriptions are active.
    ...(isEdit
      ? {
          status: createField({
            name: "status",
            label: "Status",
            control: createSelect(
              STATUSES.map((status) => ({ value: status, label: capitalize(status) })),
              initial.status
            ),
          }),
        }
      : {}),
    notes: createField({
      name: "notes",
      label: "Notes (optional)",
      control: notesControl,
    }),
  };

  // Typing in a field clears its error message.
  for (const field of Object.values(fields)) {
    field.control.addEventListener("input", () => field.setError(""));
  }

  // ----- Layout -----

  const formError = el("p", "form-error");
  formError.setAttribute("role", "alert");
  formError.hidden = true;

  const submitButton = el(
    "button",
    "btn btn-primary",
    isEdit ? "Save changes" : "Add subscription"
  );
  submitButton.type = "submit";

  const actions = el("div", "form-actions");
  actions.append(submitButton, createLink("Cancel", "btn", "#/subscriptions"));

  const priceAndCycle = el("div", "field-row");
  priceAndCycle.append(fields.priceCents.element, fields.billingCycle.element);

  const form = el("form", "form");
  form.noValidate = true; // we show our own messages instead of the browser's
  form.append(
    fields.name.element,
    priceAndCycle,
    fields.startDate.element,
    fields.category.element,
    categoryOptions,
    ...(isEdit ? [fields.status.element] : []),
    fields.notes.element,
    formError,
    actions
  );

  // ----- Saving -----

  function save() {
    formError.hidden = true;

    const priceCents = parsePriceToCents(priceControl.value); // null if invalid

    // If the typed category matches an existing one ignoring case, reuse that
    // spelling, so "streaming" does not become a second category next to "Streaming".
    const typedCategory = categoryControl.value.trim();
    const category =
      knownCategories.find(
        (known) => known.toLowerCase() === typedCategory.toLowerCase()
      ) ?? typedCategory;

    const candidate = {
      name: nameControl.value,
      priceCents,
      currency: initial.currency,
      billingCycle: cycleControl.value,
      startDate: dateControl.value,
      category,
      status: isEdit ? fields.status.control.value : "active",
      notes: notesControl.value,
    };

    const errors = validateSubscriptionFields(candidate);
    if (priceCents === null) {
      errors.priceCents = PRICE_ERROR; // clearer than the generic rule message
    }

    let firstInvalidControl = null;
    for (const [fieldName, field] of Object.entries(fields)) {
      field.setError(errors[fieldName]);
      if (errors[fieldName] && !firstInvalidControl) {
        firstInvalidControl = field.control;
      }
    }
    if (firstInvalidControl) {
      firstInvalidControl.focus();
      return;
    }

    try {
      if (existing) {
        // Editing a demo subscription makes it the person's own.
        updateSubscription(
          existing.id,
          existing.isSample ? { ...candidate, isSample: false } : candidate
        );
      } else {
        addSubscription(candidate);
      }
    } catch (error) {
      formError.textContent = `Could not save: ${error.message}`;
      formError.hidden = false;
      return;
    }

    location.hash = "#/subscriptions";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // stop the browser from reloading the page
    save();
  });

  const header = el("div", "page-header");
  header.append(
    el("h2", "page-title", isEdit ? "Edit subscription" : "Add subscription")
  );

  const card = el("section", "card form-card");
  card.append(form);
  container.replaceChildren(header, card);
}