// itinerary.js

let activities = JSON.parse(localStorage.getItem('itineraryActivities')) || [];
const TRIP_SETTINGS_KEY = 'itineraryTripSettings';
const DESTINATIONS_KEY = 'itineraryDestinations';
const DEFAULT_TRIP_RANGE_LABEL = 'Select a destination, then click Use Destination Dates.';
let tripSettings = getTripSettings();
let tripRangeSourceLabel = DEFAULT_TRIP_RANGE_LABEL;
let calendar;
let activeMapChoicePopover;
let mapChoicePopoverCleanup;

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
  calendar.addEvent(createCalendarEventData(activity));

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
  const escapedTitle = escapeHtml(activity.title);
  const addressDetails = getAddressDetailsMarkup(activity.address);
  li.innerHTML = `${escapedTitle} - <strong>${dateStr}</strong>${addressDetails}
                  <button onclick="deleteActivity(${activity.id})">Delete</button>`;
  activityList.appendChild(li);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getGoogleMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function getAppleMapsUrl(address) {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
}

function getAddressDetailsMarkup(address) {
  const trimmedAddress = address ? address.trim() : '';
  if (!trimmedAddress) {
    return '';
  }

  const safeAddress = escapeHtml(trimmedAddress);
  const googleMapsUrl = getGoogleMapsUrl(trimmedAddress);
  const appleMapsUrl = getAppleMapsUrl(trimmedAddress);
  return `<br><span class="activity-address">Address: ${safeAddress}</span>
          <span class="activity-map-links">
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer">Google Maps</a>
            <a href="${appleMapsUrl}" target="_blank" rel="noopener noreferrer">Apple Maps</a>
          </span>`;
}

function getCalendarEventTitle(activity) {
  if (activity.address) {
    return `${activity.title} (${activity.address})`;
  }

  return activity.title;
}

function createCalendarEventData(activity) {
  return {
    title: getCalendarEventTitle(activity),
    start: activity.date,
    id: activity.id,
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
    extendedProps: {
      activityTitle: activity.title,
      address: activity.address || ''
    }
  };
}

function formatActivityDateTime(dateValue) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date/time';
  }

  return parsed.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getCalendarTooltipMarkup(event) {
  const activityTitle = event.extendedProps.activityTitle || event.title || 'Untitled activity';
  const whenLabel = formatActivityDateTime(event.start);
  const address = event.extendedProps.address ? event.extendedProps.address : 'Not provided';
  const mapHint = event.extendedProps.address ? '<div class="calendar-tooltip-line"><em>Click event to choose a map app.</em></div>' : '';

  return `
    <div class="calendar-tooltip-title">${escapeHtml(activityTitle)}</div>
    <div class="calendar-tooltip-line"><strong>When:</strong> ${whenLabel}</div>
    <div class="calendar-tooltip-line"><strong>Address:</strong> ${escapeHtml(address)}</div>
    ${mapHint}
  `;
}

function closeMapChoicePopover() {
  if (mapChoicePopoverCleanup) {
    mapChoicePopoverCleanup();
    mapChoicePopoverCleanup = null;
  }

  if (activeMapChoicePopover && activeMapChoicePopover.parentElement) {
    activeMapChoicePopover.parentElement.removeChild(activeMapChoicePopover);
  }
  activeMapChoicePopover = null;
}

function positionMapChoicePopover(popover, clickEvent) {
  const margin = 12;
  const sourceX = clickEvent ? clickEvent.clientX : Math.round(window.innerWidth / 2);
  const sourceY = clickEvent ? clickEvent.clientY : Math.round(window.innerHeight / 2);
  const offsetX = 12;
  const offsetY = 12;

  const popoverRect = popover.getBoundingClientRect();
  let left = sourceX + offsetX;
  let top = sourceY + offsetY;

  const maxLeft = window.innerWidth - popoverRect.width - margin;
  const maxTop = window.innerHeight - popoverRect.height - margin;
  left = Math.max(margin, Math.min(left, maxLeft));
  top = Math.max(margin, Math.min(top, maxTop));

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
}

