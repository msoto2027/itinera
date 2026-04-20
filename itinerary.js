// itinerary.js

let activities = JSON.parse(localStorage.getItem('itineraryActivities')) || [];
const TRIP_SETTINGS_KEY = 'itineraryTripSettings';
let tripSettings = getTripSettings();
let calendar;

document.addEventListener('DOMContentLoaded', function() {
  loadActivities();
  initializeTripControls();
  initializeCalendar();
  applyTripRangeToCalendar();
});

function addActivity() {
  const activityInput = document.getElementById("activityInput");
  const dateInput = document.getElementById("dateInput");

  if (activityInput.value.trim() === "" || dateInput.value === "") {
    alert("Please enter an activity and a date/time!");
    return;
  }

  if (!isActivityWithinTripRange(dateInput.value)) {
    alert("This activity is outside your current trip range. Adjust the trip length or pick a date within range.");
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

function getTodayInputDate() {
  const now = new Date();
  const localNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  return localNow.toISOString().slice(0, 10);
}

function getTripSettings() {
  const fallback = {
    startDate: getTodayInputDate(),
    lengthDays: 7
  };

  const stored = localStorage.getItem(TRIP_SETTINGS_KEY);
  if (!stored) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(stored);
    const lengthDays = Number.parseInt(parsed.lengthDays, 10);

    if (!parsed.startDate || Number.isNaN(lengthDays) || lengthDays < 1 || lengthDays > 365) {
      return fallback;
    }

    return {
      startDate: parsed.startDate,
      lengthDays
    };
  } catch (error) {
    return fallback;
  }
}

function saveTripSettings() {
  localStorage.setItem(TRIP_SETTINGS_KEY, JSON.stringify(tripSettings));
}

function getTripRange(startDate, lengthDays) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + lengthDays);

  return {
    start: startDate,
    end: end.toISOString().slice(0, 10)
  };
}

function initializeTripControls() {
  const startDateInput = document.getElementById('tripStartDateInput');
  const lengthInput = document.getElementById('tripLengthInput');
  const applyButton = document.getElementById('applyTripRangeBtn');
  const presetButtons = document.querySelectorAll('.trip-preset-btn');

  if (!startDateInput || !lengthInput || !applyButton) {
    return;
  }

  startDateInput.value = tripSettings.startDate;
  lengthInput.value = String(tripSettings.lengthDays);
  updatePresetSelection(presetButtons, tripSettings.lengthDays);

  function applyTripRangeFromInputs() {
    const nextStartDate = startDateInput.value;
    const nextLength = Number.parseInt(lengthInput.value, 10);

    if (!nextStartDate || Number.isNaN(nextLength) || nextLength < 1 || nextLength > 365) {
      alert('Please enter a valid trip start date and a trip length from 1 to 365 days.');
      return;
    }

    tripSettings = {
      startDate: nextStartDate,
      lengthDays: nextLength
    };

    saveTripSettings();
    applyTripRangeToCalendar();
    updatePresetSelection(presetButtons, nextLength);
  }

  applyButton.addEventListener('click', () => {
    applyTripRangeFromInputs();
  });

  presetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const days = Number.parseInt(button.dataset.days, 10);
      if (Number.isNaN(days)) {
        return;
      }

      if (!startDateInput.value) {
        startDateInput.value = getTodayInputDate();
      }

      lengthInput.value = String(days);
      applyTripRangeFromInputs();
    });
  });
}

function updatePresetSelection(presetButtons, selectedLength) {
  presetButtons.forEach((button) => {
    const buttonLength = Number.parseInt(button.dataset.days, 10);
    const isActive = buttonLength === selectedLength;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function applyTripRangeToCalendar() {
  if (!calendar) {
    return;
  }

  const range = getTripRange(tripSettings.startDate, tripSettings.lengthDays);

  calendar.setOption('validRange', {
    start: range.start,
    end: range.end
  });
  calendar.changeView('dayGrid', {
    start: range.start,
    end: range.end
  });
}

function isActivityWithinTripRange(activityDateTime) {
  const activityDate = new Date(activityDateTime);
  const start = new Date(`${tripSettings.startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + tripSettings.lengthDays);

  return activityDate >= start && activityDate < end;
}

function initializeCalendar() {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGrid',
    initialDate: tripSettings.startDate,
    height: 'auto',
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