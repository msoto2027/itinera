// itinerary.js

let activities = JSON.parse(localStorage.getItem('itineraryActivities')) || [];
const TRIP_SETTINGS_KEY = 'itineraryTripSettings';
const DESTINATIONS_KEY = 'itineraryDestinations';
let tripSettings = getTripSettings();
let tripRangeSourceLabel = 'Using saved trip settings.';
let calendar;

document.addEventListener('DOMContentLoaded', function() {
  loadActivities();
  syncTripSettingsFromDestination();
  initializeTripControls();
  initializeDayViewControls();
  initializeCalendar();
  applyTripRangeToCalendar();
  updateTripRangeSourceText();
  refreshDayView();
});

function addActivity() {
  const activityInput = document.getElementById("activityInput");
  const activityAddressInput = document.getElementById("activityAddressInput");
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
    title: activityInput.value.trim(),
    address: activityAddressInput ? activityAddressInput.value.trim() : "",
    date: dateInput.value,
    id: Date.now() // unique id
  };

  activities.push(activity);
  saveActivities();

  // Add to list
  addToList(activity);

  // Add to calendar
  calendar.addEvent({
    title: getCalendarEventTitle(activity),
    start: activity.date,
    id: activity.id,
    backgroundColor: '#3498db',
    borderColor: '#2980b9'
  });

  // Clear inputs
  activityInput.value = "";
  if (activityAddressInput) {
    activityAddressInput.value = "";
  }
  dateInput.value = "";
  refreshDayView();
}

function addToList(activity) {
  const activityList = document.getElementById("activityList");
  const li = document.createElement("li");
  const dateStr = new Date(activity.date).toLocaleString();
  const addressLine = activity.address ? `<br><span class="activity-address">Address: ${activity.address}</span>` : "";
  li.innerHTML = `${activity.title} - <strong>${dateStr}</strong>${addressLine}
                  <button onclick="deleteActivity(${activity.id})">Delete</button>`;
  activityList.appendChild(li);
}

