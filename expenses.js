// expenses.js

const EXPENSES_KEY = "itineraryExpenses";
const TRAVELERS_KEY = "itineraryTravelers";
const ACTIVITIES_KEY = "itineraryActivities";
let expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
let travelers = JSON.parse(localStorage.getItem(TRAVELERS_KEY)) || [];
let itineraryActivities = getStoredActivities();

document.addEventListener("DOMContentLoaded", () => {
  loadTravelers();
  loadExpenses();
  refreshTravelerOptions();
  renderExpenseTravelerChecks();
  initializeItineraryExpenseImport();
  updateTravelerSummary();
  updateSplitSummary();
});

function getStoredActivities() {
  try {
    const storedActivities = JSON.parse(localStorage.getItem(ACTIVITIES_KEY)) || [];
    return Array.isArray(storedActivities) ? storedActivities : [];
  } catch (error) {
    return [];
  }
}

function initializeItineraryExpenseImport() {
  const itinerarySelect = document.getElementById("itineraryExpenseSelect");
  const importButton = document.getElementById("importItineraryExpenseBtn");

  if (!itinerarySelect || !importButton) {
    return;
  }

  populateItineraryExpenseOptions(itinerarySelect);
  importButton.addEventListener("click", importSelectedItineraryActivity);
}

function populateItineraryExpenseOptions(selectElement) {
  const helpText = document.getElementById("itineraryImportHelpText");
  const importButton = document.getElementById("importItineraryExpenseBtn");
  if (!selectElement || !helpText || !importButton) {
    return;
  }

  itineraryActivities = getStoredActivities()
    .slice()
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  selectElement.innerHTML = "";

  if (itineraryActivities.length === 0) {
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "No itinerary items available yet";
    selectElement.appendChild(emptyOption);
    selectElement.disabled = true;
    importButton.disabled = true;
    helpText.textContent = "Add activities on the itinerary page, then import one here to start a matching expense.";
    setItineraryImportStatus("");
    return;
  }

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Choose an itinerary item";
  selectElement.appendChild(placeholderOption);

  itineraryActivities.forEach((activity) => {
    const option = document.createElement("option");
    option.value = String(activity.id);
    option.textContent = getItineraryOptionLabel(activity);
    selectElement.appendChild(option);
  });

  selectElement.disabled = false;
  importButton.disabled = false;
  helpText.textContent = "Select a saved itinerary activity to copy its title and address into a new expense.";
  setItineraryImportStatus("");
}

function getItineraryOptionLabel(activity) {
  const title = activity && activity.title ? activity.title : "Untitled activity";
  const address = activity && activity.address ? activity.address.trim() : "";
  return address ? `${title} - ${address}` : title;
}

function importSelectedItineraryActivity() {
  const itinerarySelect = document.getElementById("itineraryExpenseSelect");
  const expenseName = document.getElementById("expenseName");
  if (!itinerarySelect || !expenseName) {
    return;
  }

  itineraryActivities = getStoredActivities();
  const selectedActivity = itineraryActivities.find((activity) => String(activity.id) === itinerarySelect.value);

  if (!selectedActivity) {
    setItineraryImportStatus("Choose an itinerary item to import first.");
    return;
  }

  expenseName.value = buildImportedExpenseName(selectedActivity);
  setItineraryImportStatus(getItineraryImportMessage(selectedActivity));
}

function buildImportedExpenseName(activity) {
  const title = activity.title ? activity.title.trim() : "";
  const address = activity.address ? activity.address.trim() : "";
  return address ? `${title} - ${address}` : title;
}

function getItineraryImportMessage(activity) {
  return `Loaded \"${activity.title}\" into the expense form.`;
}

function setItineraryImportStatus(message) {
  const status = document.getElementById("itineraryImportStatus");
  if (!status) {
    return;
  }

  status.textContent = message;
}

