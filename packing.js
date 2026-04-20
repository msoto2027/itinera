// packing.js

const PACKING_KEY = "itineraryPackingItems";
const DESTINATIONS_KEY = "itineraryDestinations";
let packingItems = JSON.parse(localStorage.getItem(PACKING_KEY)) || [];
let currentSuggestions = [];

document.addEventListener("DOMContentLoaded", () => {
  loadItems();
  setupSuggestionControls();
  renderSuggestions();
});

function addItem() {
  const itemInput = document.getElementById("itemInput");

  if (itemInput.value.trim() === "") {
    alert("Please enter an item to add.");
    return;
  }

  const item = {
    id: Date.now(),
    name: itemInput.value.trim(),
    checked: false
  };

  packingItems.push(item);
  saveItems();
  addItemToList(item);
  renderSuggestions();

  itemInput.value = "";
}

function addItemToList(item) {
  const packingList = document.getElementById("packingList");
  const li = document.createElement("li");
  li.dataset.packingItemId = String(item.id);
  if (item.checked) {
    li.classList.add("packing-checked");
  }
  li.innerHTML = `
    <label class="packing-check-label">
      <input type="checkbox" class="packing-checkbox" ${item.checked ? "checked" : ""} onchange="toggleItem(${item.id})">
      <span class="packing-item-name">${item.name}</span>
    </label>
    <button type="button" onclick="deleteItem(${item.id})">Delete</button>
  `;
  packingList.appendChild(li);
}

function toggleItem(id) {
  const item = packingItems.find((i) => i.id === id);
  if (!item) {
    return;
  }
  item.checked = !item.checked;
  saveItems();
  const li = document.querySelector(`[data-packing-item-id="${id}"]`);
  if (li) {
    li.classList.toggle("packing-checked", item.checked);
  }
}

function deleteItem(id) {
  packingItems = packingItems.filter((item) => item.id !== id);
  saveItems();

  const listItem = document.querySelector(`[data-packing-item-id="${id}"]`);
  if (listItem) {
    listItem.remove();
  }

  renderSuggestions();
}

function loadItems() {
  packingItems.forEach(addItemToList);
}

function saveItems() {
  localStorage.setItem(PACKING_KEY, JSON.stringify(packingItems));
}

function setupSuggestionControls() {
  const addAllButton = document.getElementById("addAllSuggestionsBtn");
  if (!addAllButton) {
    return;
  }

  addAllButton.addEventListener("click", () => {
    addAllSuggestions();
  });
}

