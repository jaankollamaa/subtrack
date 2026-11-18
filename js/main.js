import { seedSampleDataIfFirstLaunch } from "./subscriptions.js";
import { initThemeToggle } from "./theme.js";
import { renderDashboard } from "./ui/dashboard.js";
import { renderSubscriptionList } from "./ui/subscriptionList.js";

// Each route (the part of the URL after the page address) maps to the
// function that draws that page.
const ROUTES = {
  "#/": renderDashboard,
  "#/subscriptions": renderSubscriptionList,
};
const DEFAULT_ROUTE = "#/";

const app = document.querySelector("#app");
const navLinks = document.querySelectorAll(".nav-link");

function renderRoute() {
  // Unknown or empty hashes fall back to the dashboard.
  const route = Object.hasOwn(ROUTES, location.hash) ? location.hash : DEFAULT_ROUTE;
  ROUTES[route](app);

  for (const link of navLinks) {
    if (link.getAttribute("href") === route) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

initThemeToggle(document.querySelector("#theme-toggle"));

try {
  seedSampleDataIfFirstLaunch();
} catch (error) {
  // Happens if LocalStorage is blocked. A visible message comes with the UI later.
  console.warn("SubTrack: could not save sample data.", error);
}

// Changing the hash (clicking a nav link, or the browser's back button) fires this.
window.addEventListener("hashchange", renderRoute);
renderRoute();