function openActivityAddressInMaps(address, clickEvent) {
  if (!address) {
    return;
  }

  closeMapChoicePopover();

  const popover = document.createElement('div');
  popover.className = 'map-choice-popover';
  popover.innerHTML = `
    <p class="map-choice-title">Open address in:</p>
    <div class="map-choice-actions">
      <button type="button" class="map-choice-btn" data-map="google">Google Maps</button>
      <button type="button" class="map-choice-btn" data-map="apple">Apple Maps</button>
      <button type="button" class="map-choice-btn map-choice-cancel" data-map="cancel">Cancel</button>
    </div>
  `;

  document.body.appendChild(popover);
  positionMapChoicePopover(popover, clickEvent);
  activeMapChoicePopover = popover;

  popover.querySelectorAll('.map-choice-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const mapType = button.getAttribute('data-map');

      if (mapType === 'google') {
        window.open(getGoogleMapsUrl(address), '_blank', 'noopener,noreferrer');
      } else if (mapType === 'apple') {
        window.open(getAppleMapsUrl(address), '_blank', 'noopener,noreferrer');
      }

      closeMapChoicePopover();
    });
  });

  const handleOutsideClick = (event) => {
    if (activeMapChoicePopover && !activeMapChoicePopover.contains(event.target)) {
      closeMapChoicePopover();
    }
  };

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      closeMapChoicePopover();
    }
  };

  const handleResize = () => {
    closeMapChoicePopover();
  };

  window.setTimeout(() => {
    document.addEventListener('mousedown', handleOutsideClick);
  }, 0);
  document.addEventListener('keydown', handleEscape);
  window.addEventListener('resize', handleResize);

  mapChoicePopoverCleanup = () => {
    document.removeEventListener('mousedown', handleOutsideClick);
    document.removeEventListener('keydown', handleEscape);
    window.removeEventListener('resize', handleResize);
  };
}

function positionCalendarTooltip(tooltip, pageX, pageY) {
  const offsetX = 14;
  const offsetY = 14;
  tooltip.style.left = `${pageX + offsetX}px`;
  tooltip.style.top = `${pageY + offsetY}px`;
}

