// itinerary.js

let activities = JSON.parse(localStorage.getItem('itineraryActivities')) || [];
let calendar;

document.addEventListener('DOMContentLoaded', function() {
  loadActivities();
  initializeCalendar();
});

function addActivity() {
  const activityInput = document.getElementById("activityInput");
  const dateInput = document.getElementById("dateInput");

  if (activityInput.value.trim() === "" || dateInput.value === "") {
    alert("Please enter an activity and a date/time!");
    return;
  }

  const activity = {
    title: activityInput.value,
    date: dateInput.value,
    id: Date.now() // unique id
  };

  activities.push(activity);
  saveActivities();

  // Add to list
  addToList(activity);

  // Add to calendar
  calendar.addEvent({
    title: activity.title,
    start: activity.date,
    id: activity.id,
    backgroundColor: '#3498db',
    borderColor: '#2980b9'
  });

  // Clear inputs
  activityInput.value = "";
  dateInput.value = "";
}

function addToList(activity) {
  const activityList = document.getElementById("activityList");
  const li = document.createElement("li");
  const dateStr = new Date(activity.date).toLocaleString();
  li.innerHTML = `${activity.title} - <strong>${dateStr}</strong> 
                  <button onclick="deleteActivity(${activity.id})">Delete</button>`;
  activityList.appendChild(li);
}

function deleteActivity(id) {
  activities = activities.filter(a => a.id !== id);
  saveActivities();

  // Remove from list
  const li = document.querySelector(`button[onclick="deleteActivity(${id})"]`).parentElement;
  li.remove();

  // Remove from calendar
  const event = calendar.getEventById(id);
  if (event) event.remove();
}

function loadActivities() {
  activities.forEach(addToList);
}

function saveActivities() {
  localStorage.setItem('itineraryActivities', JSON.stringify(activities));
}

function initializeCalendar() {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: activities.map(a => ({
      title: a.title,
      start: a.date,
      id: a.id,
      backgroundColor: '#3498db',
      borderColor: '#2980b9'
    }))
  });
  calendar.render();
}