// Itinerary
function addItinerary() {
  let input = document.getElementById("itineraryInput");
  let li = document.createElement("li");

  li.textContent = input.value + " ";

  let btn = document.createElement("button");
  btn.textContent = "Delete";
  btn.onclick = () => li.remove();

  li.appendChild(btn);
  document.getElementById("itineraryList").appendChild(li);

  input.value = "";
}

// Packing
function addPacking() {
  let input = document.getElementById("packingInput");
  let li = document.createElement("li");

  li.textContent = input.value + " ";

  let btn = document.createElement("button");
  btn.textContent = "Delete";
  btn.onclick = () => li.remove();

  li.appendChild(btn);
  document.getElementById("packingList").appendChild(li);

  input.value = "";
}

// Expenses
let total = 0;

function addExpense() {
  let name = document.getElementById("expenseName").value;
  let amount = parseFloat(document.getElementById("expenseAmount").value);

  if (!name || isNaN(amount)) return;

  let li = document.createElement("li");
  li.textContent = `${name}: $${amount.toFixed(2)} `;

  let btn = document.createElement("button");
  btn.textContent = "Delete";

  btn.onclick = () => {
    total -= amount;
    updateTotal();
    li.remove();
  };

  li.appendChild(btn);
  document.getElementById("expenseList").appendChild(li);

  total += amount;
  updateTotal();

  document.getElementById("expenseName").value = "";
  document.getElementById("expenseAmount").value = "";
}

function updateTotal() {
  document.getElementById("total").textContent = total.toFixed(2);
}