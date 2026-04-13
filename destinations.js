// destinations.js

let destinations = JSON.parse(localStorage.getItem('itineraryDestinations')) || [];

document.addEventListener('DOMContentLoaded', function() {
  loadDestinations();
});

function addDestination() {
  const destinationInput = document.getElementById("destinationInput");
  const startDateInput = document.getElementById("startDateInput");
  const endDateInput = document.getElementById("endDateInput");

  if (destinationInput.value.trim() === "" || startDateInput.value === "" || endDateInput.value === "") {
    alert("Please enter a destination, start date, and end date!");
    return;
  }

  const destination = {
    name: destinationInput.value,
    startDate: startDateInput.value,
    endDate: endDateInput.value,
    id: Date.now()
  };

  destinations.push(destination);
  saveDestinations();

  addToList(destination);

  destinationInput.value = "";
  startDateInput.value = "";
  endDateInput.value = "";
}

function addToList(destination) {
  const destinationList = document.getElementById("destinationList");
  const li = document.createElement("li");
  const startDate = new Date(destination.startDate).toLocaleDateString();
  const endDate = new Date(destination.endDate).toLocaleDateString();
  li.className = "destination-item";
  li.innerHTML = `<strong>${destination.name}</strong><br>From ${startDate} to ${endDate} <button onclick="deleteDestination(${destination.id})">Delete</button>`;
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