// Function to add an expense
function addExpense() {
  const expenseName = document.getElementById("expenseName");
  const expenseAmount = document.getElementById("expenseAmount");
  const expensePayer = document.getElementById("expensePayer");
  const expenseDueDate = document.getElementById("expenseDueDate");
  const splitWith = getSelectedExpenseTravelers();

  // Validate input
  if (expenseName.value.trim() === "" || expenseAmount.value === "" || expensePayer.value.trim() === "" || expenseDueDate.value === "") {
    alert("Please enter a name, amount, payer, and due date for the expense.");
    return;
  }

  if (splitWith.length === 0) {
    alert("Select at least one traveler to split this expense.");
    return;
  }

  const expense = {
    id: Date.now(),
    name: expenseName.value.trim(),
    amount: parseFloat(expenseAmount.value).toFixed(2),
    payer: expensePayer.value.trim(),
    dueDate: expenseDueDate.value,
    splitWith
  };

  ensureTravelerExists(expense.payer);

  expenses.push(expense);
  saveExpenses();
  addExpenseToList(expense);
  updateSplitSummary();

  // Clear inputs
  expenseName.value = "";
  expenseAmount.value = "";
  expenseDueDate.value = "";
  expensePayer.value = "";
  selectAllExpenseTravelers();
  setItineraryImportStatus("");
}

function addTraveler() {
  const travelerNameInput = document.getElementById("travelerNameInput");
  if (!travelerNameInput || travelerNameInput.value.trim() === "") {
    alert("Please enter a traveler name.");
    return;
  }

  const travelerName = travelerNameInput.value.trim();
  if (travelerExists(travelerName)) {
    alert("That traveler is already in the trip group.");
    return;
  }

  const traveler = {
    id: Date.now(),
    name: travelerName
  };

  travelers.push(traveler);
  saveTravelers();
  addTravelerToList(traveler);
  refreshTravelerOptions();
  renderExpenseTravelerChecks();
  updateTravelerSummary();
  updateSplitSummary();
  travelerNameInput.value = "";
}

function addExpenseToList(expense) {
  const expenseList = document.getElementById("expenseList");
  const li = document.createElement("li");
  li.dataset.expenseId = String(expense.id);
  const splitNames = getExpenseSplitMembers(expense);
  li.innerHTML = `
    ${expense.name} - $${expense.amount} - Paid by ${expense.payer} - Due <strong>${expense.dueDate}</strong>
    <br><span class="expense-split-members">Split with: ${splitNames.join(", ")}</span>
    <button type="button" onclick="deleteExpense(${expense.id})">Delete</button>
  `;
  expenseList.appendChild(li);
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();

  const listItem = document.querySelector(`[data-expense-id="${id}"]`);
  if (listItem) {
    listItem.remove();
  }

  updateSplitSummary();
}

function loadExpenses() {
  expenses.forEach(addExpenseToList);
}

function addTravelerToList(traveler) {
  const travelerList = document.getElementById("travelerList");
  const li = document.createElement("li");
  li.dataset.travelerId = String(traveler.id);
  li.innerHTML = `${traveler.name} <button type="button" onclick="deleteTraveler(${traveler.id})">Remove</button>`;
  travelerList.appendChild(li);
}

function loadTravelers() {
  travelers.forEach(addTravelerToList);
}

function deleteTraveler(id) {
  const traveler = travelers.find((entry) => entry.id === id);
  if (!traveler) {
    return;
  }

  const hasExpenses = expenses.some((expense) => {
    const travelerName = traveler.name.toLowerCase();
    return expense.payer.toLowerCase() === travelerName
      || getExpenseSplitMembers(expense).some((name) => name.toLowerCase() === travelerName);
  });
  if (hasExpenses) {
    alert("This traveler is attached to existing expenses. Remove or update those expenses first.");
    return;
  }

  travelers = travelers.filter((entry) => entry.id !== id);
  saveTravelers();

  const listItem = document.querySelector(`[data-traveler-id="${id}"]`);
  if (listItem) {
    listItem.remove();
  }

  refreshTravelerOptions();
  renderExpenseTravelerChecks();
  updateTravelerSummary();
  updateSplitSummary();
}

function travelerExists(name) {
  return travelers.some((traveler) => traveler.name.toLowerCase() === name.toLowerCase());
}

function ensureTravelerExists(name) {
  if (!name || travelerExists(name)) {
    return;
  }

  const traveler = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name
  };

  travelers.push(traveler);
  saveTravelers();
  addTravelerToList(traveler);
  refreshTravelerOptions();
  renderExpenseTravelerChecks();
  updateTravelerSummary();
}

function getSelectedExpenseTravelers() {
  const checks = Array.from(document.querySelectorAll("#expenseTravelerChecks input[type='checkbox']:checked"));
  return checks.map((checkbox) => checkbox.value);
}

