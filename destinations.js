// destinations.js

let destinations = JSON.parse(localStorage.getItem('itineraryDestinations')) || [];

document.addEventListener('DOMContentLoaded', function() {
  loadDestinations();
});

function addDestination() {
  const destinationInput = document.getElementById("destinationInput");

  if (destinationInput.value.trim() === "") {
    alert("Please enter a destination!");
    return;
  }

  const destination = {
    name: destinationInput.value,
    id: Date.now()
  };

  destinations.push(destination);
  saveDestinations();

  addToList(destination);

  destinationInput.value = "";
}

function addToList(destination) {
  const destinationList = document.getElementById("destinationList");
  const li = document.createElement("li");
  li.innerHTML = `${destination.name} <button onclick="deleteDestination(${destination.id})">Delete</button>`;
  destinationList.appendChild(li);
}

function deleteDestination(id) {
  destinations = destinations.filter(d => d.id !== id);
  saveDestinations();

  const li = document.querySelector(`button[onclick="deleteDestination(${id})"]`).parentElement;
  li.remove();
}

function loadDestinations() {
  destinations.forEach(addToList);
}

function saveDestinations() {
  localStorage.setItem('itineraryDestinations', JSON.stringify(destinations));
}