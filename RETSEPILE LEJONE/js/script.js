/* Explore Lesotho - shared JavaScript
   Features: persistent theme, destination search/filter, gallery lightbox,
   contact validation, booking validation/calculator and localStorage. */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Footer year is updated automatically.
  document.querySelectorAll(".current-year").forEach(el => el.textContent = new Date().getFullYear());

  // Feature 1: Dark/light theme saved with Local Storage (advanced feature).
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("exploreLesothoTheme");
  if (savedTheme === "dark") document.body.classList.add("dark-mode");
  const updateThemeLabel = () => {
    if (themeToggle) themeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀ Light" : "☾ Theme";
  };
  updateThemeLabel();
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("exploreLesothoTheme", document.body.classList.contains("dark-mode") ? "dark" : "light");
      updateThemeLabel();
    });
  }

  // Feature 2: live search and category filtering with DOM manipulation.
  const searchInput = document.getElementById("destinationSearch");
  const filterInput = document.getElementById("destinationFilter");
  const clearFilters = document.getElementById("clearFilters");
  const destinationItems = [...document.querySelectorAll(".destination-item")];
  const destinationCount = document.getElementById("destinationCount");
  const noDestinations = document.getElementById("noDestinations");
  function filterDestinations() {
    if (!destinationItems.length) return;
    const term = (searchInput?.value || "").trim().toLowerCase();
    const category = filterInput?.value || "all";
    let visible = 0;
    destinationItems.forEach(item => {
      const matchesText = (item.dataset.search + " " + item.textContent).toLowerCase().includes(term);
      const categories = (item.dataset.category || "").split(/\s+/);
      const matchesCategory = category === "all" || categories.includes(category);
      const show = matchesText && matchesCategory;
      item.classList.toggle("d-none", !show);
      if (show) visible++;
    });
    if (destinationCount) destinationCount.textContent = `Showing ${visible} of ${destinationItems.length} destinations`;
    if (noDestinations) noDestinations.classList.toggle("d-none", visible !== 0);
  }
  searchInput?.addEventListener("input", filterDestinations);
  filterInput?.addEventListener("change", filterDestinations);
  clearFilters?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (filterInput) filterInput.value = "all";
    filterDestinations();
  });
  filterDestinations();

  // Feature 3: image gallery lightbox with next/previous controls (Bootstrap modal).
  const galleryButtons = [...document.querySelectorAll("[data-gallery-index]")];
  const galleryModalEl = document.getElementById("galleryModal");
  if (galleryButtons.length && galleryModalEl && window.bootstrap) {
    const galleryModal = new bootstrap.Modal(galleryModalEl);
    const preview = document.getElementById("galleryPreview");
    const title = document.getElementById("galleryModalLabel");
    const position = document.getElementById("galleryPosition");
    const previous = document.getElementById("galleryPrev");
    const next = document.getElementById("galleryNext");
    const galleryData = galleryButtons.map(button => {
      const img = button.querySelector("img");
      return {src: img.src, alt: img.alt, label: button.querySelector("span")?.textContent || img.alt};
    });
    let activeIndex = 0;
    function showImage(index) {
      activeIndex = (index + galleryData.length) % galleryData.length;
      const item = galleryData[activeIndex];
      preview.src = item.src;
      preview.alt = item.alt;
      title.textContent = item.label;
      position.textContent = `${activeIndex + 1} / ${galleryData.length}`;
    }
    galleryButtons.forEach(button => button.addEventListener("click", () => {
      showImage(Number(button.dataset.galleryIndex));
      galleryModal.show();
    }));
    previous?.addEventListener("click", () => showImage(activeIndex - 1));
    next?.addEventListener("click", () => showImage(activeIndex + 1));
    document.addEventListener("keydown", event => {
      if (!galleryModalEl.classList.contains("show")) return;
      if (event.key === "ArrowLeft") showImage(activeIndex - 1);
      if (event.key === "ArrowRight") showImage(activeIndex + 1);
    });
  }

  // Shared helper for accessible validation messages.
  function validateForm(form) {
    let valid = true;
    form.querySelectorAll("input,select,textarea").forEach(field => {
      if (field.type === "checkbox" && field.required) {
        field.classList.toggle("is-invalid", !field.checked);
        field.classList.toggle("is-valid", field.checked);
        if (!field.checked) valid = false;
        return;
      }
      if (field.disabled || field.type === "button" || field.type === "submit") return;
      let fieldValid = field.checkValidity();
      if (field.id === "visitDate" && field.value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(`${field.value}T00:00:00`);
        fieldValid = fieldValid && selected >= today;
      }
      field.classList.toggle("is-invalid", !fieldValid);
      field.classList.toggle("is-valid", fieldValid && field.value.trim() !== "");
      if (!fieldValid) valid = false;
    });
    return valid;
  }
  function showFeedback(target, type, message) {
    if (!target) return;
    target.innerHTML = `<div class="alert alert-${type} mb-0" role="status">${message}</div>`;
  }

  // Feature 4: contact form validation and success feedback.
  const contactForm = document.getElementById("contactForm");
  const contactFeedback = document.getElementById("contactFeedback");
  contactForm?.addEventListener("submit", event => {
    event.preventDefault();
    if (!validateForm(contactForm)) {
      showFeedback(contactFeedback, "danger", "Please check the highlighted fields and correct the errors.");
      contactForm.querySelector(":invalid")?.focus();
      return;
    }
    const name = document.getElementById("contactName").value.trim();
    showFeedback(contactFeedback, "success", `Thank you, ${escapeHTML(name)}. Your demo message passed validation. No real message has been sent.`);
    contactForm.reset();
    contactForm.querySelectorAll(".is-valid").forEach(field => field.classList.remove("is-valid"));
  });

  // Feature 5: dynamic booking calculator + form validation.
  const bookingForm = document.getElementById("bookingForm");
  const activityType = document.getElementById("activityType");
  const travellers = document.getElementById("travellers");
  const tripDays = document.getElementById("tripDays");
  const bookingTotal = document.getElementById("bookingTotal");
  const estimateBreakdown = document.getElementById("estimateBreakdown");
  const bookingFeedback = document.getElementById("bookingFeedback");
  const savedBooking = document.getElementById("savedBooking");
  function calculateBooking() {
    if (!bookingTotal || !estimateBreakdown) return 0;
    const rate = Number(activityType?.value || 0);
    const people = Math.min(20, Math.max(1, Number(travellers?.value || 1)));
    const days = Math.min(30, Math.max(1, Number(tripDays?.value || 1)));
    const total = rate * people * days;
    bookingTotal.textContent = total.toLocaleString("en-US");
    estimateBreakdown.textContent = rate ? `M${rate.toLocaleString("en-US")} × ${people} traveller(s) × ${days} day(s)` : "Choose a trip style to calculate an estimate.";
    return total;
  }
  [activityType, travellers, tripDays].forEach(input => input?.addEventListener("input", calculateBooking));
  calculateBooking();

  // Retrieve a previously saved demo booking from Local Storage.
  try {
    const prior = JSON.parse(localStorage.getItem("exploreLesothoBooking") || "null");
    if (prior && savedBooking) {
      savedBooking.innerHTML = `<div class="alert alert-success"><strong>Saved request found</strong><br>${escapeHTML(prior.name)} · ${escapeHTML(prior.date)} · M${Number(prior.total).toLocaleString("en-US")} estimated</div>`;
    }
  } catch (error) {
    console.warn("Saved booking could not be read.", error);
  }

  bookingForm?.addEventListener("submit", event => {
    event.preventDefault();
    if (!validateForm(bookingForm)) {
      showFeedback(bookingFeedback, "danger", "Please correct the highlighted fields before saving your request.");
      bookingForm.querySelector(":invalid")?.focus();
      return;
    }
    const booking = {
      name: document.getElementById("bookingName").value.trim(),
      email: document.getElementById("bookingEmail").value.trim(),
      date: document.getElementById("visitDate").value,
      activity: activityType.options[activityType.selectedIndex].text,
      travellers: Number(travellers.value),
      days: Number(tripDays.value),
      notes: document.getElementById("bookingNotes").value.trim(),
      total: calculateBooking(),
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem("exploreLesothoBooking", JSON.stringify(booking));
      showFeedback(bookingFeedback, "success", `Thank you, ${escapeHTML(booking.name)}. Your demo request has been saved in this browser. This is not a confirmed booking.`);
      if (savedBooking) savedBooking.innerHTML = `<div class="alert alert-success"><strong>Request saved in this browser</strong><br>${escapeHTML(booking.name)} · ${escapeHTML(booking.date)} · M${Number(booking.total).toLocaleString("en-US")} estimated</div>`;
      bookingForm.querySelectorAll(".is-valid").forEach(field => field.classList.remove("is-valid"));
    } catch (error) {
      showFeedback(bookingFeedback, "warning", "The request passed validation, but this browser could not save it. Please take a screenshot for the demonstration.");
    }
  });
  document.getElementById("clearBooking")?.addEventListener("click", () => {
    bookingForm?.reset();
    bookingForm?.querySelectorAll(".is-valid,.is-invalid").forEach(field => field.classList.remove("is-valid", "is-invalid"));
    if (bookingFeedback) bookingFeedback.textContent = "";
    calculateBooking();
  });

  // Prevent a visitor's typed name from being interpreted as HTML.
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }
});