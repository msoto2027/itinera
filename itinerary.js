// itinerary.js

// itinerary.js

function addActivity() {
  const activityInput = document.getElementById("activityInput");
  const dateInput = document.getElementById("dateInput");
  const activityList = document.getElementById("activityList");

  if (activityInput.value.trim() === "" || dateInput.value === "") {
    alert("Please enter an activity and a date!");
    return;
  }

  const li = document.createElement("li");
  li.innerHTML = `${activityInput.value} - <strong>${dateInput.value}</strong> 
                  <button onclick="this.parentElement.remove()">Delete</button>`;
  activityList.appendChild(li);

  // Clear inputs
  activityInput.value = "";
  dateInput.value = "";
}