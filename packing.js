// packing.js

const PACKING_KEY = "itineraryPackingItems";
let packingItems = JSON.parse(localStorage.getItem(PACKING_KEY)) || [];

document.addEventListener("DOMContentLoaded", () => {
  loadItems();
});

function addItem() {
  const itemInput = document.getElementById("itemInput");

  if (itemInput.value.trim() === "") {
    alert("Please enter an item to add.");
    return;
  }

  const item = {
    id: Date.now(),
    name: itemInput.value.trim()
  };

  packingItems.push(item);
  saveItems();
  addItemToList(item);

  itemInput.value = "";
}

function addItemToList(item) {
  const packingList = document.getElementById("packingList");
  const li = document.createElement("li");
  li.dataset.packingItemId = String(item.id);
  li.innerHTML = `${item.name} <button type="button" onclick="deleteItem(${item.id})">Delete</button>`;
  packingList.appendChild(li);
}

function deleteItem(id) {
  packingItems = packingItems.filter((item) => item.id !== id);
  saveItems();

  const listItem = document.querySelector(`[data-packing-item-id="${id}"]`);
  if (listItem) {
    listItem.remove();
  }
}

function loadItems() {
  packingItems.forEach(addItemToList);
}

function saveItems() {
  localStorage.setItem(PACKING_KEY, JSON.stringify(packingItems));
}