function attachCalendarHoverTooltip(info) {
  const tooltip = document.createElement('div');
  tooltip.className = 'calendar-hover-tooltip';
  tooltip.innerHTML = getCalendarTooltipMarkup(info.event);
  document.body.appendChild(tooltip);

  const handleMouseMove = (event) => {
    positionCalendarTooltip(tooltip, event.pageX, event.pageY);
  };

  const handleMouseLeave = () => {
    info.el.removeEventListener('mousemove', handleMouseMove);
    info.el.removeEventListener('mouseleave', handleMouseLeave);
    if (tooltip.parentElement) {
      tooltip.parentElement.removeChild(tooltip);
    }
  };

  info.el.addEventListener('mousemove', handleMouseMove);
  info.el.addEventListener('mouseleave', handleMouseLeave);
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
  const destinationSelect = document.getElementById('destinationSyncSelect');
  const syncButton = document.getElementById('syncDestinationDatesBtn');
  const quickDestinationTitle = document.getElementById('quickDestinationTitle');
  const quickDestinationWrap = document.getElementById('quickDestinationWrap');
  const quickDestinationNameInput = document.getElementById('quickDestinationNameInput');
  const quickDestinationStartInput = document.getElementById('quickDestinationStartInput');
  const quickDestinationEndInput = document.getElementById('quickDestinationEndInput');
  const quickAddDestinationBtn = document.getElementById('quickAddDestinationBtn');

  if (!destinationSelect || !syncButton) {
    return;
  }

  if (quickDestinationStartInput) {
    quickDestinationStartInput.value = tripSettings.startDate;
  }
  if (quickDestinationEndInput) {
    quickDestinationEndInput.value = getTripRange(tripSettings.startDate, tripSettings.lengthDays).end;
  }

  populateDestinationSyncSelect(destinationSelect, quickDestinationWrap, quickDestinationTitle);

  if (syncButton) {
    syncButton.addEventListener('click', () => {
      populateDestinationSyncSelect(destinationSelect, quickDestinationWrap, quickDestinationTitle);
      const selectedDestinationId = destinationSelect ? destinationSelect.value : '';
      const syncedDestination = syncTripSettingsFromDestination(selectedDestinationId);
      if (!syncedDestination) {
        alert('No destination dates found yet. Add a destination below, then try again.');
        return;
      }

      if (destinationSelect && syncedDestination.id != null) {
        destinationSelect.value = String(syncedDestination.id);
      }

      applyTripRangeToCalendar();
      updateTripRangeSourceText();

      if (quickDestinationStartInput) {
        quickDestinationStartInput.value = tripSettings.startDate;
      }
      if (quickDestinationEndInput) {
        quickDestinationEndInput.value = getTripRange(tripSettings.startDate, tripSettings.lengthDays).end;
      }
    });
  }

  if (quickAddDestinationBtn && quickDestinationNameInput && quickDestinationStartInput && quickDestinationEndInput) {
    quickAddDestinationBtn.addEventListener('click', () => {
      const name = quickDestinationNameInput.value.trim();
      const startDate = quickDestinationStartInput.value;
      const endDate = quickDestinationEndInput.value;

      if (!name || !startDate || !endDate) {
        alert('Please enter destination name, start date, and end date.');
        return;
      }

      if (new Date(endDate) < new Date(startDate)) {
        alert('End date must be on or after the start date.');
        return;
      }

      const destination = saveDestination({ name, startDate, endDate });
      quickDestinationNameInput.value = '';
      populateDestinationSyncSelect(destinationSelect, quickDestinationWrap, quickDestinationTitle);

      if (destinationSelect) {
        destinationSelect.value = String(destination.id);
      }

      tripRangeSourceLabel = `Added destination: ${destination.name}`;
      updateTripRangeSourceText();
    });
  }
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

function populateDestinationSyncSelect(selectElement, quickDestinationWrap, quickDestinationTitle) {
  if (!selectElement) {
    return;
  }

  const destinations = getDestinations();
  const previousValue = selectElement.value;
  selectElement.innerHTML = '';

  if (destinations.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No destinations yet';
    selectElement.appendChild(option);
    selectElement.disabled = true;
    if (quickDestinationWrap) {
      quickDestinationWrap.classList.remove('hidden');
    }
    if (quickDestinationTitle) {
      quickDestinationTitle.classList.remove('hidden');
    }
    return;
  }

  if (quickDestinationWrap) {
    quickDestinationWrap.classList.add('hidden');
  }
  if (quickDestinationTitle) {
    quickDestinationTitle.classList.add('hidden');
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

function saveDestination(destinationInput) {
  const destinations = getDestinations();
  const destination = {
    id: Date.now(),
    name: destinationInput.name,
    startDate: destinationInput.startDate,
    endDate: destinationInput.endDate
  };

  destinations.push(destination);
  localStorage.setItem(DESTINATIONS_KEY, JSON.stringify(destinations));
  return destination;
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

  if (tripRangeSourceLabel === DEFAULT_TRIP_RANGE_LABEL) {
    sourceText.innerHTML = '<strong>Select a destination</strong>, <strong>then click Use Destination Dates</strong>.';
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

    const safeTitle = escapeHtml(activity.title);
    const addressLine = getAddressDetailsMarkup(activity.address);
    li.innerHTML = `<div class="day-view-main"><strong>${timeLabel}</strong> - ${safeTitle}</div>${addressLine}`;
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
    events: activities.map(createCalendarEventData),
    eventDidMount: function(info) {
      info.el.addEventListener('mouseenter', () => {
        attachCalendarHoverTooltip(info);
      });
    },
    eventClick: function(info) {
      const eventAddress = info.event.extendedProps.address;
      if (!eventAddress) {
        return;
      }

      info.jsEvent.preventDefault();
      openActivityAddressInMaps(eventAddress, info.jsEvent);
    }
  });
  calendar.render();
}