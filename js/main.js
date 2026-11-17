import { seedSampleDataIfFirstLaunch } from "./subscriptions.js";
import { initThemeToggle } from "./theme.js";
import { renderDashboard } from "./ui/dashboard.js";

initThemeToggle(document.querySelector("#theme-toggle"));

try {
  seedSampleDataIfFirstLaunch();
} catch (error) {
  // Happens if LocalStorage is blocked. A visible message comes with the UI later.
  console.warn("SubTrack: could not save sample data.", error);
}

renderDashboard(document.querySelector("#app"));