const THEME_KEY = "itinera-theme";
const DARK_CLASS = "dark-mode";
const LAST_IMPORTED_AT_KEY = "itinera-last-imported-at";
const EXPORTABLE_KEYS = [
  "itineraryActivities",
  "itineraryDestinations",
  "itineraryPackingItems",
  "itineraryExpenses",
  THEME_KEY
];

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

function getBackupFilename() {
  const today = new Date().toISOString().slice(0, 10);
  return `itinera-backup-${today}.json`;
}

function exportTripData() {
  const payload = {
    app: "itinera",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {}
  };

  EXPORTABLE_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      payload.data[key] = value;
    }
  });

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = getBackupFilename();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

function importTripDataFromFile(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed || parsed.app !== "itinera" || typeof parsed.data !== "object") {
        throw new Error("Invalid backup format");
      }

      EXPORTABLE_KEYS.forEach((key) => {
        const importedValue = parsed.data[key];
        if (typeof importedValue === "string") {
          localStorage.setItem(key, importedValue);
        }
      });

      localStorage.setItem(LAST_IMPORTED_AT_KEY, new Date().toISOString());

      alert("Backup imported successfully. The page will now reload.");
      window.location.reload();
    } catch (error) {
      alert("Could not import file. Please choose a valid Itinera backup JSON file.");
    }
  };

  reader.onerror = () => {
    alert("Could not read this file. Please try again.");
  };

  reader.readAsText(file);
}

function formatImportTimestamp(isoString) {
  const parsedDate = new Date(isoString);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function updateLastImportStatus() {
  const status = document.getElementById("lastImportStatus");
  if (!status) {
    return;
  }

  const importedAt = localStorage.getItem(LAST_IMPORTED_AT_KEY);
  if (!importedAt) {
    status.textContent = "No backup imported yet.";
    return;
  }

  const formatted = formatImportTimestamp(importedAt);
  if (!formatted) {
    status.textContent = "Last backup imported: Unknown time";
    return;
  }

  status.textContent = `Last backup imported: ${formatted}`;
}

function setupDataTransferControls() {
  const exportButton = document.getElementById("exportDataBtn");
  const importButton = document.getElementById("importDataBtn");
  const importInput = document.getElementById("importDataInput");

  if (!exportButton || !importButton || !importInput) {
    return;
  }

  exportButton.addEventListener("click", exportTripData);
  importButton.addEventListener("click", () => {
    importInput.click();
  });

  importInput.addEventListener("change", (event) => {
    const target = event.target;
    const file = target.files && target.files[0];
    importTripDataFromFile(file);
    target.value = "";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  addThemeToggle();
  applyTheme(getInitialTheme());
  setupDataTransferControls();
  updateLastImportStatus();
});