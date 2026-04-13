let destinations = JSON.parse(localStorage.getItem("itineraryDestinations")) || [];
let destinationMap;
let mapLayer;
const mapMarkers = new Map();

document.addEventListener("DOMContentLoaded", async () => {
  initializeMap();
  await loadDestinations();
});

async function addDestination() {
  const destinationInput = document.getElementById("destinationInput");
  const startDateInput = document.getElementById("startDateInput");
  const endDateInput = document.getElementById("endDateInput");
  const addButton = document.getElementById("addDestinationBtn");

  if (destinationInput.value.trim() === "" || startDateInput.value === "" || endDateInput.value === "") {
    alert("Please enter a destination, start date, and end date!");
    return;
  }

  addButton.disabled = true;
  addButton.textContent = "Pinning...";

  try {
    const place = await geocodeLocation(destinationInput.value.trim());

    if (!place) {
      alert("Location not found. Try a more specific destination (for example: City, Country).");
      return;
    }

    const destination = {
      name: destinationInput.value.trim(),
      startDate: startDateInput.value,
      endDate: endDateInput.value,
      id: Date.now(),
      lat: Number(place.lat),
      lng: Number(place.lon)
    };

    destinations.push(destination);
    saveDestinations();

    addToList(destination);
    addMapPin(destination, true);

    destinationInput.value = "";
    startDateInput.value = "";
    endDateInput.value = "";
  } catch (error) {
    alert("Could not pin this location right now. Please try again.");
  } finally {
    addButton.disabled = false;
    addButton.textContent = "Add";
  }
}

function initializeMap() {
  destinationMap = L.map("destinationMap").setView([20, 0], 2);

  mapLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  });

  mapLayer.addTo(destinationMap);
}

function addToList(destination) {
  const destinationList = document.getElementById("destinationList");
  const li = document.createElement("li");
  const startDate = new Date(destination.startDate).toLocaleDateString();
  const endDate = new Date(destination.endDate).toLocaleDateString();

  li.className = "destination-item";
  li.dataset.destinationId = String(destination.id);
  li.innerHTML = `<strong>${destination.name}</strong><br>From ${startDate} to ${endDate} <button onclick="deleteDestination(${destination.id})">Delete</button>`;
  destinationList.appendChild(li);
}

function addMapPin(destination, shouldZoom) {
  if (!destinationMap || destination.lat == null || destination.lng == null) {
    return;
  }

  const marker = L.marker([destination.lat, destination.lng])
    .addTo(destinationMap)
    .bindPopup(`<strong>${destination.name}</strong><br>${formatDateRange(destination.startDate, destination.endDate)}`);

  mapMarkers.set(destination.id, marker);

  if (shouldZoom) {
    destinationMap.flyTo([destination.lat, destination.lng], 8, { duration: 0.8 });
  }
}

function deleteDestination(id) {
  destinations = destinations.filter((destination) => destination.id !== id);
  saveDestinations();

  const listItem = document.querySelector(`[data-destination-id="${id}"]`);
  if (listItem) {
    listItem.remove();
  }

  const marker = mapMarkers.get(id);
  if (marker) {
    destinationMap.removeLayer(marker);
    mapMarkers.delete(id);
  }
}

async function loadDestinations() {
  for (const destination of destinations) {
    addToList(destination);

    if (destination.lat != null && destination.lng != null) {
      addMapPin(destination, false);
      continue;
    }

    try {
      const place = await geocodeLocation(destination.name);
      if (place) {
        destination.lat = Number(place.lat);
        destination.lng = Number(place.lon);
        addMapPin(destination, false);
      }
    } catch (error) {
      // Keep loading the remaining destinations even if one lookup fails.
    }
  }

  saveDestinations();
  fitMapToMarkers();
}

function fitMapToMarkers() {
  const markers = Array.from(mapMarkers.values());
  if (markers.length === 0) {
    return;
  }

  const bounds = L.featureGroup(markers).getBounds();
  destinationMap.fitBounds(bounds.pad(0.25));
}

async function geocodeLocation(locationName) {
  const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(locationName)}`;
  const response = await fetch(endpoint, {
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Geocoding request failed");
  }

  const results = await response.json();
  return results[0] || null;
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate).toLocaleDateString();
  const end = new Date(endDate).toLocaleDateString();
  return `${start} - ${end}`;
}

function saveDestinations() {
  localStorage.setItem("itineraryDestinations", JSON.stringify(destinations));
}