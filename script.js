const THEME_KEY = "itinera-theme";
const DARK_CLASS = "dark-mode";

function applyTheme(mode) {
  const isDark = mode === "dark";
  document.body.classList.toggle(DARK_CLASS, isDark);

  const toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
}

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }
  return "light";
}

function addThemeToggle() {
  if (document.body.querySelector(".theme-toggle")) {
    return;
  }

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "theme-toggle";
  document.body.appendChild(toggle);

  toggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains(DARK_CLASS);
    const nextMode = isDark ? "light" : "dark";
    localStorage.setItem(THEME_KEY, nextMode);
    applyTheme(nextMode);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  addThemeToggle();
  applyTheme(getInitialTheme());
});