function renderExpenseTravelerChecks() {
  const container = document.getElementById("expenseTravelerChecks");
  const helpText = document.getElementById("expenseSplitHelpText");
  if (!container || !helpText) {
    return;
  }

  const selectedNames = new Set(getSelectedExpenseTravelers());
  container.innerHTML = "";

  if (travelers.length === 0) {
    helpText.textContent = "Add travelers first, then choose who should share each expense.";
    return;
  }

  helpText.textContent = "Choose which travelers should share this expense.";

  travelers.forEach((traveler) => {
    const label = document.createElement("label");
    label.className = "traveler-check-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = traveler.name;
    checkbox.checked = selectedNames.size === 0 || selectedNames.has(traveler.name);

    const text = document.createElement("span");
    text.textContent = traveler.name;

    label.appendChild(checkbox);
    label.appendChild(text);
    container.appendChild(label);
  });
}

function selectAllExpenseTravelers() {
  const checks = document.querySelectorAll("#expenseTravelerChecks input[type='checkbox']");
  checks.forEach((checkbox) => {
    checkbox.checked = true;
  });
}

function getExpenseSplitMembers(expense) {
  if (Array.isArray(expense.splitWith) && expense.splitWith.length > 0) {
    return expense.splitWith;
  }

  return travelers.map((traveler) => traveler.name);
}

function refreshTravelerOptions() {
  const travelerOptions = document.getElementById("travelerOptions");
  if (!travelerOptions) {
    return;
  }

  travelerOptions.innerHTML = "";
  travelers.forEach((traveler) => {
    const option = document.createElement("option");
    option.value = traveler.name;
    travelerOptions.appendChild(option);
  });
}

function updateTravelerSummary() {
  const travelerSummaryText = document.getElementById("travelerSummaryText");
  if (!travelerSummaryText) {
    return;
  }

  if (travelers.length === 0) {
    travelerSummaryText.textContent = "Add everyone going on the trip to split expenses fairly.";
    return;
  }

  travelerSummaryText.textContent = `${travelers.length} traveler${travelers.length === 1 ? "" : "s"} in the trip group.`;
}

function updateSplitSummary() {
  const splitSummaryText = document.getElementById("splitSummaryText");
  const splitSummaryList = document.getElementById("splitSummaryList");

  if (!splitSummaryText || !splitSummaryList) {
    return;
  }

  splitSummaryList.innerHTML = "";

  if (travelers.length === 0) {
    splitSummaryText.textContent = "Add travelers to see how trip costs will be split.";
    return;
  }

  if (expenses.length === 0) {
    splitSummaryText.textContent = "Add expenses to calculate each traveler's share.";
    return;
  }

  const totalCost = expenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0);
  splitSummaryText.textContent = `Total trip cost: $${totalCost.toFixed(2)}. Shares below reflect only the travelers selected on each expense.`;

  const owedByTraveler = new Map();
  travelers.forEach((traveler) => {
    owedByTraveler.set(traveler.name.toLowerCase(), 0);
  });

  expenses.forEach((expense) => {
    const splitMembers = getExpenseSplitMembers(expense);
    if (splitMembers.length === 0) {
      return;
    }

    const share = Number.parseFloat(expense.amount) / splitMembers.length;
    splitMembers.forEach((travelerName) => {
      const key = travelerName.toLowerCase();
      owedByTraveler.set(key, (owedByTraveler.get(key) || 0) + share);
    });
  });

  travelers.forEach((traveler) => {
    const paid = expenses
      .filter((expense) => expense.payer.toLowerCase() === traveler.name.toLowerCase())
      .reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0);

    const owed = owedByTraveler.get(traveler.name.toLowerCase()) || 0;
    const balance = paid - owed;
    const statusText = balance >= 0
      ? `is owed $${Math.abs(balance).toFixed(2)}`
      : `owes $${Math.abs(balance).toFixed(2)}`;

    const li = document.createElement("li");
    li.className = "split-summary-item";
    li.innerHTML = `<strong>${traveler.name}</strong><br>Paid $${paid.toFixed(2)}. Share owed $${owed.toFixed(2)}. ${traveler.name} ${statusText}.`;
    splitSummaryList.appendChild(li);
  });
}

function saveExpenses() {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

function saveTravelers() {
  localStorage.setItem(TRAVELERS_KEY, JSON.stringify(travelers));
}