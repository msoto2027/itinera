// expenses.js

// Function to add an expense
function addExpense() {
  const expenseName = document.getElementById("expenseName");
  const expenseAmount = document.getElementById("expenseAmount");
  const expensePayer = document.getElementById("expensePayer");
  const expenseDueDate = document.getElementById("expenseDueDate");
  const expenseList = document.getElementById("expenseList");

  // Validate input
  if (expenseName.value.trim() === "" || expenseAmount.value === "" || expensePayer.value.trim() === "" || expenseDueDate.value === "") {
    alert("Please enter a name, amount, payer, and due date for the expense.");
    return;
  }

  // Create list item
  const li = document.createElement("li");
  li.innerHTML = `
    ${expenseName.value} - $${parseFloat(expenseAmount.value).toFixed(2)} - Paid by ${expensePayer.value} - Due <strong>${expenseDueDate.value}</strong>
    <button onclick="this.parentElement.remove()">Delete</button>
  `;

  expenseList.appendChild(li);

  // Clear inputs
  expenseName.value = "";
  expenseAmount.value = "";
  expenseDueDate.value = "";
  expensePayer.value = "";
}