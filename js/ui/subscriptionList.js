import { STATUSES } from "../constants.js";
import {
  getAllSubscriptions,
  setSubscriptionStatus,
  deleteSubscription,
  clearSampleData,
} from "../subscriptions.js";
import { getAnnualCost, getMonthlyCost, getNextPaymentDate } from "../calculations.js";
import { daysBetween } from "../dates.js";
import { formatMoney, formatDate, formatCycle, formatDaysUntil } from "../format.js";
import { el, createButton } from "./dom.js";

// Filter state lives at module level: it survives navigating to another page
// and back, and resets when the browser tab is reloaded.
const filters = { search: "", status: "all", category: "all", sort: "name" };

const SORT_OPTIONS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "cost", label: "Cost (high to low)" },
  { value: "next", label: "Next payment (soonest)" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...STATUSES.map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  })),
];

// ---------- Sorting ----------

const byName = (a, b) => a.subscription.name.localeCompare(b.subscription.name);

const comparers = {
  name: byName,
  // Compares annual cost so rounding cannot create false ties.
  cost: (a, b) => b.annualCost - a.annualCost || byName(a, b),
  // Active subscriptions by date; paused/cancelled ones (no next date) last.
  next: (a, b) => {
    if (a.nextDate && b.nextDate) return a.nextDate - b.nextDate || byName(a, b);
    if (a.nextDate) return -1;
    if (b.nextDate) return 1;
    return byName(a, b);
  },
};

// ---------- Data preparation ----------

// Attaches calculated values to each subscription so the UI does no math.
function buildRows(subscriptions, today) {
  return subscriptions.map((subscription) => ({
    subscription,
    annualCost: getAnnualCost(subscription),
    nextDate:
      subscription.status === "active" ? getNextPaymentDate(subscription, today) : null,
  }));
}

function matchesFilters({ subscription }) {
  const search = filters.search.trim().toLowerCase();
  if (
    search &&
    !subscription.name.toLowerCase().includes(search) &&
    !subscription.category.toLowerCase().includes(search)
  ) {
    return false;
  }
  if (filters.status !== "all" && subscription.status !== filters.status) {
    return false;
  }
  if (filters.category !== "all" && subscription.category !== filters.category) {
    return false;
  }
  return true;
}

// ---------- Small UI pieces ----------

function setSelectOptions(select, options, value) {
  select.replaceChildren(
    ...options.map((option) => {
      const element = el("option", undefined, option.label);
      element.value = option.value;
      return element;
    })
  );
  select.value = value;
}

function createSelect(ariaLabel, options, value, onChange) {
  const select = el("select", "control");
  select.setAttribute("aria-label", ariaLabel);
  setSelectOptions(select, options, value);
  select.addEventListener("change", () => onChange(select.value));
  return select;
}

// Runs a data change, shows a message if it fails, then redraws either way.
function runAction(action, onChange) {
  try {
    action();
  } catch (error) {
    alert(`Something went wrong: ${error.message}`);
  }
  onChange();
}

function createRow({ subscription, nextDate }, today, onChange) {
  const { id, name, status, category, priceCents, currency, billingCycle } = subscription;

  const title = el("div", "sub-title");
  title.append(el("span", "sub-name", name), el("span", `badge badge-${status}`, status));

  const metaParts = [
    category,
    `${formatMoney(priceCents, currency)} / ${formatCycle(billingCycle)}`,
  ];
  if (billingCycle !== "monthly") {
    metaParts.push(`≈ ${formatMoney(getMonthlyCost(subscription), currency)} / month`);
  }

  const info = el("div", "sub-info");
  info.append(title, el("p", "sub-meta", metaParts.join(" · ")));
  if (nextDate) {
    info.append(
      el(
        "p",
        "sub-next",
        `Next payment: ${formatDate(nextDate, today)} · ${formatDaysUntil(
          daysBetween(today, nextDate)
        )}`
      )
    );
  }

  const changeStatus = (newStatus) => () =>
    runAction(() => setSubscriptionStatus(id, newStatus), onChange);

  const actions = el("div", "sub-actions");
  if (status === "active") {
    actions.append(createButton("Pause", "btn", changeStatus("paused")));
  }
  if (status === "paused") {
    actions.append(createButton("Resume", "btn", changeStatus("active")));
  }
  if (status === "cancelled") {
    actions.append(createButton("Reactivate", "btn", changeStatus("active")));
  } else {
    actions.append(createButton("Cancel", "btn", changeStatus("cancelled")));
  }
  actions.append(
    createButton("Delete", "btn btn-danger", () => {
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) {
        return;
      }
      runAction(() => deleteSubscription(id), onChange);
    })
  );

  const item = el("li", "sub-item");
  item.append(info, actions);
  return item;
}

