// expenses.js

// Function to add an expense
function addExpense() {
  const expenseName = document.getElementById("expenseName");
  const expenseAmount = document.getElementById("expenseAmount");
  const expenseDate = document.getElementById("expenseDate");
  const expenseList = document.getElementById("expenseList");

  // Validate input
  if (expenseName.value.trim() === "" || expenseAmount.value === "" || expenseDate.value === "") {
    alert("Please enter a name, amount, and date for the expense.");
    return;
  }

  // Create list item
  const li = document.createElement("li");
  li.innerHTML = `
    ${expenseName.value} - $${parseFloat(expenseAmount.value).toFixed(2)} - <strong>${expenseDate.value}</strong>
    <button onclick="this.parentElement.remove()">Delete</button>
  `;

  expenseList.appendChild(li);

  // Clear inputs
  expenseName.value = "";
  expenseAmount.value = "";
  expenseDate.value = "";
}