function getDestinations() {
  try {
    const stored = JSON.parse(localStorage.getItem(DESTINATIONS_KEY)) || [];
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}

function getPrimaryDestination(destinations) {
  if (destinations.length === 0) {
    return null;
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const upcoming = destinations
    .filter((destination) => destination.startDate)
    .map((destination) => ({
      destination,
      timestamp: new Date(`${destination.startDate}T00:00:00`).getTime()
    }))
    .filter((entry) => !Number.isNaN(entry.timestamp) && entry.timestamp >= todayStart)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (upcoming.length > 0) {
    return upcoming[0].destination;
  }

  return destinations[destinations.length - 1];
}

function getDestinationTags(destination) {
  const name = (destination.name || "").toLowerCase();
  const tags = ["essentials"];

  const warmKeywords = ["beach", "island", "hawaii", "miami", "cancun", "bali", "caribbean", "tropical", "florida", "mexico"];
  const coldKeywords = ["alaska", "iceland", "norway", "sweden", "finland", "canada", "mountain", "ski", "snow", "denver"];
  const rainKeywords = ["london", "seattle", "portland", "vancouver", "rain", "rainforest", "singapore"];
  const cityKeywords = ["city", "new york", "paris", "tokyo", "chicago", "berlin", "rome", "madrid"];
  const adventureKeywords = ["hike", "trail", "national park", "camp", "mountain", "trek"];

  if (warmKeywords.some((keyword) => name.includes(keyword))) {
    tags.push("warm");
  }

  if (coldKeywords.some((keyword) => name.includes(keyword))) {
    tags.push("cold");
  }

  if (rainKeywords.some((keyword) => name.includes(keyword))) {
    tags.push("rain");
  }

  if (cityKeywords.some((keyword) => name.includes(keyword))) {
    tags.push("city");
  }

  if (adventureKeywords.some((keyword) => name.includes(keyword))) {
    tags.push("adventure");
  }

  if (tags.length === 1) {
    tags.push("mixed");
  }

  return tags;
}

function getSuggestionPoolForTags(tags) {
  const suggestionPool = {
    essentials: [
      "Passport or ID",
      "Phone charger",
      "Medications",
      "Travel-size toiletries",
      "Comfortable walking shoes"
    ],
    warm: [
      "Sunscreen",
      "Sunglasses",
      "Swimsuit",
      "Lightweight shirts"
    ],
    cold: [
      "Warm jacket",
      "Thermal layers",
      "Gloves",
      "Beanie"
    ],
    rain: [
      "Compact umbrella",
      "Rain jacket",
      "Water-resistant shoes"
    ],
    city: [
      "Portable power bank",
      "Day bag",
      "Transit card holder"
    ],
    adventure: [
      "Refillable water bottle",
      "Trail snacks",
      "First-aid basics"
    ],
    mixed: [
      "Light jacket",
      "Outlet adapter",
      "Backup card/cash"
    ]
  };

  const merged = [];
  tags.forEach((tag) => {
    const items = suggestionPool[tag] || [];
    items.forEach((item) => {
      if (!merged.includes(item)) {
        merged.push(item);
      }
    });
  });

  return merged;
}

function getPackingItemNamesSet() {
  return new Set(packingItems.map((item) => item.name.trim().toLowerCase()));
}

function renderSuggestions() {
  const sourceText = document.getElementById("suggestionSourceText");
  const suggestionList = document.getElementById("suggestionList");
  const addAllButton = document.getElementById("addAllSuggestionsBtn");

  if (!sourceText || !suggestionList || !addAllButton) {
    return;
  }

  suggestionList.innerHTML = "";
  currentSuggestions = [];

  const destinations = getDestinations();
  const destination = getPrimaryDestination(destinations);

  if (!destination) {
    sourceText.textContent = "Suggestions appear after you add a destination.";
    addAllButton.disabled = true;
    return;
  }

  const tags = getDestinationTags(destination);
  const suggestionPool = getSuggestionPoolForTags(tags);
  const existingNames = getPackingItemNamesSet();

  currentSuggestions = suggestionPool.filter((itemName) => !existingNames.has(itemName.toLowerCase()));

  const dateLabel = destination.startDate ? ` (${new Date(destination.startDate).toLocaleDateString()})` : "";
  sourceText.textContent = `Suggestions for ${destination.name}${dateLabel}`;

  if (currentSuggestions.length === 0) {
    const li = document.createElement("li");
    li.className = "suggestion-empty";
    li.textContent = "All suggested items are already in your packing list.";
    suggestionList.appendChild(li);
    addAllButton.disabled = true;
    return;
  }

  currentSuggestions.forEach((itemName) => {
    const li = document.createElement("li");
    li.innerHTML = `${itemName} <button type="button" onclick="addSuggestedItem('${escapeForInlineString(itemName)}')">Add</button>`;
    suggestionList.appendChild(li);
  });

  addAllButton.disabled = false;
}

function addSuggestedItem(itemName) {
  if (!itemName) {
    return;
  }

  const existing = getPackingItemNamesSet();
  if (existing.has(itemName.toLowerCase())) {
    return;
  }

  const item = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: itemName,
    checked: false
  };

  packingItems.push(item);
  saveItems();
  addItemToList(item);
  renderSuggestions();
}

function addAllSuggestions() {
  if (currentSuggestions.length === 0) {
    return;
  }

  currentSuggestions.forEach((itemName) => {
    addSuggestedItem(itemName);
  });
}

function escapeForInlineString(text) {
  return text.replace(/'/g, "\\'");
}