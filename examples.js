const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const exampleCards = Array.from(document.querySelectorAll("[data-example-card]"));
const exampleDetailTitle = document.querySelector("#example-detail-title");
const exampleDetailSummary = document.querySelector("#example-detail-summary");
const exampleDetailPlan = document.querySelector("#example-detail-plan");
const exampleDetailAction = document.querySelector("#example-detail-action");
let selectedExampleCard = exampleCards[0] || null;

function getSelectedInspirations() {
  return JSON.parse(sessionStorage.getItem("selected_inspirations") || "[]");
}

function setSelectedInspirations(list) {
  sessionStorage.setItem("selected_inspirations", JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("inspirations-changed", { detail: list }));
}

function showToast(message) {
  let toast = document.querySelector(".toast-notification");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-notification";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function updateExampleDetail(card) {
  if (!card) return;

  selectedExampleCard = card;

  if (!exampleDetailTitle || !exampleDetailSummary || !exampleDetailPlan || !exampleDetailAction) {
    return;
  }

  const title = card.querySelector("h3").textContent.trim();
  const summary = card.querySelector(".example-content p").textContent.trim();
  const tag = card.querySelector(".example-tag").textContent.trim();
  const selected = getSelectedInspirations();

  exampleDetailTitle.textContent = title;
  exampleDetailSummary.textContent = summary;
  exampleDetailPlan.textContent = `Style : ${tag}`;
  exampleDetailAction.querySelector("span").textContent = selected.includes(title)
    ? "Retirer des inspirations"
    : "Ajouter aux inspirations";
}

function toggleExample(card) {
  const title = card.querySelector("h3").textContent.trim();
  const selected = getSelectedInspirations();
  const index = selected.indexOf(title);

  if (index >= 0) {
    selected.splice(index, 1);
    card.classList.remove("is-selected");
    showToast(`"${title}" retiré des inspirations.`);
  } else {
    selected.push(title);
    card.classList.add("is-selected");
    showToast(`"${title}" ajouté aux inspirations.`);
  }

  setSelectedInspirations(selected);
  updateExampleDetail(card);
}

function filterExamples(category) {
  exampleCards.forEach((card) => {
    const categories = card.dataset.category.split(" ");
    const shouldShow = category === "all" || categories.includes(category);
    card.classList.toggle("is-hidden", !shouldShow);
  });

  const firstVisible = exampleCards.find((card) => !card.classList.contains("is-hidden"));
  updateExampleDetail(firstVisible);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    filterExamples(button.dataset.filter);
  });
});

exampleCards.forEach((card) => {
  if (!card.querySelector(".example-select-badge")) {
    const badge = document.createElement("div");
    badge.className = "example-select-badge";
    card.appendChild(badge);
  }

  card.addEventListener("click", () => {
    updateExampleDetail(card);
    toggleExample(card);
  });

  card.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--example-tilt-x", `${(-y * 7).toFixed(2)}deg`);
    card.style.setProperty("--example-tilt-y", `${(x * 8).toFixed(2)}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--example-tilt-x", "0deg");
    card.style.setProperty("--example-tilt-y", "0deg");
  });
});

exampleDetailAction?.addEventListener("click", () => {
  if (selectedExampleCard) toggleExample(selectedExampleCard);
});

window.addEventListener("remove-inspiration", (event) => {
  const name = event.detail;
  const selected = getSelectedInspirations().filter((item) => item !== name);
  const card = exampleCards.find((item) => item.querySelector("h3").textContent.trim() === name);

  card?.classList.remove("is-selected");
  setSelectedInspirations(selected);
  showToast(`"${name}" retiré des inspirations.`);
  updateExampleDetail(selectedExampleCard);
});

const initialSelected = getSelectedInspirations();
exampleCards.forEach((card) => {
  const title = card.querySelector("h3").textContent.trim();
  card.classList.toggle("is-selected", initialSelected.includes(title));
});
setSelectedInspirations(initialSelected);
updateExampleDetail(selectedExampleCard);
