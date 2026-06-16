const quoteSection = document.querySelector("#devis");
const quoteForm = document.querySelector("#quote-form");
const nameInput = document.querySelector("#name");
const projectSelect = document.querySelector("#project-type");
const serviceSelect = document.querySelector("#service-choice");
const messageInput = document.querySelector("#message");
const feedback = document.querySelector("#form-feedback");
const offersSection = document.querySelector("#offres");
const offerCards = Array.from(document.querySelectorAll("[data-offer-card]"));
const serviceCards = Array.from(document.querySelectorAll("[data-service-card]"));
const serviceOrbit = document.querySelector(".service-orbit");
const serviceOrbs = Array.from(document.querySelectorAll("[data-service-orb]"));
const serviceDetailTitle = document.querySelector("#service-detail-title");
const serviceDetailSummary = document.querySelector("#service-detail-summary");
const serviceDetailPlan = document.querySelector("#service-detail-plan");
const serviceToQuoteButton = document.querySelector("[data-service-to-quote]");
let selectedServiceMessage = serviceCards[0]?.dataset.serviceMessage || "";

function selectOfferCard(projectName) {
  offerCards.forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.offerCard === projectName);
  });
}

function scrollToQuote(projectName) {
  if (projectName && projectSelect) {
    projectSelect.value = projectName;
    selectOfferCard(projectName);
  }

  quoteSection.scrollIntoView({ behavior: "smooth", block: "start" });
  quoteForm.classList.remove("is-attention");
  window.setTimeout(() => quoteForm.classList.add("is-attention"), 80);
  window.setTimeout(() => nameInput.focus({ preventScroll: true }), 650);
}

function selectServiceCard(selectedCard) {
  serviceCards.forEach((card) => {
    const isSelected = card === selectedCard;
    card.classList.toggle("is-active", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
    card.querySelector(".service-status").textContent = isSelected ? "Sélectionné" : "Ajouter au devis";
  });

  serviceOrbs.forEach((orb) => {
    const isSelected = orb.dataset.serviceOrb === selectedCard.dataset.serviceTitle;
    orb.classList.toggle("is-active", isSelected);
    orb.setAttribute("aria-pressed", String(isSelected));
  });

  serviceDetailTitle.textContent = selectedCard.dataset.serviceTitle;
  serviceDetailSummary.textContent = selectedCard.dataset.serviceSummary;
  serviceDetailPlan.textContent = selectedCard.dataset.servicePlan;
  selectedServiceMessage = selectedCard.dataset.serviceMessage;

  if (serviceSelect) {
    serviceSelect.value = selectedCard.dataset.serviceTitle;
  }
}

function addSelectedServiceToQuote() {
  if (messageInput && selectedServiceMessage && !messageInput.value.includes(selectedServiceMessage)) {
    messageInput.value = messageInput.value
      ? `${messageInput.value.trim()}\n${selectedServiceMessage}`
      : selectedServiceMessage;
  }

  scrollToQuote(projectSelect?.value);
}

document.querySelectorAll("[data-scroll='devis']").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    scrollToQuote(trigger.dataset.project);
  });
});

document.querySelectorAll("[data-scroll='offres']").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    offersSection.scrollIntoView({ behavior: "smooth", block: "start" });
    offersSection.classList.add("is-highlighted");
    window.setTimeout(() => offersSection.classList.remove("is-highlighted"), 900);
  });
});

document.querySelectorAll("[data-offer]").forEach((button) => {
  button.addEventListener("click", () => scrollToQuote(button.dataset.offer));
});

serviceCards.forEach((card) => {
  card.addEventListener("click", () => selectServiceCard(card));

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectServiceCard(card);
    }
  });

  card.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${(x * 9).toFixed(2)}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  });
});

serviceOrbs.forEach((orb) => {
  orb.setAttribute("aria-pressed", String(orb.classList.contains("is-active")));

  orb.addEventListener("click", () => {
    const matchingCard = serviceCards.find((card) => card.dataset.serviceTitle === orb.dataset.serviceOrb);
    if (matchingCard) selectServiceCard(matchingCard);
  });

  orb.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const rect = orb.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    orb.style.setProperty("--orb-shift-x", `${(x * 10).toFixed(2)}px`);
    orb.style.setProperty("--orb-shift-y", `${(y * 10).toFixed(2)}px`);
  });

  orb.addEventListener("pointerleave", () => {
    orb.style.setProperty("--orb-shift-x", "0px");
    orb.style.setProperty("--orb-shift-y", "0px");
  });
});

if (serviceOrbit) {
  serviceOrbit.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const rect = serviceOrbit.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    serviceOrbit.style.setProperty("--orbit-rotate-x", `${(-y * 5).toFixed(2)}deg`);
    serviceOrbit.style.setProperty("--orbit-rotate-y", `${(x * 6).toFixed(2)}deg`);
  });

  serviceOrbit.addEventListener("pointerleave", () => {
    serviceOrbit.style.setProperty("--orbit-rotate-x", "0deg");
    serviceOrbit.style.setProperty("--orbit-rotate-y", "0deg");
  });
}

serviceToQuoteButton.addEventListener("click", addSelectedServiceToQuote);

serviceSelect.addEventListener("change", () => {
  const matchingCard = serviceCards.find((card) => card.dataset.serviceTitle === serviceSelect.value);
  if (matchingCard) selectServiceCard(matchingCard);
});

projectSelect.addEventListener("change", () => {
  selectOfferCard(projectSelect.value);
});

window.addEventListener("inspirations-changed", (event) => {
  const selected = event.detail || [];
  const tagsRow = document.getElementById("selected-inspirations-row");
  const tagsList = document.getElementById("inspiration-tags-list");

  if (!tagsRow || !tagsList) return;

  tagsRow.style.display = selected.length ? "grid" : "none";
  tagsList.innerHTML = selected
    .map((name) => (
      `<span class="inspiration-tag" data-name="${name}">
        <span>${name}</span>
        <button class="inspiration-tag-remove" type="button" aria-label="Retirer ${name}">×</button>
      </span>`
    ))
    .join("");

  tagsList.querySelectorAll(".inspiration-tag-remove").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.closest(".inspiration-tag").dataset.name;
      window.dispatchEvent(new CustomEvent("remove-inspiration", { detail: name }));
    });
  });

  const prefix = "[Inspirations de site sélectionnées : ";
  const regex = /\[Inspirations de site sélectionnées : [^\]]*\]\n?/;
  const inspirationText = selected.length ? `${prefix}${selected.join(", ")}]\n` : "";

  if (!messageInput) return;

  if (regex.test(messageInput.value)) {
    messageInput.value = messageInput.value.replace(regex, inspirationText);
  } else if (inspirationText) {
    messageInput.value = inspirationText + messageInput.value;
  }
});

quoteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!quoteForm.checkValidity()) {
    quoteForm.reportValidity();
    return;
  }

  const formData = new FormData(quoteForm);
  const name = formData.get("name");
  const phone = formData.get("phone");
  const project = formData.get("project-type");
  const service = formData.get("service-choice");
  const timing = formData.get("timing");

  feedback.classList.add("is-visible");
  feedback.textContent = `Merci ${name}. Votre demande pour "${project}" avec priorité "${service}" est prête. Timothé Bonneau pourra vous rappeler au ${phone} pour préciser le devis, idéalement "${timing.toLowerCase()}".`;
});
