import { DEFAULT_CURRENCY, UPCOMING_WINDOW_DAYS } from "../constants.js";
import { getAllSubscriptions } from "../subscriptions.js";
import {
  getTotalMonthlyCost,
  getTotalAnnualCost,
  getUpcomingPayments,
  getSpendingByCategory,
  getTopSubscriptions,
} from "../calculations.js";
import { formatMoney, formatDate, formatDaysUntil, formatPercent } from "../format.js";
import { el } from "./dom.js";

const TOP_SUBSCRIPTION_COUNT = 5;

function createStatCard(label, value, hint) {
  const card = el("article", "card");
  card.append(el("p", "stat-label", label), el("p", "stat-value", value));
  if (hint) {
    card.append(el("p", "stat-hint", hint));
  }
  return card;
}

function createUpcomingCard(payments, today) {
  const card = el("section", "card");
  card.append(
    el("h2", "card-title", `Upcoming payments · next ${UPCOMING_WINDOW_DAYS} days`)
  );

  if (payments.length === 0) {
    card.append(el("p", "empty-text", "No payments due in this period."));
    return card;
  }

  const list = el("ul", "payment-list");
  for (const { subscription, date, daysUntil } of payments) {
    const info = el("div", "payment-info");
    info.append(
      el("span", "payment-name", subscription.name),
      el(
        "span",
        "payment-date",
        `${formatDate(date, today)} · ${formatDaysUntil(daysUntil)}`
      )
    );

    const item = el("li", "payment-item");
    item.append(
      info,
      el(
        "span",
        "payment-amount",
        formatMoney(subscription.priceCents, subscription.currency)
      )
    );
    list.append(item);
  }

  card.append(list);
  return card;
}

// One row per category: name and amount on top, a bar showing its share below.
// The bar is decoration only (aria-hidden): the same information is in the text.
function createCategoryCard(categories) {
  const card = el("section", "card");
  card.append(el("h2", "card-title", "Spending by category"));

  if (categories.length === 0) {
    card.append(el("p", "empty-text", "No active subscriptions yet."));
    return card;
  }

  const list = el("ul", "category-list");
  for (const { category, monthlyCost, share } of categories) {
    const header = el("div", "category-header");
    header.append(
      el("span", "category-name", category),
      el(
        "span",
        "category-amount",
        `${formatMoney(monthlyCost, DEFAULT_CURRENCY)} / month · ${formatPercent(share)}`
      )
    );

    const fill = el("div", "bar-fill");
    // The inline style is the one place the width needs a computed value.
    fill.style.width = `${(share * 100).toFixed(1)}%`;
    const track = el("div", "bar-track");
    track.setAttribute("aria-hidden", "true");
    track.append(fill);

    const item = el("li", "category-item");
    item.append(header, track);
    list.append(item);
  }

  card.append(list);
  return card;
}

function createTopCard(top) {
  const card = el("section", "card");
  card.append(el("h2", "card-title", "Most expensive subscriptions"));

  if (top.length === 0) {
    card.append(el("p", "empty-text", "No active subscriptions yet."));
    return card;
  }

  const list = el("ol", "payment-list");
  for (const { subscription, annualCost, monthlyCost } of top) {
    const info = el("div", "payment-info");
    info.append(
      el("span", "payment-name", subscription.name),
      el(
        "span",
        "payment-date",
        `${formatMoney(monthlyCost, subscription.currency)} / month`
      )
    );

    const item = el("li", "payment-item");
    item.append(
      info,
      el(
        "span",
        "payment-amount",
        `${formatMoney(annualCost, subscription.currency)} / year`
      )
    );
    list.append(item);
  }

  card.append(list);
  return card;
}

// Draws the whole dashboard into `container`, replacing what was there.
export function renderDashboard(container) {
  const subscriptions = getAllSubscriptions();
  const today = new Date();

  const activeCount = subscriptions.filter(
    (subscription) => subscription.status === "active"
  ).length;

  // One calculation feeds both the "next payment" card and the list.
  const allUpcoming = getUpcomingPayments(subscriptions, Infinity, today);
  const next = allUpcoming[0];
  const inWindow = allUpcoming.filter(
    (payment) => payment.daysUntil <= UPCOMING_WINDOW_DAYS
  );

  const statGrid = el("section", "stat-grid");
  statGrid.append(
    createStatCard(
      "Monthly spending",
      formatMoney(getTotalMonthlyCost(subscriptions), DEFAULT_CURRENCY)
    ),
    createStatCard(
      "Annual spending",
      formatMoney(getTotalAnnualCost(subscriptions), DEFAULT_CURRENCY)
    ),
    createStatCard(
      "Active subscriptions",
      String(activeCount),
      `${subscriptions.length} in total`
    ),
    createStatCard(
      "Next payment",
      next ? next.subscription.name : "None",
      next
        ? `${formatDate(next.date, today)} · ${formatDaysUntil(next.daysUntil)}`
        : "No active subscriptions"
    )
  );

  const lowerGrid = el("div", "dashboard-grid");
  lowerGrid.append(
    createCategoryCard(getSpendingByCategory(subscriptions)),
    createTopCard(getTopSubscriptions(subscriptions, TOP_SUBSCRIPTION_COUNT))
  );

  container.replaceChildren(
    statGrid,
    createUpcomingCard(inWindow, today),
    lowerGrid
  );
}