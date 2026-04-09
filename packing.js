// packing.js

function addItem() {
  const itemInput = document.getElementById("itemInput");
  const packingList = document.getElementById("packingList");

  if (itemInput.value.trim() === "") {
    alert("Please enter an item to add.");
    return;
  }

  const li = document.createElement("li");
  li.innerHTML = `${itemInput.value} <button onclick="this.parentElement.remove()">Delete</button>`;
  packingList.appendChild(li);

  itemInput.value = "";
}