function addItinerary() {
  let input = document.getElementById("itineraryInput");
  let li = document.createElement("li");
  li.textContent = input.value;

  li.onclick = () => li.remove();

  document.getElementById("itineraryList").appendChild(li);
  input.value = "";
}

function addPacking() {
  let input = document.getElementById("packingInput");
  let li = document.createElement("li");
  li.textContent = input.value;

  li.onclick = () => li.remove();

  document.getElementById("packingList").appendChild(li);
  input.value = "";
}