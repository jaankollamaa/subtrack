import { seedSampleDataIfFirstLaunch } from "./subscriptions.js";
import { initThemeToggle } from "./theme.js";
import { renderDashboard } from "./ui/dashboard.js";
import { renderSubscriptionList } from "./ui/subscriptionList.js";
import { renderSubscriptionForm } from "./ui/subscriptionForm.js";

// Each route pairs a pattern (matched against the URL hash) with the function
// that draws the page. Anything in parentheses in a pattern is captured and
// passed to that function as an extra argument (the edit page gets the id).
// `nav` is the menu link to highlight while that page is showing.
const ROUTES = [
  { pattern: /^#\/$/, nav: "#/", render: renderDashboard },
  { pattern: /^#\/subscriptions$/, nav: "#/subscriptions", render: renderSubscriptionList },
  { pattern: /^#\/subscriptions\/new$/, nav: "#/subscriptions", render: renderSubscriptionForm },
  {
    pattern: /^#\/subscriptions\/([^/]+)\/edit$/,
    nav: "#/subscriptions",
    render: renderSubscriptionForm,
  },
];

const app = document.querySelector("#app");
const navLinks = document.querySelectorAll(".nav-link");

// Ids are encoded in the URL; this turns them back. A malformed value is left
// as it is (it will simply not match any subscription).
function decodeParam(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Unknown or empty hashes fall back to the dashboard.
function findRoute(hash) {
  for (const route of ROUTES) {
    const match = route.pattern.exec(hash);
    if (match) {
      return { route, params: match.slice(1).map(decodeParam) };
    }
  }
  return { route: ROUTES[0], params: [] };
}

function renderRoute() {
  const { route, params } = findRoute(location.hash);
  route.render(app, ...params);

  for (const link of navLinks) {
    if (link.getAttribute("href") === route.nav) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }

  // A new page starts at the top, instead of keeping the previous scroll position.
  window.scrollTo(0, 0);
}

initThemeToggle(document.querySelector("#theme-toggle"));

try {
  seedSampleDataIfFirstLaunch();
} catch (error) {
  // Happens if LocalStorage is blocked. A visible message comes with the UI later.
  console.warn("SubTrack: could not save sample data.", error);
}

// Changing the hash (clicking a link, or the browser's back button) fires this.
window.addEventListener("hashchange", renderRoute);
renderRoute();