// expenses.js

const EXPENSES_KEY = "itineraryExpenses";
let expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];

document.addEventListener("DOMContentLoaded", () => {
  loadExpenses();
});

// Function to add an expense
function addExpense() {
  const expenseName = document.getElementById("expenseName");
  const expenseAmount = document.getElementById("expenseAmount");
  const expensePayer = document.getElementById("expensePayer");
  const expenseDueDate = document.getElementById("expenseDueDate");

  // Validate input
  if (expenseName.value.trim() === "" || expenseAmount.value === "" || expensePayer.value.trim() === "" || expenseDueDate.value === "") {
    alert("Please enter a name, amount, payer, and due date for the expense.");
    return;
  }

  const expense = {
    id: Date.now(),
    name: expenseName.value.trim(),
    amount: parseFloat(expenseAmount.value).toFixed(2),
    payer: expensePayer.value.trim(),
    dueDate: expenseDueDate.value
  };

  expenses.push(expense);
  saveExpenses();
  addExpenseToList(expense);

  // Clear inputs
  expenseName.value = "";
  expenseAmount.value = "";
  expenseDueDate.value = "";
  expensePayer.value = "";
}

function addExpenseToList(expense) {
  const expenseList = document.getElementById("expenseList");
  const li = document.createElement("li");
  li.dataset.expenseId = String(expense.id);
  li.innerHTML = `
    ${expense.name} - $${expense.amount} - Paid by ${expense.payer} - Due <strong>${expense.dueDate}</strong>
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
}

function loadExpenses() {
  expenses.forEach(addExpenseToList);
}

function saveExpenses() {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}