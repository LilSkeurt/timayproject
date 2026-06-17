/* ==========================================================================
   script.js — Interactions (multi-pages, défensif).
   Sélection de services / offres, formulaire de devis, et report de l'intention
   d'une page à l'autre via sessionStorage (quote_prefill).
   ========================================================================== */

(function () {
  const QUOTE_PAGE = "contact.html";
  const OFFERS_PAGE = "offres.html";

  function goTo(url) {
    if (window.AtelierTransition && typeof window.AtelierTransition.warpTo === "function") {
      window.AtelierTransition.warpTo(url);
    } else {
      window.location.href = url;
    }
  }

  function getPrefill() {
    try { return JSON.parse(sessionStorage.getItem("quote_prefill") || "{}"); }
    catch (error) { return {}; }
  }
  function setPrefill(patch) {
    try { sessionStorage.setItem("quote_prefill", JSON.stringify(Object.assign(getPrefill(), patch))); }
    catch (error) { /* noop */ }
  }
  function clearPrefill() {
    try { sessionStorage.removeItem("quote_prefill"); } catch (error) { /* noop */ }
  }

  const quoteForm = document.querySelector("#quote-form");
  const projectSelect = document.querySelector("#project-type");
  const serviceSelect = document.querySelector("#service-choice");
  const messageInput = document.querySelector("#message");
  const feedback = document.querySelector("#form-feedback");
  const offerCards = Array.from(document.querySelectorAll("[data-offer-card]"));
  const serviceCards = Array.from(document.querySelectorAll("[data-service-card]"));
  const serviceOrbit = document.querySelector(".service-orbit");
  const serviceOrbs = Array.from(document.querySelectorAll("[data-service-orb]"));
  const serviceDetailTitle = document.querySelector("#service-detail-title");
  const serviceDetailSummary = document.querySelector("#service-detail-summary");
  const serviceDetailPlan = document.querySelector("#service-detail-plan");
  const serviceToQuoteButton = document.querySelector("[data-service-to-quote]");
  let selectedServiceMessage = serviceCards[0]?.dataset.serviceMessage || "";
  let selectedServiceTitle = serviceCards[0]?.dataset.serviceTitle || "";

  function selectOfferCard(projectName) {
    offerCards.forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.offerCard === projectName);
    });
  }

  function selectServiceCard(selectedCard) {
    serviceCards.forEach((card) => {
      const isSelected = card === selectedCard;
      card.classList.toggle("is-active", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
      const status = card.querySelector(".service-status");
      if (status) status.textContent = isSelected ? "Sélectionné" : "Ajouter au devis";
    });

    serviceOrbs.forEach((orb) => {
      const isSelected = orb.dataset.serviceOrb === selectedCard.dataset.serviceTitle;
      orb.classList.toggle("is-active", isSelected);
      orb.setAttribute("aria-pressed", String(isSelected));
    });

    if (serviceDetailTitle) serviceDetailTitle.textContent = selectedCard.dataset.serviceTitle;
    if (serviceDetailSummary) serviceDetailSummary.textContent = selectedCard.dataset.serviceSummary;
    if (serviceDetailPlan) serviceDetailPlan.textContent = selectedCard.dataset.servicePlan;
    selectedServiceMessage = selectedCard.dataset.serviceMessage || "";
    selectedServiceTitle = selectedCard.dataset.serviceTitle || "";
    if (serviceSelect) serviceSelect.value = selectedCard.dataset.serviceTitle;
  }

  /* --- Déclencheurs de navigation inter-pages --- */
  document.querySelectorAll("[data-scroll='devis']").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (trigger.dataset.project) setPrefill({ project: trigger.dataset.project });
      goTo(QUOTE_PAGE);
    });
  });

  document.querySelectorAll("[data-scroll='offres']").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      goTo(OFFERS_PAGE);
    });
  });

  document.querySelectorAll("[data-offer]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setPrefill({ project: button.dataset.offer });
      goTo(QUOTE_PAGE);
    });
  });

  /* --- Services --- */
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

  if (serviceToQuoteButton) {
    serviceToQuoteButton.addEventListener("click", () => {
      setPrefill({ service: selectedServiceTitle, serviceMessage: selectedServiceMessage });
      goTo(QUOTE_PAGE);
    });
  }

  if (serviceSelect) {
    serviceSelect.addEventListener("change", () => {
      const matchingCard = serviceCards.find((card) => card.dataset.serviceTitle === serviceSelect.value);
      if (matchingCard) selectServiceCard(matchingCard);
    });
  }

  if (projectSelect) {
    projectSelect.addEventListener("change", () => selectOfferCard(projectSelect.value));
  }

  /* --- Inspirations sélectionnées (cross-page via sessionStorage) --- */
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

  /* --- Page contact : applique l'intention reportée + soumission --- */
  if (quoteForm) {
    const prefill = getPrefill();

    if (prefill.project && projectSelect) {
      const opt = Array.from(projectSelect.options).find((o) => o.value === prefill.project || o.text === prefill.project);
      if (opt) projectSelect.value = opt.value;
    }
    if (prefill.service && serviceSelect) {
      const opt = Array.from(serviceSelect.options).find((o) => o.value === prefill.service || o.text === prefill.service);
      if (opt) serviceSelect.value = opt.value;
    }
    if (prefill.serviceMessage && messageInput && !messageInput.value.includes(prefill.serviceMessage)) {
      messageInput.value = messageInput.value
        ? `${messageInput.value.trim()}\n${prefill.serviceMessage}`
        : prefill.serviceMessage;
    }
    clearPrefill();

    quoteForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
      }

      const submitBtn = quoteForm.querySelector(".form-submit");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector("span")?.style && (submitBtn.querySelector("span").textContent = "Envoi en cours…");
      }

      const formData = new FormData(quoteForm);
      const name = formData.get("name");
      const phone = formData.get("phone");
      const project = formData.get("project-type");
      const service = formData.get("service-choice");
      const timing = formData.get("timing");
      const business = formData.get("business") || "";
      const message = formData.get("message") || "";

      // Préparation du payload Web3Forms.
      // Remplacez la valeur de "access_key" par votre clé obtenue sur web3forms.com
      const payload = {
        access_key: "VOTRE_CLE_WEB3FORMS",
        subject: `Nouveau devis Atelier Vitrine — ${name}`,
        from_name: "Atelier Vitrine",
        name,
        phone,
        business,
        project,
        service,
        timing,
        message,
      };

      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (json.success) {
          if (feedback) {
            feedback.classList.add("is-visible", "is-success");
            feedback.textContent = `Merci ${name} ! Votre demande a bien été envoyée. Timothé vous rappellera au ${phone} pour préciser le devis.`;
          }
          quoteForm.reset();
          clearPrefill();
        } else {
          throw new Error(json.message || "Erreur inconnue");
        }
      } catch (err) {
        if (feedback) {
          feedback.classList.add("is-visible", "is-error");
          feedback.textContent = "Une erreur s'est produite lors de l'envoi. Contactez Timothé directement au 06 37 69 66 82 ou par mail.";
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.querySelector("span").textContent = "Préparer votre devis gratuit";
        }
      }
    });
  }
})();