function createSampleNotice(count, onChange) {
  const notice = el("div", "notice");
  notice.append(
    el("p", "notice-text", `You are viewing sample data (${count} demo subscriptions).`),
    createButton("Clear sample data", "btn", () => {
      if (!confirm("Remove all sample subscriptions? Ones you added yourself are kept.")) {
        return;
      }
      runAction(clearSampleData, onChange);
    })
  );
  return notice;
}

// ---------- The page ----------

export function renderSubscriptionList(container) {
  // The controls are created once. Re-creating them on every keystroke would
  // make the search box lose focus, so only the parts below them are redrawn.
  const search = el("input", "control control-search");
  search.type = "search";
  search.placeholder = "Search by name or category";
  search.setAttribute("aria-label", "Search subscriptions");
  search.value = filters.search;
  search.addEventListener("input", () => {
    filters.search = search.value;
    update();
  });

  const statusSelect = createSelect("Filter by status", STATUS_OPTIONS, filters.status, (value) => {
    filters.status = value;
    update();
  });

  const categorySelect = createSelect("Filter by category", [], filters.category, (value) => {
    filters.category = value;
    update();
  });

  const sortSelect = createSelect("Sort subscriptions", SORT_OPTIONS, filters.sort, (value) => {
    filters.sort = value;
    update();
  });

  const toolbar = el("div", "toolbar");
  toolbar.append(search, statusSelect, categorySelect, sortSelect);

  const noticeSlot = el("div");
  const summary = el("p", "result-summary");
  const listCard = el("section", "card");

  // Re-reads the data and redraws everything that can change.
  function update() {
    const today = new Date();
    const subscriptions = getAllSubscriptions();

    const sampleCount = subscriptions.filter((subscription) => subscription.isSample).length;
    noticeSlot.replaceChildren(
      ...(sampleCount > 0 ? [createSampleNotice(sampleCount, update)] : [])
    );

    // Categories come from the data. Reset the filter if its category is gone.
    const categories = [...new Set(subscriptions.map((subscription) => subscription.category))].sort(
      (a, b) => a.localeCompare(b)
    );
    if (filters.category !== "all" && !categories.includes(filters.category)) {
      filters.category = "all";
    }
    setSelectOptions(
      categorySelect,
      [
        { value: "all", label: "All categories" },
        ...categories.map((category) => ({ value: category, label: category })),
      ],
      filters.category
    );

    const visible = buildRows(subscriptions, today)
      .filter(matchesFilters)
      .sort(comparers[filters.sort]);

    summary.textContent =
      subscriptions.length === 0 ? "" : `Showing ${visible.length} of ${subscriptions.length}`;

    if (visible.length === 0) {
      listCard.replaceChildren(
        el(
          "p",
          "empty-text",
          subscriptions.length === 0
            ? "No subscriptions yet."
            : "No subscriptions match your filters."
        )
      );
      return;
    }

    const list = el("ul", "sub-list");
    for (const row of visible) {
      list.append(createRow(row, today, update));
    }
    listCard.replaceChildren(list);
  }

  update();
  container.replaceChildren(noticeSlot, toolbar, summary, listCard);
}