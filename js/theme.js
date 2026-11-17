const THEME_KEY = "subtrack:theme"; // must match the inline script in index.html
const THEMES = ["dark", "light"];
const DEFAULT_THEME = "dark";

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.includes(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME; // storage blocked: fall back silently
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

// The button shows the theme you would switch TO, not the current one.
function updateButton(button, theme) {
  const other = theme === "dark" ? "light" : "dark";
  button.textContent = theme === "dark" ? "☀" : "☾";
  button.setAttribute("aria-label", `Switch to ${other} theme`);
  button.title = `Switch to ${other} theme`;
}

export function initThemeToggle(button) {
  let theme = getSavedTheme();
  applyTheme(theme);
  updateButton(button, theme);

  button.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    updateButton(button, theme);

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // The theme still switches for this visit, it just will not be remembered.
    }
  });
}