function getCalendarEventTitle(activity) {
  if (activity.address) {
    return `${activity.title} (${activity.address})`;
  }

  return activity.title;
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

  refreshDayView();
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
  const destinationSelect = document.getElementById('destinationSyncSelect');
  const syncButton = document.getElementById('syncDestinationDatesBtn');
  const presetButtons = document.querySelectorAll('.trip-preset-btn');

  if (!startDateInput || !lengthInput || !applyButton) {
    return;
  }

  startDateInput.value = tripSettings.startDate;
  lengthInput.value = String(tripSettings.lengthDays);
  updatePresetSelection(presetButtons, tripSettings.lengthDays);
  populateDestinationSyncSelect(destinationSelect);

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

    tripRangeSourceLabel = 'Using custom trip settings.';
    saveTripSettings();
    applyTripRangeToCalendar();
    updatePresetSelection(presetButtons, nextLength);
    updateTripRangeSourceText();
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

  if (syncButton) {
    syncButton.addEventListener('click', () => {
      populateDestinationSyncSelect(destinationSelect);
      const selectedDestinationId = destinationSelect ? destinationSelect.value : '';
      const syncedDestination = syncTripSettingsFromDestination(selectedDestinationId);
      if (!syncedDestination) {
        alert('No destination dates were found to sync yet. Add a destination with dates first.');
        return;
      }

      if (destinationSelect && syncedDestination.id != null) {
        destinationSelect.value = String(syncedDestination.id);
      }

      startDateInput.value = tripSettings.startDate;
      lengthInput.value = String(tripSettings.lengthDays);
      updatePresetSelection(presetButtons, tripSettings.lengthDays);
      applyTripRangeToCalendar();
      updateTripRangeSourceText();
    });
  }
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

function getDestinations() {
  try {
    const stored = JSON.parse(localStorage.getItem(DESTINATIONS_KEY)) || [];
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}

function getPrimaryDestination(destinations) {
  if (destinations.length === 0) {
    return null;
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const upcoming = destinations
    .filter((destination) => destination.startDate)
    .map((destination) => ({
      destination,
      timestamp: new Date(`${destination.startDate}T00:00:00`).getTime()
    }))
    .filter((entry) => !Number.isNaN(entry.timestamp) && entry.timestamp >= todayStart)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (upcoming.length > 0) {
    return upcoming[0].destination;
  }

  return destinations[destinations.length - 1];
}

function getDestinationForSync(destinations, selectedDestinationId) {
  if (selectedDestinationId) {
    const selected = destinations.find((destination) => String(destination.id) === String(selectedDestinationId));
    if (selected) {
      return selected;
    }
  }

  return getPrimaryDestination(destinations);
}

function getDestinationOptionLabel(destination) {
  const baseName = destination.name || 'Untitled destination';
  const hasStart = Boolean(destination.startDate);
  const hasEnd = Boolean(destination.endDate);

  if (!hasStart && !hasEnd) {
    return baseName;
  }

  const startLabel = hasStart ? new Date(destination.startDate).toLocaleDateString() : 'Unknown start';
  const endLabel = hasEnd ? new Date(destination.endDate).toLocaleDateString() : 'Unknown end';
  return `${baseName} (${startLabel} to ${endLabel})`;
}

function populateDestinationSyncSelect(selectElement) {
  if (!selectElement) {
    return;
  }

  const destinations = getDestinations();
  const previousValue = selectElement.value;
  selectElement.innerHTML = '';

  if (destinations.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No destinations available';
    selectElement.appendChild(option);
    selectElement.disabled = true;
    return;
  }

  destinations.forEach((destination) => {
    const option = document.createElement('option');
    option.value = String(destination.id);
    option.textContent = getDestinationOptionLabel(destination);
    selectElement.appendChild(option);
  });

  const defaultDestination = getDestinationForSync(destinations, previousValue);
  if (defaultDestination && defaultDestination.id != null) {
    selectElement.value = String(defaultDestination.id);
  }

  selectElement.disabled = destinations.length <= 1;
}

function getTripSettingsFromDestination(destination) {
  if (!destination || !destination.startDate) {
    return null;
  }

  let lengthDays = 1;
  if (destination.endDate) {
    const start = new Date(`${destination.startDate}T00:00:00`);
    const end = new Date(`${destination.endDate}T00:00:00`);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

    if (!Number.isNaN(diffDays) && diffDays > 0) {
      lengthDays = Math.min(diffDays, 365);
    }
  }

  return {
    startDate: destination.startDate,
    lengthDays
  };
}

function syncTripSettingsFromDestination(selectedDestinationId) {
  const destinations = getDestinations();
  const destination = getDestinationForSync(destinations, selectedDestinationId);
  const syncedSettings = getTripSettingsFromDestination(destination);

  if (!syncedSettings) {
    return null;
  }

  tripSettings = syncedSettings;
  tripRangeSourceLabel = `Synced from destination: ${destination.name}`;
  saveTripSettings();
  return destination;
}

function updateTripRangeSourceText() {
  const sourceText = document.getElementById('tripRangeSourceText');
  if (!sourceText) {
    return;
  }

  sourceText.textContent = tripRangeSourceLabel;
}

function getActivityDateOnly(activityDateTime) {
  return String(activityDateTime).split('T')[0];
}

function formatDayViewDateLabel(dateValue) {
  if (!dateValue) {
    return 'No date selected';
  }

  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function renderDayView(selectedDate) {
  const dayViewList = document.getElementById('dayViewList');
  const summaryText = document.getElementById('dayViewSummaryText');

  if (!dayViewList || !summaryText || !selectedDate) {
    return;
  }

  dayViewList.innerHTML = '';

  const dayActivities = activities
    .filter((activity) => getActivityDateOnly(activity.date) === selectedDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dayLabel = formatDayViewDateLabel(selectedDate);

  if (dayActivities.length === 0) {
    summaryText.textContent = `No activities planned for ${dayLabel}.`;
    return;
  }

  summaryText.textContent = `${dayActivities.length} activit${dayActivities.length === 1 ? 'y' : 'ies'} planned for ${dayLabel}.`;

  dayActivities.forEach((activity) => {
    const li = document.createElement('li');
    li.className = 'day-view-item';

    const timeLabel = new Date(activity.date).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });

    const addressLine = activity.address ? `<span class="activity-address">Address: ${activity.address}</span>` : '';
    li.innerHTML = `<div class="day-view-main"><strong>${timeLabel}</strong> - ${activity.title}</div>${addressLine}`;
    dayViewList.appendChild(li);
  });
}

function refreshDayView() {
  const dayViewDateInput = document.getElementById('dayViewDateInput');
  if (!dayViewDateInput || !dayViewDateInput.value) {
    return;
  }

  renderDayView(dayViewDateInput.value);
}

function shiftDateByDays(dateValue, deltaDays) {
  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return getTodayInputDate();
  }

  parsed.setDate(parsed.getDate() + deltaDays);
  return parsed.toISOString().slice(0, 10);
}

function initializeDayViewControls() {
  const dayViewDateInput = document.getElementById('dayViewDateInput');
  const dayViewTodayBtn = document.getElementById('dayViewTodayBtn');
  const dayViewPrevBtn = document.getElementById('dayViewPrevBtn');
  const dayViewNextBtn = document.getElementById('dayViewNextBtn');

  if (!dayViewDateInput || !dayViewTodayBtn || !dayViewPrevBtn || !dayViewNextBtn) {
    return;
  }

  const initialDate = tripSettings.startDate || getTodayInputDate();
  dayViewDateInput.value = initialDate;

  dayViewDateInput.addEventListener('change', () => {
    renderDayView(dayViewDateInput.value);
  });

  dayViewTodayBtn.addEventListener('click', () => {
    dayViewDateInput.value = getTodayInputDate();
    renderDayView(dayViewDateInput.value);
  });

  dayViewPrevBtn.addEventListener('click', () => {
    dayViewDateInput.value = shiftDateByDays(dayViewDateInput.value || getTodayInputDate(), -1);
    renderDayView(dayViewDateInput.value);
  });

  dayViewNextBtn.addEventListener('click', () => {
    dayViewDateInput.value = shiftDateByDays(dayViewDateInput.value || getTodayInputDate(), 1);
    renderDayView(dayViewDateInput.value);
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
      title: getCalendarEventTitle(a),
      start: a.date,
      id: a.id,
      backgroundColor: '#3498db',
      borderColor: '#2980b9'
    }))
  });
  calendar.render();
}