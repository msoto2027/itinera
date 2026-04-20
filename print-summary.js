const DESTINATIONS_KEY = "itineraryDestinations";
const ACTIVITIES_KEY = "itineraryActivities";
const PACKING_KEY = "itineraryPackingItems";
const EXPENSES_KEY = "itineraryExpenses";
const TRAVELERS_KEY = "itineraryTravelers";

document.addEventListener("DOMContentLoaded", () => {
  setupPrintButton();
  renderGeneratedAt();
  renderDestinations();
  renderItinerary();
  renderPacking();
  renderTravelers();
  renderExpenses();
  renderSplitSummary();
});

function readStoredArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key)) || [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function setupPrintButton() {
  const printButton = document.getElementById("printSummaryBtn");
  if (!printButton) {
    return;
  }

  printButton.addEventListener("click", () => {
    window.print();
  });
}

function renderGeneratedAt() {
  const generatedAt = document.getElementById("printGeneratedAt");
  const preparedOn = document.getElementById("printPreparedOn");
  if (!generatedAt) {
    return;
  }

  const timestamp = new Date().toLocaleString();
  generatedAt.textContent = `Generated ${timestamp}`;
  if (preparedOn) {
    preparedOn.textContent = timestamp;
  }
}

function renderList(listId, items, emptyText, formatter) {
  const list = document.getElementById(listId);
  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "print-empty-item";
    li.textContent = emptyText;
    list.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "print-summary-item";
    li.innerHTML = formatter(item);
    list.appendChild(li);
  });
}

function renderDestinations() {
  const destinations = readStoredArray(DESTINATIONS_KEY)
    .sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));

  renderList(
    "printDestinationsList",
    destinations,
    "No destinations saved.",
    (destination) => {
      const start = destination.startDate ? new Date(`${destination.startDate}T00:00:00`).toLocaleDateString() : "Unknown start";
      const end = destination.endDate ? new Date(`${destination.endDate}T00:00:00`).toLocaleDateString() : "Unknown end";
      return `<strong>${destination.name || "Untitled destination"}</strong><br>${start} to ${end}`;
    }
  );
}

function renderItinerary() {
  const activities = readStoredArray(ACTIVITIES_KEY)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  renderList(
    "printItineraryList",
    activities,
    "No itinerary activities saved.",
    (activity) => {
      const when = activity.date ? new Date(activity.date).toLocaleString() : "Unknown date/time";
      const address = activity.address ? `<br>Address: ${activity.address}` : "";
      return `<strong>${activity.title || "Untitled activity"}</strong><br>${when}${address}`;
    }
  );
}

function renderPacking() {
  const packingItems = readStoredArray(PACKING_KEY);
  renderList(
    "printPackingList",
    packingItems,
    "No packing items saved.",
    (item) => {
      const itemName = item.name || "Unnamed item";
      const status = item.checked ? "Packed" : "Not packed";
      return `<strong>${itemName}</strong><br>${status}`;
    }
  );
}

function renderTravelers() {
  const travelers = readStoredArray(TRAVELERS_KEY);
  renderList(
    "printTravelersList",
    travelers,
    "No travelers saved.",
    (traveler) => `${traveler.name || "Unnamed traveler"}`
  );
}

function getExpenseSplitMembers(expense, travelers) {
  if (Array.isArray(expense.splitWith) && expense.splitWith.length > 0) {
    return expense.splitWith;
  }

  return travelers.map((traveler) => traveler.name);
}

function renderExpenses() {
  const travelers = readStoredArray(TRAVELERS_KEY);
  const expenses = readStoredArray(EXPENSES_KEY);

  renderList(
    "printExpensesList",
    expenses,
    "No expenses saved.",
    (expense) => {
      const splitMembers = getExpenseSplitMembers(expense, travelers);
      return `<strong>${expense.name || "Unnamed expense"}</strong><br>$${Number.parseFloat(expense.amount || 0).toFixed(2)} paid by ${expense.payer || "Unknown payer"}<br>Due ${expense.dueDate || "Unknown due date"}<br>Split with: ${splitMembers.join(", ") || "Nobody selected"}`;
    }
  );
}

function renderSplitSummary() {
  const travelers = readStoredArray(TRAVELERS_KEY);
  const expenses = readStoredArray(EXPENSES_KEY);

  if (travelers.length === 0 || expenses.length === 0) {
    renderList(
      "printSplitSummaryList",
      [],
      "Add travelers and expenses to generate a split summary.",
      (item) => item
    );
    return;
  }

  const owedByTraveler = new Map();
  travelers.forEach((traveler) => {
    owedByTraveler.set(traveler.name.toLowerCase(), 0);
  });

  expenses.forEach((expense) => {
    const splitMembers = getExpenseSplitMembers(expense, travelers);
    if (splitMembers.length === 0) {
      return;
    }

    const share = Number.parseFloat(expense.amount || 0) / splitMembers.length;
    splitMembers.forEach((travelerName) => {
      const key = travelerName.toLowerCase();
      owedByTraveler.set(key, (owedByTraveler.get(key) || 0) + share);
    });
  });

  const summaryRows = travelers.map((traveler) => {
    const paid = expenses
      .filter((expense) => String(expense.payer || "").toLowerCase() === traveler.name.toLowerCase())
      .reduce((sum, expense) => sum + Number.parseFloat(expense.amount || 0), 0);
    const owed = owedByTraveler.get(traveler.name.toLowerCase()) || 0;
    const balance = paid - owed;
    const status = balance >= 0
      ? `is owed $${Math.abs(balance).toFixed(2)}`
      : `owes $${Math.abs(balance).toFixed(2)}`;

    return {
      name: traveler.name,
      paid,
      owed,
      status
    };
  });

  renderList(
    "printSplitSummaryList",
    summaryRows,
    "Add travelers and expenses to generate a split summary.",
    (row) => `<strong>${row.name}</strong><br>Paid $${row.paid.toFixed(2)}. Share owed $${row.owed.toFixed(2)}. ${row.name} ${row.status}.`
  );
}