const state = {
  data: null,
  config: null,
  runtimeAdapters: {},
  expandedDay: null,
  purchasedTickets: new Set(),
  todos: [],
  dayNotes: {},
  dayPhotos: {},
  dayTitles: {},
  itinerarySchedule: {},
  itineraryLocations: {},
  editingItinerary: false,
  expandedDayBeforeEdit: null,
  collapsedEditDays: new Set(),
  editingLocationKey: null,
  appointmentMedia: {},
  appointmentEdits: {},
  editingAppointmentId: null,
  customAppointments: [],
  expenses: []
};

const MODULE_NAMES = Object.freeze(["flights", "overview", "itinerary", "todo", "driving", "ledger"]);
const SHARED_COLLECTIONS = Object.freeze(["todos", "tickets", "ledger"]);

function normalizeTripConfig(raw = {}) {
  if (!raw || typeof raw !== "object" || raw.schemaVersion !== "1.0.0") throw new Error("trip-data.json config.schemaVersion must be 1.0.0");
  if (!raw.modules || typeof raw.modules !== "object") throw new Error("trip-data.json config must contain confirmed module switches");
  const modules = Object.fromEntries(MODULE_NAMES.map((name) => {
    if (typeof raw.modules[name] !== "boolean") throw new Error(`trip-data.json config.modules.${name} must be boolean`);
    return [name, raw.modules[name]];
  }));
  const mode = raw?.persistence?.mode;
  if (mode !== "local" && mode !== "d1") throw new Error("trip-data.json config.persistence.mode must be local or d1");
  const sharedCollections = mode === "d1" ? [...new Set(raw.persistence.sharedCollections || [])] : [];
  if (mode === "d1" && (!sharedCollections.length || sharedCollections.some((name) => !SHARED_COLLECTIONS.includes(name)))) {
    throw new Error("D1 mode requires an explicit sharedCollections allowlist");
  }
  const apiBase = raw.persistence.apiBase || "/api/trip";
  if (mode === "d1" && (!/^\/(?!\/)/.test(apiBase) || apiBase.includes("\\") || /[?#]/.test(apiBase))) {
    throw new Error("D1 apiBase must be a same-origin path");
  }
  return {
    ...raw,
    modules,
    persistence: {
      ...(raw.persistence || {}),
      mode,
      ...(mode === "d1" ? { apiBase, sharedCollections } : {})
    }
  };
}

function moduleEnabled(name) {
  return Boolean(state.config && state.config.modules?.[name] === true);
}

function sharedBackendAvailable() {
  return state.config?.persistence?.mode === "d1"
    && location.protocol === "https:"
    && !["localhost", "127.0.0.1"].includes(location.hostname);
}

function applyModuleConfig() {
  document.querySelectorAll("[data-module]").forEach((element) => {
    element.hidden = !moduleEnabled(element.dataset.module);
  });
  const visibleTravelLinks = [...document.querySelectorAll(".floating-navigation [data-module]")].filter((link) => !link.hidden);
  const travelNavigation = $("#travel-navigation");
  if (travelNavigation) travelNavigation.hidden = visibleTravelLinks.length === 0;
  document.documentElement.dataset.persistence = state.config.persistence.mode;

  const hashModules = {
    "#flights": "flights", "#route": "overview", "#itinerary": "itinerary",
    "#drive": "driving", "#prep": "todo", "#expenses": "ledger", "#ledger": "ledger", "#ledger-stats": "ledger"
  };
  const requestedModule = hashModules[location.hash];
  if (requestedModule && !moduleEnabled(requestedModule)) {
    const firstVisible = visibleTravelLinks[0]?.getAttribute("href") || "#top";
    history.replaceState({ view: "travel" }, "", firstVisible);
  }
  window.dispatchEvent(new CustomEvent("travel-config:ready", { detail: { config: state.config } }));
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;"
})[character]);

const airportCity = (airport) => airport.city || airport.airportCode;

function formatDate(dateString, includeYear = false) {
  const date = new Date(`${dateString}T12:00:00`);
  const options = includeYear
    ? { year: "numeric", month: "long", day: "numeric" }
    : { month: "long", day: "numeric" };
  return new Intl.DateTimeFormat("zh-CN", options).format(date);
}

function formatCompactDate(dateString) {
  const [, month, day] = dateString.split("-");
  return `${Number(day)} ${new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(2000, Number(month) - 1, Number(day)))}`;
}

function formatFullCompactDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function normalizeItineraryTime(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (/^\d{4}$/.test(raw) || (digits.length === 4 && !raw.includes(":"))) {
    const hours = Number(digits.slice(0, 2));
    const minutes = Number(digits.slice(2));
    if (hours <= 23 && minutes <= 59) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }
  return raw;
}

function todayForTrip() {
  const timeZone = state.data?.metadata?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }
}

function mapsSearch(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function locationFromInput(value, fallbackLabel = "") {
  if (window.LocationUtils?.parseLocationInput) return window.LocationUtils.parseLocationInput(value, fallbackLabel);
  const text = String(value || fallbackLabel).trim();
  return { label: text, query: text, url: "", source: "fallback" };
}

function openMediaLightbox(source, alt = "Travel image") {
  const dialog = $("#media-lightbox");
  const image = $("#media-lightbox-image");
  if (!dialog || !image || !source) return;
  image.src = source;
  image.alt = alt;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

async function imageFileToDataUrl(file, { maxEdge = 1280, quality = .82 } = {}) {
  if (!file?.type?.startsWith("image/")) throw new Error("Please choose an image file.");
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("The image could not be opened."));
    element.src = source;
  });
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function setupMediaLightbox() {
  const dialog = $("#media-lightbox");
  if (!dialog) return;
  $("#media-lightbox-close").onclick = () => dialog.close?.();
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close?.(); });
}

function heroDestinationFor(trip) {
  const destinations = (trip.countries || []).filter((country) => (trip.primaryDestinationCountries || []).includes(country.code));
  const isDomestic = destinations.length > 0 && destinations.every((country) => country.code === "CN");
  const customTitle = String(trip.heroTitle || "").trim();
  if (customTitle) {
    return { title: customTitle, eyebrow: String(trip.heroEyebrow || "").trim(), destinations, isDomestic };
  }
  if (isDomestic) {
    const destination = String(trip.primaryDestinationName || trip.primaryDestinationCity || trip.citiesAndAreas?.[0] || "Destination TBD").trim();
    return {
      title: destination,
      eyebrow: String(trip.primaryDestinationNameEn || trip.primaryDestinationCityEn || "DOMESTIC JOURNEY").trim(),
      destinations,
      isDomestic
    };
  }
  return {
    title: destinations.map((country) => country.name || country.nameEn || country.nameZh).join(" × ") || "Destination TBD",
    eyebrow: destinations.map((country) => country.nameEn || country.name).filter(Boolean).join(" × "),
    destinations,
    isDomestic
  };
}

function renderHero() {
  const { trip } = state.data;
  if (trip.status === "uninitialized") {
    document.title = state.data.metadata.title;
    $("#trip-title").textContent = "Trip plan pending";
    $("#trip-eyebrow").textContent = "READY FOR YOUR JOURNEY";
    $("#wordmark").innerHTML = "TRIP <span>· READY</span>";
    $("#footer-mark").textContent = "TRIP · READY";
    $("#route-day-count").textContent = "0 DAYS";
    $("#trip-date").textContent = "Waiting for trip details";
    return;
  }
  const hero = heroDestinationFor(trip);
  const { destinations } = hero;
  const shortMark = destinations.map((country) => country.code).join(" / ");
  const year = trip.startDate.slice(0, 4);
  document.title = state.data.metadata.title;
  $("#trip-title").textContent = hero.title;
  $("#trip-eyebrow").textContent = hero.eyebrow;
  $("#wordmark").innerHTML = `${escapeHtml(shortMark)} <span>· ${escapeHtml(year)}</span>`;
  $("#footer-mark").textContent = `${shortMark} · ${year}`;
  $("#route-day-count").textContent = `${trip.dayCount} DAYS`;
  $("#trip-date").textContent = `${formatFullCompactDate(trip.startDate)} - ${formatFullCompactDate(trip.endDate)} · ${trip.dayCount}D${trip.nightCountAway}N`;
}

function journeyFlights(journeyId) {
  return state.data.flights
    .filter((flight) => flight.journeyId === journeyId)
    .sort((first, second) => first.sequence - second.sequence);
}

function relativeFlightDate(date, journeyStartDate) {
  if (date === journeyStartDate) return formatCompactDate(date);
  const difference = Math.round((new Date(`${date}T12:00:00`) - new Date(`${journeyStartDate}T12:00:00`)) / 86400000);
  return difference === 1 ? "Next day" : formatCompactDate(date);
}

function flightStopMarkup(stop, position, journeyStartDate) {
  let timing;
  if (position === 0) {
    timing = `<span>${escapeHtml(formatFullCompactDate(stop.departure.date))}</span><b>${escapeHtml(stop.departure.time)} departure</b><small class="flight-terminal">${escapeHtml(stop.departure.terminal || "Terminal TBD")}</small>`;
  } else if (position === stop.totalStops - 1) {
    timing = `<span>${escapeHtml(formatFullCompactDate(stop.arrival.date))}</span><b>${escapeHtml(stop.arrival.time)} arrival</b><small class="flight-terminal">${escapeHtml(stop.arrival.terminal || "Terminal TBD")}</small>`;
  } else {
    const nextFlight = stop.nextFlight;
    const connection = nextFlight.connectionFromPrevious || {};
    const duration = connection.calculatedFromSchedule || connection.durationUsingTicketTimes || connection.plannedDurationText || "Transfer";
    timing = `
      <span>${escapeHtml(stop.arrival.time)} arrival</span>
      <em>${escapeHtml(duration)}</em>
      <b>${escapeHtml(relativeFlightDate(nextFlight.departure.date, journeyStartDate))} ${escapeHtml(nextFlight.departure.time)}</b>
      <span>Departure</span>
    `;
  }
  return `
    <div class="flight-stop${position > 0 && position < stop.totalStops - 1 ? " is-transfer" : ""}">
      <span class="flight-stop__code">${escapeHtml(stop.airport.airportCode)}</span>
      <span class="flight-stop__city">${escapeHtml(airportCity(stop.airport))}</span>
      <span class="flight-stop__dot" aria-hidden="true"></span>
      <div class="flight-stop__timing">${timing}</div>
    </div>
  `;
}

function flightMissingFieldLabel(field) {
  return ({
    carrierId: "Airline",
    flightNumber: "Flight number",
    departure: "Departure details",
    arrival: "Arrival details",
    departurePlace: "Departure airport",
    arrivalPlace: "Arrival airport",
    departureTime: "Departure time",
    arrivalTime: "Arrival time",
    timeZone: "Local time zone"
  })[field] || String(field || "Details TBD");
}

function flightPlaceholderCard(journey, index) {
  const missingFields = [...new Set(journey.missingFields || [])].map(flightMissingFieldLabel);
  return `
    <article class="flight-card flight-card--placeholder" data-journey="${escapeHtml(journey.id)}">
      <div class="flight-card__top">
        <span>FLIGHT ${String(index + 1).padStart(2, "0")} / ${String(state.data.flightJourneys.length).padStart(2, "0")}</span>
      </div>
      <div class="flight-placeholder">
        <span class="flight-placeholder__eyebrow">DETAILS TBD</span>
        <h3>${escapeHtml(journey.title || "Flight details TBD")}</h3>
        <p>This preview preserves missing flight details as TBD instead of guessing them.</p>
        ${missingFields.length ? `<ul>${missingFields.map((field) => `<li>${escapeHtml(field)}</li>`).join("")}</ul>` : ""}
      </div>
    </article>
  `;
}

function flightCard(journey, index) {
  const flights = journeyFlights(journey.id);
  if (journey.placeholder || journey.status === "missing" || journey.status === "pending" || !flights.length || flights.some((flight) => flight.placeholder)) {
    return flightPlaceholderCard(journey, index);
  }
  const first = flights[0];
  const stops = [
    { airport: first.departure, departure: first.departure },
    ...flights.map((flight, flightIndex) => ({
      airport: flight.arrival,
      arrival: flight.arrival,
      nextFlight: flights[flightIndex + 1]
    }))
  ];
  const routeItems = [];
  stops.forEach((stop, stopIndex) => {
    routeItems.push(flightStopMarkup({ ...stop, totalStops: stops.length }, stopIndex, first.departure.date));
    if (stopIndex < flights.length) {
      const flight = flights[stopIndex];
      routeItems.push(`
        <div class="flight-segment">
          <span>${escapeHtml(flight.flightNumber)}</span>
          <i aria-hidden="true">→</i>
        </div>
      `);
    }
  });
  return `
    <article class="flight-card" data-journey="${escapeHtml(journey.id)}">
      <div class="flight-card__top">
        <span>FLIGHT ${String(index + 1).padStart(2, "0")} / ${String(state.data.flightJourneys.length).padStart(2, "0")}</span>
      </div>
      <div class="flight-card__airlines">${escapeHtml([...new Set(flights.map((flight) => flight.airline.name || flight.airline.nameZh))].join(" · "))}<span> · Booking ${escapeHtml(journey.bookingReference || "TBD")}</span></div>
      <div class="flight-flow" style="--route-columns: ${stops.map((_, stopIndex) => stopIndex < stops.length - 1 ? "minmax(0,1fr) minmax(34px,.5fr)" : "minmax(0,1fr)").join(" ")}">
        ${routeItems.join("")}
      </div>
    </article>
  `;
}

function renderFlights() {
  const journeys = state.data.flightJourneys;
  $("#flight-carousel").innerHTML = journeys.map(flightCard).join("");
  $("#flight-dots").innerHTML = journeys.map((_, index) => `<span class="carousel-dot${index === 0 ? " is-active" : ""}"></span>`).join("");
  $("#flight-index").textContent = `1 / ${journeys.length}`;

  const carousel = $("#flight-carousel");
  let scheduled = false;
  carousel.addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      const cards = $$(".flight-card", carousel);
      const center = carousel.scrollLeft + carousel.clientWidth / 2;
      let activeIndex = 0;
      let distance = Infinity;
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        if (Math.abs(cardCenter - center) < distance) {
          distance = Math.abs(cardCenter - center);
          activeIndex = index;
        }
      });
      $$(".carousel-dot", $("#flight-dots")).forEach((dot, index) => dot.classList.toggle("is-active", index === activeIndex));
      $("#flight-index").textContent = `${activeIndex + 1} / ${journeys.length}`;
      scheduled = false;
    });
  }, { passive: true });
}

function costText(cost) {
  if (cost.amount !== undefined) return `${cost.item} · ${cost.currency} ${cost.amount}`;
  if (cost.standard !== undefined && cost.standard !== null) return `${cost.item} · ${cost.currency} ${cost.standard}`;
  if (cost.discounted !== undefined && cost.discounted !== null) return `${cost.item} · ${cost.currency} ${cost.discounted}`;
  if (cost.amountOptions) return `${cost.item} · ${cost.currency} ${cost.amountOptions.join(" / ")}`;
  return cost.item;
}

function ticketsForDay(day) {
  if (!moduleEnabled("itinerary")) return [];
  return (state.data.ticketPlanning?.items || []).filter((ticket) =>
    ticket.dayId ? ticket.dayId === day.id : ticket.day === day.day
  );
}

function ticketsForSchedule(day, item) {
  if (!moduleEnabled("itinerary")) return [];
  const tickets = ticketsForDay(day);
  if (Array.isArray(item.ticketIds)) return tickets.filter((ticket) => item.ticketIds.includes(ticket.id));
  if (item.id) {
    const explicit = tickets.filter((ticket) => (ticket.scheduleItemIds || ticket.itemIds || []).includes(item.id));
    if (explicit.length) return explicit;
  }
  const lowerText = String(item.text || item.title || "").toLocaleLowerCase();
  return tickets.filter((ticket) => (ticket.scheduleMatchTerms || []).some((term) => lowerText.includes(term.toLocaleLowerCase())));
}

function isTicketPurchased(ticket) {
  return ticket.purchaseStatus === "purchased" || state.purchasedTickets.has(ticket.id);
}

function ticketRequirement(ticket) {
  return ({
    "advance-required": "Advance purchase required",
    "advance-recommended": "Reservation recommended",
    "needs-confirmation": "Purchase method TBD"
  })[ticket.requirement] || "Ticket information";
}

function ticketTitle(ticket) {
  return ticket.name || ticket.attraction?.name || ticket.attraction?.nameZh || "Ticket details";
}

function ticketGuidance(ticket) {
  const guidance = ticket.guidance || ticket.notes || [];
  return Array.isArray(guidance) ? guidance.join("·") : String(guidance || "");
}

function ticketDocument(ticket) {
  const document = ticket.document || ticket.booking?.document;
  if (document && typeof document === "object") {
    return { url: document.url || document.path || "", type: document.type || "", label: document.label || "View ticket" };
  }
  const url = ticket.documentUrl || ticket.booking?.documentUrl || "";
  return url ? { url, type: "", label: ticket.documentLabel || "View ticket" } : null;
}

function inlineTicketMarkup(ticket) {
  const purchased = isTicketPurchased(ticket);
  const title = ticketTitle(ticket);
  return `
    <div class="schedule-ticket ${purchased ? "is-purchased" : `is-${escapeHtml(ticket.requirement)}`}" data-inline-ticket="${escapeHtml(ticket.id)}">
      <label class="schedule-ticket__toggle">
        <input type="checkbox" value="${escapeHtml(ticket.id)}" ${purchased ? "checked" : ""} aria-label="${purchased ? "Mark as not purchased" : "Mark as purchased"}: ${escapeHtml(title)}">
        <span class="schedule-ticket__check" aria-hidden="true">✓</span>
        <span class="schedule-ticket__content">
          <span class="schedule-ticket__status">${purchased ? "Purchased" : escapeHtml(ticketRequirement(ticket))}</span>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(ticketGuidance(ticket))}</small>
        </span>
      </label>
      <button type="button" class="schedule-ticket__open" data-ticket-open="${escapeHtml(ticket.id)}" aria-haspopup="dialog" aria-controls="ticket-dialog">View</button>
    </div>`;
}

function dayCard(day) {
  const today = todayForTrip();
  const isToday = day.date === today;
  const expanded = state.editingItinerary
    ? !state.collapsedEditDays.has(day.day)
    : state.expandedDay === day.day;
  const dayKey = itineraryDayKey(day);
  const dayTitle = state.dayTitles[dayKey] || day.title;
  const schedule = (day.schedule || []).map((item) => {
    const noteKey = `${dayKey}:${item.id}`;
    const photo = state.dayPhotos[noteKey] || "";
    const destinations = scheduleLocations(noteKey, item);
    const mapLinks = destinations.map((destination, locationIndex) => `
      <span class="schedule-location-chip">
        <button type="button" class="schedule-map-link" data-map-query="${escapeHtml(destination.query)}" data-map-url="${escapeHtml(destination.url || "")}" data-map-label="${escapeHtml(destination.label)}" aria-haspopup="dialog" aria-controls="place-map" aria-label="View ${escapeHtml(destination.label)} on the map">📍 ${escapeHtml(destination.label)}</button>
        ${state.editingItinerary ? `<button type="button" class="schedule-location-remove" data-location-key="${escapeHtml(noteKey)}" data-location-index="${locationIndex}" aria-label="Remove ${escapeHtml(destination.label)}">×</button>` : ""}
      </span>
    `).join("");
    const locationEditor = state.editingItinerary ? `
      <button type="button" class="schedule-location-add" data-add-location="${escapeHtml(noteKey)}">＋ Add location</button>
      ${state.editingLocationKey === noteKey ? `<form class="schedule-location-editor" data-location-form="${escapeHtml(noteKey)}">
        <label><span>Location</span><input name="location" maxlength="180" required autocomplete="off" placeholder="Search place or paste coordinates" aria-label="Search place or paste coordinates"></label>
        <span class="schedule-location-editor__actions"><button type="button" data-cancel-location>Cancel</button><button type="submit">Add</button></span>
      </form>` : ""}` : "";
    const scheduleTickets = ticketsForSchedule(day, item).map(inlineTicketMarkup).join("");
    return `
      <li class="schedule-item${state.editingItinerary ? " is-editable" : ""}" data-schedule-id="${escapeHtml(item.id)}" data-source-day="${day.day}">
        ${state.editingItinerary ? `<button class="schedule-drag-handle" type="button" draggable="true" aria-label="Drag and reorder ${escapeHtml(item.time)} ${escapeHtml(item.text)}" title="Drag to reorder">🟰</button><input class="schedule-time schedule-time-editor" data-schedule-field="time" value="${escapeHtml(item.time)}" maxlength="24" aria-label="Edit time">` : `<span class="schedule-time">${escapeHtml(item.time)}</span>`}
        <div class="schedule-content">
          ${state.editingItinerary ? `<textarea class="schedule-text schedule-text-editor" data-schedule-field="text" rows="2" maxlength="300" aria-label="Edit itinerary item">${escapeHtml(item.text)}</textarea>` : `<div class="schedule-text">${escapeHtml(item.text)}</div>`}
          ${scheduleTickets}
          ${(mapLinks || locationEditor) ? `<div class="schedule-map-links">${mapLinks}${locationEditor}</div>` : ""}
          <div class="schedule-quick-record">
            <div class="schedule-note"><input type="text" maxlength="160" data-schedule-note="${escapeHtml(noteKey)}" value="${escapeHtml(state.dayNotes[noteKey] || "")}" placeholder="Add a quick note…" aria-label="Quick note for ${escapeHtml(item.time)} ${escapeHtml(item.text)}"><span role="status"></span></div>
            <label class="schedule-photo-add" title="Add a photo"><input type="file" accept="image/*" data-schedule-photo="${escapeHtml(noteKey)}"><span aria-hidden="true">＋</span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6M9 9h.01"/></svg><span class="sr-only">Add photo</span></label>
            ${photo ? `<button type="button" class="schedule-photo-thumb" data-media-src="${escapeHtml(photo)}" data-media-alt="${escapeHtml(`${day.title} · ${item.time}`)}"><img src="${escapeHtml(photo)}" alt="Travel memory thumbnail"></button><button type="button" class="schedule-photo-remove" data-remove-schedule-photo="${escapeHtml(noteKey)}" aria-label="Remove photo">×</button>` : ""}
          </div>
        </div>
      </li>
    `;
  }).join("");
  const costs = (day.costReferences || []).map((cost) => `<span class="cost-tag">${escapeHtml(costText(cost))}</span>`).join("");
  const dayTickets = ticketsForDay(day);
  const pendingTicketCount = dayTickets.filter((ticket) => !isTicketPurchased(ticket)).length;
  const ticketSummary = dayTickets.length
    ? `<span class="day-ticket-summary ${pendingTicketCount ? "has-pending" : "is-complete"}">${pendingTicketCount ? `${pendingTicketCount} ticket(s) pending` : "Tickets ready"}</span>`
    : "";
  return `
    <article class="day-card${isToday ? " is-today" : ""}${state.editingItinerary ? " is-editing" : ""}" data-day="${day.day}">
      <span class="day-dot" aria-hidden="true"></span>
      <div class="day-card-heading">
      <button class="day-toggle" type="button" aria-expanded="${expanded}" aria-controls="day-detail-${day.day}">
        <span>
          <span class="day-meta"><b>DAY ${day.day}</b><small>${escapeHtml(formatFullCompactDate(day.date))}${isToday ? " · TODAY" : ""}</small></span>
        </span>
        <span class="day-chevron" aria-hidden="true">+</span>
      </button>
      ${state.editingItinerary
        ? `<label class="day-title-editor"><span class="sr-only">Day ${day.day} title</span><textarea data-day-title="${escapeHtml(dayKey)}" rows="1" maxlength="100" aria-label="Edit Day ${day.day} title">${escapeHtml(dayTitle)}</textarea></label>`
        : `<div class="day-title-editor day-title-editor--preview">${escapeHtml(dayTitle)}</div>`}
      ${ticketSummary}
      </div>
      <div class="day-detail" id="day-detail-${day.day}" ${expanded ? "" : "hidden"}>
        <ol class="schedule">${schedule}</ol>
        <button type="button" class="schedule-add-activity" data-add-activity="${day.day}">＋ Add new activities</button>
        ${costs ? `<div class="costs">${costs}</div>` : ""}
      </div>
    </article>
  `;
}

function navigationDestinations(item) {
  const policy = state.data.mapLinks?.navigationPolicy || { noNavigationTypes: [], selfNavigationTypes: [] };
  if (policy.noNavigationTypes.includes(item.type)) return [];
  const referencedPlaceIds = [...new Set([
    ...(Array.isArray(item.placeIds) ? item.placeIds : []),
    ...(item.placeId ? [item.placeId] : [])
  ])];
  if (referencedPlaceIds.length) {
    return referencedPlaceIds.map((placeId) => state.data.places.find((place) => place.id === placeId)).filter(Boolean).map((place) => ({
      id: place.id,
      label: place.nameZh || place.name,
      query: place.navigation?.query || place.googleMapsQuery || place.address || `${place.nameZh || place.name}${place.cityOrArea ? `, ${place.cityOrArea}` : ""}`,
      directUrl: Boolean(place.navigation?.url || place.googleMapsUrl),
      url: place.navigation?.url || place.googleMapsUrl || ""
    }));
  }
  const text = String(item.text || item.title || "");
  const lowerText = text.toLocaleLowerCase();
  const explicit = (state.data.mapLinks?.navigationPlaces || [])
    .filter((place) => place.matchTerms.some((term) => lowerText.includes(term.toLocaleLowerCase())))
    .map((place) => ({
      id: place.id,
      label: place.label,
      query: place.query,
      priority: place.priority || 1,
      matchIndex: Math.max(...place.matchTerms.map((term) => lowerText.lastIndexOf(term.toLocaleLowerCase())))
    }));
  const highestExplicitPriority = explicit.reduce((highest, place) => Math.max(highest, place.priority), 0);
  const selectedExplicit = highestExplicitPriority > 1
    ? explicit.filter((place) => place.priority === highestExplicitPriority)
    : explicit;

  const catalogPlaces = state.data.places
    .filter((place) => [place.name, place.nameZh].filter(Boolean).some((name) => lowerText.includes(name.toLocaleLowerCase())))
    .map((place) => ({
      id: place.id,
      label: place.nameZh || place.name,
      query: place.googleMapsUrl || [place.name, place.cityOrArea].filter(Boolean).join(", "),
      directUrl: Boolean(place.googleMapsUrl),
      matchIndex: Math.max(...[place.name, place.nameZh].filter(Boolean).map((name) => lowerText.lastIndexOf(name.toLocaleLowerCase())))
    }));

  const restaurants = state.data.restaurants
    .filter((restaurant) => lowerText.includes(restaurant.name.toLocaleLowerCase()))
    .map((restaurant) => ({
      id: `restaurant-${restaurant.name}`,
      label: restaurant.name,
      query: restaurant.googleMapsUrl || `${restaurant.name}, ${restaurant.city}`,
      directUrl: Boolean(restaurant.googleMapsUrl),
      matchIndex: lowerText.lastIndexOf(restaurant.name.toLocaleLowerCase())
    }));

  const specificExplicit = selectedExplicit.filter((place) => place.priority > 1);
  let destinations = specificExplicit.length
    ? [...specificExplicit, ...restaurants]
    : catalogPlaces.length
      ? [...catalogPlaces, ...restaurants]
      : [...selectedExplicit, ...restaurants];
  destinations = destinations.filter((place, index, all) => all.findIndex((candidate) => candidate.id === place.id) === index);

  if (policy.selfNavigationTypes.includes(item.type) && destinations.length > 1 && !specificExplicit.length) {
    destinations.sort((first, second) => second.matchIndex - first.matchIndex);
    return [destinations[0]];
  }
  return destinations;
}

function scheduleLocations(noteKey, item) {
  const saved = state.itineraryLocations[noteKey];
  const source = Array.isArray(saved) ? saved : navigationDestinations(item);
  return source.map((destination, index) => ({
    id: String(destination.id || `custom-location-${index + 1}`),
    label: String(destination.officialName || destination.label || destination.query || "Location"),
    query: String(destination.query || destination.label || ""),
    url: String(destination.url || "")
  })).filter((destination) => destination.query);
}

function persistScheduleLocations(noteKey, locations) {
  state.itineraryLocations[noteKey] = locations.map((location, index) => ({
    id: String(location.id || `custom-location-${Date.now()}-${index}`),
    label: String(location.label || location.query || "Location"),
    officialName: String(location.officialName || location.label || location.query || "Location"),
    query: String(location.query || location.label || ""),
    url: String(location.url || "")
  }));
  savePersonalState();
}

function currentTripDay() {
  const today = todayForTrip();
  return state.data.days.find((day) => day.date === today)?.day || null;
}

function moveScheduleItem(sourceDayNumber, scheduleId, targetDayNumber, targetIndex) {
  const sourceDay = state.data.days.find((day) => day.day === Number(sourceDayNumber));
  const targetDay = state.data.days.find((day) => day.day === Number(targetDayNumber));
  if (!sourceDay || !targetDay) return false;
  const sourceIndex = sourceDay.schedule.findIndex((item) => String(item.id) === String(scheduleId));
  if (sourceIndex < 0) return false;
  const [moved] = sourceDay.schedule.splice(sourceIndex, 1);
  let insertionIndex = Number.isFinite(targetIndex) ? targetIndex : targetDay.schedule.length;
  if (sourceDay === targetDay && sourceIndex < insertionIndex) insertionIndex -= 1;
  insertionIndex = Math.max(0, Math.min(insertionIndex, targetDay.schedule.length));
  targetDay.schedule.splice(insertionIndex, 0, moved);
  if (sourceDay !== targetDay) {
    const oldNoteKey = `${itineraryDayKey(sourceDay)}:${moved.id}`;
    const newNoteKey = `${itineraryDayKey(targetDay)}:${moved.id}`;
    if (Object.prototype.hasOwnProperty.call(state.dayNotes, oldNoteKey)) {
      state.dayNotes[newNoteKey] = state.dayNotes[oldNoteKey];
      delete state.dayNotes[oldNoteKey];
    }
    if (Object.prototype.hasOwnProperty.call(state.dayPhotos, oldNoteKey)) {
      state.dayPhotos[newNoteKey] = state.dayPhotos[oldNoteKey];
      delete state.dayPhotos[oldNoteKey];
    }
    if (Object.prototype.hasOwnProperty.call(state.itineraryLocations, oldNoteKey)) {
      state.itineraryLocations[newNoteKey] = state.itineraryLocations[oldNoteKey];
      delete state.itineraryLocations[oldNoteKey];
    }
  }
  captureItinerarySchedule();
  savePersonalState();
  return true;
}

function scheduleDropTarget(eventTarget, clientY) {
  const itemElement = eventTarget.closest?.(".schedule-item[data-schedule-id]");
  const dayCardElement = eventTarget.closest?.(".day-card");
  if (!dayCardElement) return null;
  if (!itemElement) {
    const day = state.data.days.find((entry) => entry.day === Number(dayCardElement.dataset.day));
    return { day: Number(dayCardElement.dataset.day), index: day?.schedule?.length || 0, itemElement: null, position: "after" };
  }
  const siblings = $$(".schedule-item[data-schedule-id]", itemElement.closest(".schedule"));
  const itemIndex = siblings.indexOf(itemElement);
  const position = clientY < itemElement.getBoundingClientRect().top + itemElement.getBoundingClientRect().height / 2 ? "before" : "after";
  return { day: Number(dayCardElement.dataset.day), index: itemIndex + (position === "after" ? 1 : 0), itemElement, position };
}

function clearScheduleDropIndicators() {
  $$(".is-drag-target,.is-drop-before,.is-drop-after", $("#timeline")).forEach((element) => element.classList.remove("is-drag-target", "is-drop-before", "is-drop-after"));
}

function renderTimeline() {
  const today = currentTripDay();
  if (state.expandedDay === null) state.expandedDay = today;
  $("#day-count").textContent = `${state.data.days.length} DAYS`;
  const editButton = $("#itinerary-edit");
  editButton.textContent = state.editingItinerary ? "Done" : "Edit";
  editButton.setAttribute("aria-pressed", String(state.editingItinerary));
  editButton.onclick = () => {
    if (!state.editingItinerary) {
      state.expandedDayBeforeEdit = state.expandedDay;
      state.editingItinerary = true;
      state.collapsedEditDays = new Set(state.data.days.map((day) => day.day));
    } else {
      state.editingItinerary = false;
      state.collapsedEditDays.clear();
      state.editingLocationKey = null;
      state.expandedDay = state.expandedDayBeforeEdit;
      state.expandedDayBeforeEdit = null;
      captureItinerarySchedule();
      savePersonalState();
    }
    renderTimeline();
  };
  $("#itinerary").classList.toggle("is-editing", state.editingItinerary);
  $("#timeline").innerHTML = state.data.days.map(dayCard).join("");
  $$("[data-day-title]", $("#timeline")).forEach((input) => {
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  });
  $("#timeline").onclick = (event) => {
    const mediaButton = event.target.closest("[data-media-src]");
    if (mediaButton) { openMediaLightbox(mediaButton.dataset.mediaSrc, mediaButton.dataset.mediaAlt); return; }
    const removePhoto = event.target.closest("[data-remove-schedule-photo]");
    if (removePhoto) {
      delete state.dayPhotos[removePhoto.dataset.removeSchedulePhoto];
      savePersonalState();
      renderTimeline();
      return;
    }
    const ticketButton = event.target.closest("[data-ticket-open]");
    if (ticketButton) {
      openTicketDialog(ticketButton.dataset.ticketOpen, ticketButton);
      return;
    }
    const removeLocation = event.target.closest("[data-location-index]");
    if (removeLocation && state.editingItinerary) {
      const key = removeLocation.dataset.locationKey;
      const scheduleItem = removeLocation.closest("[data-schedule-id]");
      const day = state.data.days.find((entry) => entry.day === Number(scheduleItem?.dataset.sourceDay));
      const item = day?.schedule?.find((entry) => String(entry.id) === scheduleItem?.dataset.scheduleId);
      const locations = scheduleLocations(key, item).filter((_, index) => index !== Number(removeLocation.dataset.locationIndex));
      persistScheduleLocations(key, locations);
      renderTimeline();
      return;
    }
    const addLocation = event.target.closest("[data-add-location]");
    if (addLocation && state.editingItinerary) {
      state.editingLocationKey = addLocation.dataset.addLocation;
      renderTimeline();
      window.setTimeout(() => $(`[data-location-form="${CSS.escape(state.editingLocationKey)}"] input`)?.focus(), 0);
      return;
    }
    const addActivity = event.target.closest("[data-add-activity]");
    if (addActivity) {
      const day = state.data.days.find((entry) => entry.day === Number(addActivity.dataset.addActivity));
      if (!day) return;
      if (!state.editingItinerary) {
        state.expandedDayBeforeEdit = day.day;
        state.editingItinerary = true;
        state.collapsedEditDays = new Set(state.data.days.map((entry) => entry.day));
      }
      const item = { id: `custom-activity-${crypto.randomUUID()}`, time: "TBD", text: "" };
      day.schedule.push(item);
      state.collapsedEditDays.delete(day.day);
      captureItinerarySchedule();
      savePersonalState();
      renderTimeline();
      $(`.schedule-item[data-schedule-id="${item.id}"] [data-schedule-field="text"]`)?.focus();
      return;
    }
    if (event.target.closest("[data-cancel-location]")) {
      state.editingLocationKey = null;
      renderTimeline();
      return;
    }
    const toggle = event.target.closest(".day-toggle");
    if (!toggle) return;
    const card = toggle.closest(".day-card");
    const dayNumber = Number(card.dataset.day);
    const wasExpanded = toggle.getAttribute("aria-expanded") === "true";
    if (state.editingItinerary) {
      if (wasExpanded) state.collapsedEditDays.add(dayNumber);
      else state.collapsedEditDays.delete(dayNumber);
      renderTimeline();
      return;
    }
    $$(".day-toggle", $("#timeline")).forEach((button) => button.setAttribute("aria-expanded", "false"));
    $$(".day-detail", $("#timeline")).forEach((detail) => { detail.hidden = true; });
    if (!wasExpanded) {
      toggle.setAttribute("aria-expanded", "true");
      $(`#day-detail-${dayNumber}`).hidden = false;
      state.expandedDay = dayNumber;
    } else {
      state.expandedDay = null;
    }
  };
  $("#timeline").onsubmit = (event) => {
    const form = event.target.closest("[data-location-form]");
    if (!form || !state.editingItinerary) return;
    event.preventDefault();
    const value = String(new FormData(form).get("location") || "").trim();
    if (!value) return;
    const scheduleItem = form.closest("[data-schedule-id]");
    const day = state.data.days.find((entry) => entry.day === Number(scheduleItem?.dataset.sourceDay));
    const item = day?.schedule?.find((entry) => String(entry.id) === scheduleItem?.dataset.scheduleId);
    const key = form.dataset.locationForm;
    const locations = scheduleLocations(key, item);
    const resolved = locationFromInput(value, item?.text || "Location");
    locations.push({
      id: `custom-location-${Date.now()}`,
      label: resolved.label,
      officialName: resolved.label,
      query: resolved.query,
      url: resolved.url
    });
    persistScheduleLocations(key, locations);
    state.editingLocationKey = null;
    renderTimeline();
  };
  $("#timeline").onchange = (event) => {
    const titleInput = event.target.closest("[data-day-title]");
    if (titleInput) {
      if (!state.editingItinerary) return;
      const day = state.data.days.find((item) => (item.id || `day-${String(item.day).padStart(2, "0")}`) === titleInput.dataset.dayTitle);
      const title = titleInput.value.trim();
      if (day) {
        const dayKey = day.id || `day-${String(day.day).padStart(2, "0")}`;
        if (title && title !== day.title) state.dayTitles[dayKey] = title;
        else delete state.dayTitles[dayKey];
        titleInput.value = state.dayTitles[dayKey] || day.title;
        savePersonalState();
      }
      return;
    }
    const scheduleInput = event.target.closest("[data-schedule-field]");
    if (scheduleInput && state.editingItinerary) {
      const scheduleItem = scheduleInput.closest("[data-schedule-id]");
      const day = state.data.days.find((item) => item.day === Number(scheduleItem?.dataset.sourceDay));
      const item = day?.schedule?.find((entry) => String(entry.id) === scheduleItem?.dataset.scheduleId);
      if (item) {
        const nextValue = scheduleInput.dataset.scheduleField === "time"
          ? normalizeItineraryTime(scheduleInput.value)
          : scheduleInput.value.trim();
        item[scheduleInput.dataset.scheduleField] = nextValue || "TBD";
        scheduleInput.value = item[scheduleInput.dataset.scheduleField];
        captureItinerarySchedule();
        savePersonalState();
      }
      return;
    }
    const photoInput = event.target.closest("[data-schedule-photo]");
    if (photoInput) {
      const file = photoInput.files?.[0];
      if (!file) return;
      imageFileToDataUrl(file, { maxEdge: 1000, quality: .78 }).then((source) => {
        state.dayPhotos[photoInput.dataset.schedulePhoto] = source;
        savePersonalState();
        renderTimeline();
      }).catch((error) => window.alert(error.message));
      return;
    }
    const noteInput = event.target.closest("[data-schedule-note]");
    if (noteInput) {
      state.dayNotes[noteInput.dataset.scheduleNote] = noteInput.value;
      savePersonalState();
      const status = noteInput.nextElementSibling;
      status.textContent = "Saved";
      window.setTimeout(() => { if (status) status.textContent = ""; }, 1200);
      return;
    }
    const checkbox = event.target.closest(".schedule-ticket input[type='checkbox']");
    if (!checkbox) return;
    if (checkbox.checked) state.purchasedTickets.add(checkbox.value);
    else state.purchasedTickets.delete(checkbox.value);
    saveTicketState(checkbox.value, checkbox.checked);
    updateInlineTicketState(checkbox.value, checkbox.checked);
  };
  $("#timeline").oninput = (event) => {
    const titleInput = event.target.closest("[data-day-title]");
    if (titleInput && state.editingItinerary) {
      titleInput.style.height = "auto";
      titleInput.style.height = `${titleInput.scrollHeight}px`;
      return;
    }
    const timeInput = event.target.closest('[data-schedule-field="time"]');
    if (!timeInput || !state.editingItinerary) return;
    const formatted = normalizeItineraryTime(timeInput.value);
    if (formatted !== timeInput.value && /^\d{2}:\d{2}$/.test(formatted)) {
      timeInput.value = formatted;
      timeInput.setSelectionRange?.(formatted.length, formatted.length);
    }
  };
  $("#timeline").onkeydown = (event) => {
    const noteInput = event.target.closest("[data-schedule-note]");
    if (noteInput && event.key === "Enter") { event.preventDefault(); noteInput.blur(); }
  };
  $("#timeline").ondragstart = (event) => {
    const handle = event.target.closest(".schedule-drag-handle");
    const item = handle?.closest(".schedule-item[data-schedule-id]");
    if (!state.editingItinerary || !handle || !item) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify({ day: Number(item.dataset.sourceDay), id: item.dataset.scheduleId }));
    event.dataTransfer.setDragImage(item, 28, 22);
    item.classList.add("is-dragging");
  };
  $("#timeline").ondragend = () => {
    $$(".is-dragging", $("#timeline")).forEach((element) => element.classList.remove("is-dragging"));
    clearScheduleDropIndicators();
  };
  $("#timeline").ondragover = (event) => {
    const target = scheduleDropTarget(event.target, event.clientY);
    if (!state.editingItinerary || !target) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    clearScheduleDropIndicators();
    const card = event.target.closest(".day-card");
    card?.classList.add("is-drag-target");
    target.itemElement?.classList.add(target.position === "before" ? "is-drop-before" : "is-drop-after");
  };
  $("#timeline").ondrop = (event) => {
    const target = scheduleDropTarget(event.target, event.clientY);
    if (!state.editingItinerary || !target) return;
    event.preventDefault();
    let dragged;
    try { dragged = JSON.parse(event.dataTransfer.getData("text/plain")); } catch { return; }
    if (moveScheduleItem(dragged.day, dragged.id, target.day, target.index)) renderTimeline();
  };

  let pointerDrag = null;
  $("#timeline").onpointerdown = (event) => {
    if (!state.editingItinerary || !["touch", "pen"].includes(event.pointerType)) return;
    const handle = event.target.closest(".schedule-drag-handle");
    const item = handle?.closest(".schedule-item[data-schedule-id]");
    if (!handle || !item) return;
    event.preventDefault();
    handle.setPointerCapture?.(event.pointerId);
    pointerDrag = { pointerId: event.pointerId, handle, item, startX: event.clientX, startY: event.clientY, active: false, target: null, ghost: null };
  };
  $("#timeline").onpointermove = (event) => {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);
    if (!pointerDrag.active && distance < 7) return;
    event.preventDefault();
    if (!pointerDrag.active) {
      pointerDrag.active = true;
      pointerDrag.item.classList.add("is-dragging");
      document.body.classList.add("is-touch-dragging");
      pointerDrag.ghost = pointerDrag.item.cloneNode(true);
      pointerDrag.ghost.className = "schedule-drag-ghost";
      pointerDrag.ghost.style.width = `${Math.min(pointerDrag.item.getBoundingClientRect().width, window.innerWidth - 24)}px`;
      document.body.append(pointerDrag.ghost);
    }
    pointerDrag.ghost.style.left = `${Math.max(8, Math.min(event.clientX + 14, window.innerWidth - pointerDrag.ghost.offsetWidth - 8))}px`;
    pointerDrag.ghost.style.top = `${Math.max(8, Math.min(event.clientY - 24, window.innerHeight - pointerDrag.ghost.offsetHeight - 8))}px`;
    if (event.clientY < 88) window.scrollBy({ top: -14, behavior: "auto" });
    else if (event.clientY > window.innerHeight - 104) window.scrollBy({ top: 14, behavior: "auto" });
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const target = hit ? scheduleDropTarget(hit, event.clientY) : null;
    pointerDrag.target = target;
    clearScheduleDropIndicators();
    const card = hit?.closest?.(".day-card");
    card?.classList.add("is-drag-target");
    target?.itemElement?.classList.add(target.position === "before" ? "is-drop-before" : "is-drop-after");
  };
  const endPointerDrag = (event) => {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    pointerDrag.handle.releasePointerCapture?.(event.pointerId);
    const { active, target, item, ghost } = pointerDrag;
    pointerDrag = null;
    ghost?.remove();
    item.classList.remove("is-dragging");
    document.body.classList.remove("is-touch-dragging");
    clearScheduleDropIndicators();
    if (active && target && moveScheduleItem(Number(item.dataset.sourceDay), item.dataset.scheduleId, target.day, target.index)) renderTimeline();
  };
  $("#timeline").onpointerup = endPointerDrag;
  $("#timeline").onpointercancel = endPointerDrag;
}

window.openItineraryDay = (dayNumber, { scroll = true } = {}) => {
  const card = $(`.day-card[data-day="${Number(dayNumber)}"]`);
  if (!card) return;
  if (state.editingItinerary) {
    state.collapsedEditDays.delete(Number(dayNumber));
    const toggle = $(".day-toggle", card);
    toggle?.setAttribute("aria-expanded", "true");
    const detail = $(".day-detail", card);
    if (detail) detail.hidden = false;
    if (scroll) card.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  $$(".day-toggle", $("#timeline")).forEach((button) => button.setAttribute("aria-expanded", "false"));
  $$(".day-detail", $("#timeline")).forEach((detail) => { detail.hidden = true; });
  const toggle = $(".day-toggle", card);
  toggle.setAttribute("aria-expanded", "true");
  $(".day-detail", card).hidden = false;
  state.expandedDay = Number(dayNumber);
  if (scroll) card.scrollIntoView({ behavior: "smooth", block: "start" });
};

function updateInlineTicketState(ticketId, purchased) {
  const ticketData = state.data.ticketPlanning.items.find((item) => item.id === ticketId);
  if (!ticketData) return;
  $$(`[data-inline-ticket="${ticketId}"]`).forEach((ticket) => {
    ticket.classList.toggle("is-purchased", purchased);
    ticket.querySelector("input").checked = purchased;
    ticket.querySelector("input").setAttribute("aria-label", `${purchased ? "Mark as not purchased" : "Mark as purchased"}: ${ticketTitle(ticketData)}`);
    ticket.querySelector(".schedule-ticket__status").textContent = purchased ? "Purchased" : ticketRequirement(ticketData);
  });
  const day = state.data.days.find((item) => ticketData.dayId ? item.id === ticketData.dayId : item.day === ticketData.day);
  const dayCardElement = day ? $(`[data-day="${day.day}"]`) : null;
  const badge = dayCardElement ? $(".day-ticket-summary", dayCardElement) : null;
  const dayTickets = day ? ticketsForDay(day) : [];
  const pending = dayTickets.filter((ticket) => !isTicketPurchased(ticket)).length;
  if (!badge) return;
  badge.textContent = pending ? `${pending} ticket(s) pending` : "Tickets ready";
  badge.classList.toggle("has-pending", pending > 0);
  badge.classList.toggle("is-complete", pending === 0);
}

async function loadTicketState() {
  state.purchasedTickets = new Set();
}

function saveTicketState(ticketId, completed) {
  return saveSharedChange("tickets", { id: ticketId, completed }, completed ? "upsert" : "delete").catch(console.error);
}

function appointmentModels() {
  const rental = state.data.groundTransport.rentalCar;
  const hotels = state.data.accommodations
    .filter((stay) => stay.name && stay.name !== "TBD")
    .map((stay, index) => {
      const address = stay.address || state.data.expenses?.items?.find((item) => item.description === stay.name)?.address || "";
      return {
        id: stay.id || `hotel-${index + 1}`,
        type: "Hotel",
        date: stay.checkInDate,
        endDate: stay.checkOutDate,
        title: stay.name,
        location: stay.cityOrArea || "",
        locationLabel: stay.name,
        start: stay.checkInTime || "",
        end: stay.checkOutTime || "",
        booking: stay.bookingReference || "",
        address,
        detailLabel: stay.roomType ? "Room" : "",
        detailValue: stay.roomType || ""
      };
    });
  const rentalModel = {
    id: "rental-car",
    type: "Car rental",
    date: rental.pickup.date,
    endDate: rental.dropoff.date,
    title: rental.company,
    location: `${rental.vehicle.example} · Model ${rental.vehicle.class}`,
    locationLabel: rental.company,
    start: rental.pickup.time,
    end: rental.dropoff.time,
    booking: rental.reservationNumber,
    address: rental.pickup.address || "",
    detailLabel: "Vehicle",
    detailValue: `${rental.vehicle.example} · ${rental.vehicle.class}`
  };
  const custom = state.customAppointments.map((item) => ({ ...item, custom: true }));
  return [...hotels, rentalModel, ...custom]
    .map((appointment) => ({ ...appointment, ...(state.appointmentEdits[appointment.id] || {}) }))
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function appointmentLocation(appointment) {
  const source = appointment.address || appointment.location || appointment.title;
  const cleanFallback = /^https?:\/\//i.test(appointment.location || "") ? appointment.title : (appointment.location || appointment.title);
  const resolved = locationFromInput(source, appointment.locationLabel || cleanFallback);
  const label = appointment.locationLabel || resolved.label || appointment.title;
  return { ...resolved, label, query: appointment.mapQuery || resolved.query, url: appointment.mapUrl || resolved.url };
}

function appointmentEditMarkup(appointment) {
  const types = ["Hotel", "Restaurant", "Activity", "Car rental", "Other"];
  return `<form class="appointment-inline-form" data-appointment-edit-form="${escapeHtml(appointment.id)}">
    <div class="appointment-inline-grid">
      <label>Type<select name="type">${types.map((type) => `<option${type === appointment.type ? " selected" : ""}>${escapeHtml(type)}</option>`).join("")}</select></label>
      <label>Date<input name="date" type="date" required value="${escapeHtml(appointment.date || "")}"></label>
      <label>End date<input name="endDate" type="date" value="${escapeHtml(appointment.endDate || "")}"></label>
      <label class="span-all">Title<input name="title" required maxlength="120" value="${escapeHtml(appointment.title || "")}"></label>
      <label>Start / Check-in<input name="start" maxlength="40" value="${escapeHtml(appointment.start || "")}"></label>
      <label>End / Check-out<input name="end" maxlength="40" value="${escapeHtml(appointment.end || "")}"></label>
      <label class="span-all">Location name<input name="location" maxlength="220" value="${escapeHtml(appointment.location || "")}" placeholder="Official venue or area name"></label>
      <label class="span-all">Google Maps place, address or link<input name="address" maxlength="1000" value="${escapeHtml(appointment.address || "")}" placeholder="Paste a Google Maps place URL, name, or full address"></label>
      <label class="span-all">Booking number<input name="booking" maxlength="100" value="${escapeHtml(appointment.booking || "")}"></label>
    </div>
    <div class="appointment-inline-actions"><button type="button" data-appointment-cancel>Cancel</button><button type="submit">Save</button></div>
  </form>`;
}

function renderRental() {
  const appointments = appointmentModels();
  $("#rental-provider-label").textContent = `${appointments.length} BOOKINGS`;
  $("#rental-card").innerHTML = `<div class="appointment-list">${appointments.map((appointment) => {
    const media = state.appointmentMedia[appointment.id] || appointment.attachmentUrl || "";
    const mediaMarkup = `<div class="appointment-media">
      ${media ? `<button type="button" class="appointment-thumb" data-media-src="${escapeHtml(media)}" data-media-alt="${escapeHtml(`${appointment.type} booking attachment`)}"><img src="${escapeHtml(media)}" alt="Booking attachment thumbnail"></button>` : `<span class="appointment-thumb appointment-thumb--empty" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="15" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/></svg></span>`}
      <span><label class="mini-media-action">Upload<input type="file" accept="image/*" data-appointment-upload="${escapeHtml(appointment.id)}"></label><button type="button" class="mini-media-action" data-appointment-link="${escapeHtml(appointment.id)}">Link</button></span>
    </div>`;
    const resolvedLocation = appointmentLocation(appointment);
    const locationHref = safeExternalUrl(resolvedLocation.url) || mapsSearch(resolvedLocation.query);
    const firstLabel = appointment.type === "Hotel" ? "Check-in" : appointment.type === "Car rental" ? "Pickup" : "Start";
    const secondLabel = appointment.type === "Hotel" ? "Check-out" : appointment.type === "Car rental" ? "Return" : "End";
    const editing = state.editingAppointmentId === appointment.id;
    return `<article class="appointment-card${editing ? " is-editing" : ""}" data-appointment-id="${escapeHtml(appointment.id)}">
      ${editing ? appointmentEditMarkup(appointment) : `<div class="appointment-date"><span>${escapeHtml(formatFullCompactDate(appointment.date))}</span><b>${escapeHtml(String(appointment.type || "Other").toUpperCase())}</b></div>
      <div class="appointment-body"><div class="appointment-title-row"><h3>${escapeHtml(appointment.title)}</h3><button class="appointment-edit" type="button" data-appointment-edit="${escapeHtml(appointment.id)}">Edit</button></div><p>${escapeHtml(/^https?:\/\//i.test(appointment.location || "") ? resolvedLocation.label : (appointment.location || ""))}</p>
        <dl class="appointment-times">${appointment.start ? `<div><dt>${firstLabel}</dt><dd>${escapeHtml(formatFullCompactDate(appointment.date))} · ${escapeHtml(appointment.start)}</dd></div>` : ""}${appointment.end ? `<div><dt>${secondLabel}</dt><dd>${appointment.endDate ? `${escapeHtml(formatFullCompactDate(appointment.endDate))} · ` : ""}${escapeHtml(appointment.end)}</dd></div>` : ""}</dl>
        ${(appointment.detailValue || appointment.booking) ? `<dl class="appointment-details">${appointment.detailValue ? `<div><dt>${escapeHtml(appointment.detailLabel || "Details")}</dt><dd>${escapeHtml(appointment.detailValue)}</dd></div>` : ""}${appointment.booking ? `<div><dt>Booking</dt><dd>${escapeHtml(appointment.booking)}</dd></div>` : ""}</dl>` : ""}
        ${resolvedLocation.query ? `<a class="appointment-location" href="${escapeHtml(locationHref)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${escapeHtml(resolvedLocation.label)}</span></a>` : ""}
        ${appointment.custom ? `<button class="appointment-delete" type="button" data-appointment-delete="${escapeHtml(appointment.id)}">Delete</button>` : ""}
      </div>${mediaMarkup}`}
    </article>`;
  }).join("")}</div>`;
  $("#drive-notes").replaceChildren();

  const container = $("#drive");
  container.onclick = (event) => {
    const add = event.target.closest("[data-add-appointment]");
    if (add) { event.preventDefault(); event.stopPropagation(); openAppointmentDialog(); return; }
    const edit = event.target.closest("[data-appointment-edit]");
    if (edit) { state.editingAppointmentId = edit.dataset.appointmentEdit; renderRental(); return; }
    if (event.target.closest("[data-appointment-cancel]")) { state.editingAppointmentId = null; renderRental(); return; }
    const mediaButton = event.target.closest("[data-media-src]");
    if (mediaButton) { openMediaLightbox(mediaButton.dataset.mediaSrc, mediaButton.dataset.mediaAlt); return; }
    const linkButton = event.target.closest("[data-appointment-link]");
    if (linkButton) {
      const value = window.prompt("Paste an image link (https://…)", state.appointmentMedia[linkButton.dataset.appointmentLink] || "");
      if (value === null) return;
      const safe = /^https?:\/\//i.test(value.trim()) ? safeExternalUrl(value) : "";
      if (value.trim() && !safe) { window.alert("Please enter a valid http(s) image link."); return; }
      if (safe) state.appointmentMedia[linkButton.dataset.appointmentLink] = safe;
      else delete state.appointmentMedia[linkButton.dataset.appointmentLink];
      savePersonalState(); renderRental(); return;
    }
    const remove = event.target.closest("[data-appointment-delete]");
    if (remove) {
      state.customAppointments = state.customAppointments.filter((item) => item.id !== remove.dataset.appointmentDelete);
      delete state.appointmentMedia[remove.dataset.appointmentDelete];
      savePersonalState(); renderRental();
    }
  };
  container.onsubmit = (event) => {
    const form = event.target.closest("[data-appointment-edit-form]");
    if (!form) return;
    event.preventDefault();
    const values = Object.fromEntries(["type", "date", "endDate", "title", "start", "end", "location", "address", "booking"].map((key) => [key, String(new FormData(form).get(key) || "").trim()]));
    const parsed = locationFromInput(values.address || values.location, /^https?:\/\//i.test(values.location) ? values.title : (values.location || values.title));
    values.locationLabel = parsed.source === "address" && values.location ? values.location : parsed.label;
    values.mapQuery = parsed.query;
    values.mapUrl = parsed.url;
    if (/^https?:\/\//i.test(values.location)) values.location = parsed.label;
    state.appointmentEdits[form.dataset.appointmentEditForm] = values;
    state.editingAppointmentId = null;
    savePersonalState();
    renderRental();
  };
  container.onchange = (event) => {
    const input = event.target.closest("[data-appointment-upload]");
    const file = input?.files?.[0];
    if (!file) return;
    imageFileToDataUrl(file).then((source) => {
      state.appointmentMedia[input.dataset.appointmentUpload] = source;
      savePersonalState(); renderRental();
    }).catch((error) => window.alert(error.message));
  };
}

function openAppointmentDialog() {
  const dialog = $("#appointment-dialog");
  const form = $("#appointment-form");
  form.reset();
  form.elements.date.value = state.data.trip.startDate;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  window.setTimeout(() => form.elements.title.focus(), 0);
}

function setupAppointmentDialog() {
  const dialog = $("#appointment-dialog");
  const form = $("#appointment-form");
  if (!dialog || !form) return;
  dialog.querySelectorAll("[data-close-appointment]").forEach((button) => { button.onclick = () => dialog.close?.(); });
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const id = `appointment-${Date.now()}`;
    const item = Object.fromEntries(["type", "date", "title", "start", "end", "booking"].map((key) => [key, String(data.get(key) || "").trim()]));
    item.id = id;
    const locationInput = String(data.get("location") || "").trim();
    const parsedLocation = locationFromInput(locationInput, item.title);
    item.location = parsedLocation.label;
    item.address = locationInput;
    item.locationLabel = parsedLocation.label;
    item.mapQuery = parsedLocation.query;
    item.mapUrl = parsedLocation.url;
    const file = form.elements.attachmentFile.files?.[0];
    if (file) state.appointmentMedia[id] = await imageFileToDataUrl(file);
    state.customAppointments.push(item);
    savePersonalState();
    dialog.close?.();
    $("#appointments-panel").open = true;
    renderRental();
  };
}

function personalStorageKey(type) { return `travel-plan:${type}:${state.data.metadata.tripId}`; }

let workspacePushTimer = 0;
let workspaceLastUpdatedAt = null;
let workspaceSyncReady = false;

function personalStateSnapshot() {
  return {
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    dayNotes: state.dayNotes,
    dayPhotos: state.dayPhotos,
    dayTitles: state.dayTitles,
    itinerarySchedule: state.itinerarySchedule,
    itineraryLocations: state.itineraryLocations,
    appointmentMedia: state.appointmentMedia,
    appointmentEdits: state.appointmentEdits,
    customAppointments: state.customAppointments,
    expenses: state.expenses
  };
}

const workspaceObjectFields = ["dayNotes", "dayPhotos", "dayTitles", "itineraryLocations", "appointmentMedia", "appointmentEdits"];

function localWorkspaceSnapshot() {
  return { ...personalStateSnapshot(), savedAt: localStorage.getItem(personalStorageKey("saved-at")) || "" };
}

function mergeWorkspaceSnapshots(remote, local) {
  const localIsNewer = Date.parse(local.savedAt || "") > Date.parse(remote.savedAt || "");
  const newer = localIsNewer ? local : remote;
  const older = localIsNewer ? remote : local;
  const merged = { ...remote, schemaVersion: 1, savedAt: newer.savedAt || remote.savedAt || local.savedAt || "" };
  workspaceObjectFields.forEach((field) => { merged[field] = { ...(older[field] || {}), ...(newer[field] || {}) }; });
  merged.itinerarySchedule = {};
  for (const dayKey of new Set([...Object.keys(remote.itinerarySchedule || {}), ...Object.keys(local.itinerarySchedule || {})])) {
    const primary = newer.itinerarySchedule?.[dayKey];
    const secondary = older.itinerarySchedule?.[dayKey];
    const chosen = Array.isArray(primary) ? primary : Array.isArray(secondary) ? secondary : [];
    const chosenIds = new Set(chosen.map((item) => String(item.id)));
    merged.itinerarySchedule[dayKey] = [
      ...chosen,
      ...(Array.isArray(secondary) ? secondary.filter((item) => !chosenIds.has(String(item.id))) : [])
    ];
  }
  for (const field of ["customAppointments", "expenses"]) {
    const records = new Map();
    for (const item of newer[field] || []) records.set(String(item?.id || JSON.stringify(item)), item);
    for (const item of older[field] || []) {
      const key = String(item?.id || JSON.stringify(item));
      if (!records.has(key)) records.set(key, item);
    }
    merged[field] = [...records.values()];
  }
  return merged;
}

function workspaceContent(payload) {
  const { savedAt, ...content } = payload || {};
  return JSON.stringify(content);
}

function applyPersonalStateSnapshot(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const objectFields = ["dayNotes", "dayPhotos", "dayTitles", "itinerarySchedule", "itineraryLocations", "appointmentMedia", "appointmentEdits"];
  objectFields.forEach((field) => { state[field] = payload[field] && typeof payload[field] === "object" && !Array.isArray(payload[field]) ? structuredClone(payload[field]) : {}; });
  state.customAppointments = Array.isArray(payload.customAppointments) ? structuredClone(payload.customAppointments) : [];
  state.expenses = Array.isArray(payload.expenses) ? structuredClone(payload.expenses) : structuredClone(state.data.expenses?.items || []);
  applySavedItinerarySchedule();
  return true;
}

function workspaceEndpoint() {
  const base = String(state.config?.persistence?.apiBase || "/api/trip").replace(/\/+$/, "");
  return `${base}/${encodeURIComponent(state.data.metadata.tripId)}?workspace=1`;
}

async function requestWorkspace(method = "GET", payload) {
  const response = await fetch(workspaceEndpoint(), method === "GET" ? { cache: "no-store" } : {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload })
  });
  const type = response.headers.get("content-type") || "";
  if (!response.ok || !type.includes("application/json")) throw new Error(`Workspace sync API unavailable (${response.status})`);
  return response.json();
}

function renderPersonalViews() {
  if (moduleEnabled("itinerary")) renderTimeline();
  if (moduleEnabled("driving")) renderRental();
  if (moduleEnabled("ledger")) renderExpenses();
}

async function loadWorkspaceState({ refreshViews = false } = {}) {
  if (!sharedBackendAvailable()) return;
  if (state.editingItinerary || state.editingAppointmentId) return;
  const remote = await requestWorkspace();
  const migrationKey = personalStorageKey("workspace-migrated-v1");
  if (!remote.payload) {
    const created = await requestWorkspace("POST", personalStateSnapshot());
    workspaceLastUpdatedAt = created.updatedAt || null;
    localStorage.setItem(migrationKey, "1");
  } else if (remote.updatedAt !== workspaceLastUpdatedAt) {
    const local = localWorkspaceSnapshot();
    const reconcile = Boolean(local.savedAt && Date.parse(local.savedAt) > Date.parse(remote.payload.savedAt || ""));
    const nextPayload = reconcile ? mergeWorkspaceSnapshots(remote.payload, local) : remote.payload;
    if (workspaceContent(nextPayload) !== workspaceContent(remote.payload)) {
      nextPayload.savedAt = new Date().toISOString();
      const merged = await requestWorkspace("POST", nextPayload);
      workspaceLastUpdatedAt = merged.updatedAt || remote.updatedAt || null;
    } else {
      workspaceLastUpdatedAt = remote.updatedAt || null;
    }
    applyPersonalStateSnapshot(nextPayload);
    localStorage.setItem(migrationKey, "1");
    savePersonalState({ syncRemote: false, savedAt: nextPayload.savedAt || remote.updatedAt });
    if (refreshViews) renderPersonalViews();
  }
  workspaceSyncReady = true;
}

function scheduleWorkspacePush() {
  if (!workspaceSyncReady || !sharedBackendAvailable()) return;
  window.clearTimeout(workspacePushTimer);
  workspacePushTimer = window.setTimeout(async () => {
    try {
      const local = localWorkspaceSnapshot();
      const remote = await requestWorkspace();
      const nextPayload = remote.payload && remote.updatedAt !== workspaceLastUpdatedAt
        ? mergeWorkspaceSnapshots(remote.payload, local)
        : local;
      if (workspaceContent(nextPayload) === workspaceContent(remote.payload)) {
        workspaceLastUpdatedAt = remote.updatedAt || workspaceLastUpdatedAt;
        return;
      }
      nextPayload.savedAt = new Date().toISOString();
      const saved = await requestWorkspace("POST", nextPayload);
      workspaceLastUpdatedAt = saved.updatedAt || workspaceLastUpdatedAt;
      if (nextPayload !== local && !state.editingItinerary && !state.editingAppointmentId) {
        applyPersonalStateSnapshot(nextPayload);
        savePersonalState({ syncRemote: false, savedAt: nextPayload.savedAt });
        renderPersonalViews();
      }
    } catch (error) {
      console.error("Cross-device workspace sync failed", error);
    }
  }, 450);
}

function setupWorkspaceRefresh() {
  if (!sharedBackendAvailable()) return;
  const refresh = () => {
    if (document.visibilityState !== "visible") return;
    loadWorkspaceState({ refreshViews: true }).catch((error) => console.error("Cross-device workspace refresh failed", error));
  };
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("focus", refresh);
  window.setInterval(refresh, 12000);
}

function itineraryDayKey(day) {
  return day.id || `day-${String(day.day).padStart(2, "0")}`;
}

function captureItinerarySchedule() {
  state.itinerarySchedule = Object.fromEntries(state.data.days.map((day) => [itineraryDayKey(day), structuredClone(day.schedule || [])]));
}

function applySavedItinerarySchedule() {
  state.data.days.forEach((day) => {
    const saved = state.itinerarySchedule[itineraryDayKey(day)];
    if (Array.isArray(saved)) day.schedule = structuredClone(saved);
  });
}

function loadPersonalState() {
  try { state.dayNotes = JSON.parse(localStorage.getItem(personalStorageKey("day-notes")) || "{}"); } catch { state.dayNotes = {}; }
  try { state.dayPhotos = JSON.parse(localStorage.getItem(personalStorageKey("day-photos")) || "{}"); } catch { state.dayPhotos = {}; }
  try { state.dayTitles = JSON.parse(localStorage.getItem(personalStorageKey("day-titles")) || "{}"); } catch { state.dayTitles = {}; }
  try { state.itinerarySchedule = JSON.parse(localStorage.getItem(personalStorageKey("itinerary-schedule")) || "{}"); } catch { state.itinerarySchedule = {}; }
  try { state.itineraryLocations = JSON.parse(localStorage.getItem(personalStorageKey("itinerary-locations")) || "{}"); } catch { state.itineraryLocations = {}; }
  applySavedItinerarySchedule();
  try { state.appointmentMedia = JSON.parse(localStorage.getItem(personalStorageKey("appointment-media")) || "{}"); } catch { state.appointmentMedia = {}; }
  try { state.appointmentEdits = JSON.parse(localStorage.getItem(personalStorageKey("appointment-edits")) || "{}"); } catch { state.appointmentEdits = {}; }
  try { state.customAppointments = JSON.parse(localStorage.getItem(personalStorageKey("custom-appointments")) || "[]"); } catch { state.customAppointments = []; }
  if (!Array.isArray(state.customAppointments)) state.customAppointments = [];
  try {
    const saved = JSON.parse(localStorage.getItem(personalStorageKey("expenses")) || "null");
    state.expenses = Array.isArray(saved) ? saved : structuredClone(state.data.expenses?.items || []);
  } catch { state.expenses = structuredClone(state.data.expenses?.items || []); }
}

function savePersonalState({ syncRemote = true, savedAt = null } = {}) {
  localStorage.setItem(personalStorageKey("day-notes"), JSON.stringify(state.dayNotes));
  localStorage.setItem(personalStorageKey("day-photos"), JSON.stringify(state.dayPhotos));
  localStorage.setItem(personalStorageKey("day-titles"), JSON.stringify(state.dayTitles));
  localStorage.setItem(personalStorageKey("itinerary-schedule"), JSON.stringify(state.itinerarySchedule));
  localStorage.setItem(personalStorageKey("itinerary-locations"), JSON.stringify(state.itineraryLocations));
  localStorage.setItem(personalStorageKey("appointment-media"), JSON.stringify(state.appointmentMedia));
  localStorage.setItem(personalStorageKey("appointment-edits"), JSON.stringify(state.appointmentEdits));
  localStorage.setItem(personalStorageKey("custom-appointments"), JSON.stringify(state.customAppointments));
  localStorage.setItem(personalStorageKey("expenses"), JSON.stringify(state.expenses));
  localStorage.setItem(personalStorageKey("saved-at"), savedAt || new Date().toISOString());
  if (syncRemote) scheduleWorkspacePush();
}

const moneyText = (currency, amount) => new Intl.NumberFormat("en-SG", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(amount) || 0);

function supportedCurrencies() {
  const priority = ["SGD", "JPY", "USD", "EUR", "GBP", "AUD", "CNY", "HKD", "KRW", "MYR", "THB", "TWD"];
  try { return [...priority, ...Intl.supportedValuesOf("currency").filter((code) => !priority.includes(code))]; }
  catch { return [...priority, "CAD", "CHF", "NZD"]; }
}

const expenseCategories = [
  ["Transportation", "🚆"], ["Accommodation", "🏨"], ["Dining", "🍜"],
  ["Shopping", "🛍️"], ["Tickets", "🎟️"], ["Custom", "✨"]
];
const expenseCategoryIcon = (category) => category === "Hotel" ? "🏨" : expenseCategories.find(([name]) => name === category)?.[1] || "✨";

async function exchangeRateToSgd(currency) {
  if (currency === "SGD") return { rate: 1, source: "SGD base currency" };
  try {
    const response = await fetch(`https://api.frankfurter.dev/v2/rate/${currency.toLowerCase()}/sgd`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (Number(payload.rate) > 0) return { rate: Number(payload.rate), source: "Live reference rate" };
  } catch (error) { console.info("Live exchange rate unavailable; using saved reference when available.", error); }
  const fallback = Number(state.data.expenses?.referenceRates?.[currency]);
  return { rate: fallback > 0 ? fallback : null, source: fallback > 0 ? "Saved fallback rate" : "Rate unavailable" };
}

function renderExpenses() {
  const root = $("#spending-root");
  if (!root) return;
  const currencies = supportedCurrencies();
  const items = [...state.expenses].sort((a, b) => a.date.localeCompare(b.date));
  const total = items.reduce((sum, item) => sum + Number(item.sgdAmount || 0), 0);
  const groupedItems = items.reduce((groups, item) => {
    if (!groups.has(item.date)) groups.set(item.date, []);
    groups.get(item.date).push(item);
    return groups;
  }, new Map());
  const groupedExpenseMarkup = [...groupedItems.entries()].map(([date, dailyItems]) => {
    const dayTotal = dailyItems.reduce((sum, item) => sum + Number(item.sgdAmount || 0), 0);
    return `<details class="expense-day"><summary><span><b>${escapeHtml(formatFullCompactDate(date))}</b><small>${dailyItems.length} ${dailyItems.length === 1 ? "expense" : "expenses"}</small></span><strong>${escapeHtml(moneyText("SGD", dayTotal))}</strong></summary><div>${dailyItems.map((item) => `<article class="expense-row expense-row--grouped">
      <div><strong>${escapeHtml(item.description)}</strong><span>${expenseCategoryIcon(item.category)} ${escapeHtml(item.category || "Custom")}${item.customCategory ? ` · ${escapeHtml(item.customCategory)}` : ""}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</span>${item.address ? `<a href="${mapsSearch(item.address)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.address)} ↗</a>` : ""}</div>
      <div class="expense-values"><b>${escapeHtml(moneyText(item.originalCurrency, item.originalAmount))}</b><span>${escapeHtml(moneyText("SGD", item.sgdAmount))}</span></div><button type="button" class="expense-delete" data-expense-delete="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.description)}">×</button>
    </article>`).join("")}</div></details>`;
  }).join("");
  $("#spending-total").textContent = moneyText("SGD", total);
  root.innerHTML = `<form class="expense-form" id="expense-form">
    <div><label for="expense-date">Date</label><input id="expense-date" name="date" type="date" min="${escapeHtml(state.data.trip.startDate)}" max="${escapeHtml(state.data.trip.endDate)}" required></div>
    <div><label for="expense-description">Expense</label><input id="expense-description" name="description" placeholder="Dinner, tickets, shopping…" required></div>
    <div><label for="expense-category">Category</label><select id="expense-category" name="category">${expenseCategories.map(([category, icon]) => `<option value="${category}">${icon} ${category}</option>`).join("")}</select></div>
    <div class="expense-custom-category is-disabled"><label for="expense-custom-category">Custom category</label><input id="expense-custom-category" name="customCategory" maxlength="40" placeholder="Select Custom to edit" disabled></div>
    <div><label for="expense-amount">Amount</label><input id="expense-amount" name="amount" type="number" min="0" step="0.01" inputmode="decimal" required></div>
    <div><label for="expense-currency">Currency</label><select id="expense-currency" name="currency">${currencies.map((currency, index) => `${index === 12 ? `<option disabled>──────────</option>` : ""}<option${currency === "SGD" ? " selected" : ""}>${currency}</option>`).join("")}</select></div>
    <div class="expense-address"><label for="expense-address">Address or map location</label><input id="expense-address" name="address" placeholder="Optional address or place name"></div>
    <p class="expense-conversion" id="expense-conversion" role="status">Enter an amount to see the SGD estimate.</p>
    <button type="submit">Add expense</button>
  </form>
  <div class="expense-list">${items.length ? groupedExpenseMarkup : `<p class="expense-empty">No expenses yet.</p>`}</div>`;
  const form = $("#expense-form", root);
  let previewToken = 0;
  const updatePreview = async () => {
    const token = ++previewToken;
    const amount = Number(form.amount.value);
    if (!(amount > 0)) { $("#expense-conversion").textContent = "Enter an amount to see the SGD estimate."; return; }
    $("#expense-conversion").textContent = "Checking the reference rate…";
    const result = await exchangeRateToSgd(form.currency.value);
    if (token !== previewToken) return;
    $("#expense-conversion").textContent = result.rate ? `≈ ${moneyText("SGD", amount * result.rate)} · ${result.source}` : "SGD estimate unavailable; the entry can still be saved.";
  };
  form.amount.addEventListener("input", updatePreview);
  form.currency.addEventListener("change", updatePreview);
  form.category.addEventListener("change", () => {
    const custom = $(".expense-custom-category", form);
    const customInput = custom.querySelector("input");
    const enabled = form.category.value === "Custom";
    custom.classList.toggle("is-disabled", !enabled);
    customInput.disabled = !enabled;
    customInput.required = enabled;
    customInput.placeholder = enabled ? "Enter a category" : "Select Custom to edit";
  });
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const originalAmount = Number(data.get("amount"));
    const originalCurrency = String(data.get("currency"));
    const conversion = await exchangeRateToSgd(originalCurrency);
    state.expenses.push({ id: `expense-${Date.now()}`, date: String(data.get("date")), category: String(data.get("category") || "Custom"), customCategory: String(data.get("customCategory") || ""), description: String(data.get("description")), originalAmount, originalCurrency, rateUsed: conversion.rate, sgdAmount: conversion.rate ? Number((originalAmount * conversion.rate).toFixed(2)) : 0, address: String(data.get("address") || ""), note: conversion.source });
    savePersonalState();
    renderExpenses();
  };
  root.onclick = (event) => {
    const button = event.target.closest("[data-expense-delete]");
    if (!button) return;
    state.expenses = state.expenses.filter((item) => item.id !== button.dataset.expenseDelete);
    savePersonalState();
    renderExpenses();
  };
}

function loadTodoState() { state.todos = []; }

function createRuntimeAdapters() {
  const storage = window.TravelRuntimeStorage;
  if (!storage?.createAdapter) throw new Error("runtime-storage.js is required");
  const persistence = state.config.persistence || { mode: "local" };
  const runtimeMode = sharedBackendAvailable() ? persistence.mode : "local";
  const sharedCollections = new Set(Array.isArray(persistence.sharedCollections)
    ? persistence.sharedCollections
    : ["todos", "tickets", "ledger"]);
  const tripId = state.data.metadata.tripId;
  const enabledCollections = [
    ...(moduleEnabled("todo") ? ["todos"] : []),
    ...(moduleEnabled("itinerary") ? ["tickets"] : [])
  ];
  const localCollections = enabledCollections.filter((collection) => runtimeMode !== "d1" || !sharedCollections.has(collection));
  const d1Collections = enabledCollections.filter((collection) => runtimeMode === "d1" && sharedCollections.has(collection));
  const localAdapter = localCollections.length ? storage.createAdapter({ mode: "local", tripId, collections: localCollections }) : null;
  const d1Adapter = d1Collections.length ? storage.createAdapter({
    mode: "d1",
    tripId,
    apiBase: persistence.apiBase || "/api/trip",
    collections: d1Collections
  }) : null;
  state.runtimeAdapters = {};
  localCollections.forEach((collection) => { state.runtimeAdapters[collection] = localAdapter; });
  d1Collections.forEach((collection) => { state.runtimeAdapters[collection] = d1Adapter; });
}

async function loadSharedState() {
  const adapters = [...new Set(Object.values(state.runtimeAdapters).filter(Boolean))];
  const todoAdapter = state.runtimeAdapters.todos;
  let hasLocalTodoSnapshot = true;
  if (todoAdapter?.mode === "local" && todoAdapter.storageKey) {
    try { hasLocalTodoSnapshot = localStorage.getItem(todoAdapter.storageKey) !== null; }
    catch { hasLocalTodoSnapshot = false; }
  }
  const snapshots = await Promise.all(adapters.map(async (adapter) => [adapter, await adapter.load()]));
  const snapshotFor = (collection) => snapshots.find(([adapter]) => adapter === state.runtimeAdapters[collection])?.[1] || {};
  const todoSnapshot = snapshotFor("todos");
  const ticketSnapshot = snapshotFor("tickets");
  state.todos = Array.isArray(todoSnapshot.todos) ? todoSnapshot.todos : [];
  state.purchasedTickets = new Set((Array.isArray(ticketSnapshot.tickets) ? ticketSnapshot.tickets : []).filter((item) => item.completed).map((item) => item.id));
  const authoredTodos = state.data.preTrip?.todoItems || state.data.preTrip?.packingItems || [];
  if (todoAdapter?.mode === "local" && !hasLocalTodoSnapshot && !state.todos.length && authoredTodos.length) {
    state.todos = authoredTodos.map((item, index) => ({
      id: String(item.id || `todo-initial-${index + 1}`),
      heading: String(item.heading || item.title || item.text || "Reminder").trim(),
      subheading: String(item.subheading || "").trim(),
      body: String(item.body || "").trim(),
      completed: Boolean(item.completed)
    })).filter((item) => item.heading);
    await Promise.all(state.todos.map((todo) => todoAdapter.applyChange("todos", todo, "upsert")));
  }
}

async function saveSharedChange(collection, value, op = "upsert") {
  const adapter = state.runtimeAdapters[collection];
  if (!adapter) return null;
  return adapter.applyChange(collection, value, op);
}

function saveTodoState() { return Promise.all(state.todos.map((todo) => saveSharedChange("todos", todo))); }

function normalizePreparationTopic(todo, index = 0) {
  todo = todo && typeof todo === "object" ? todo : {};
  const legacyText = String(todo.subheading || todo.text || "").trim();
  const legacyNote = String(todo.body || "").trim();
  const items = Array.isArray(todo.items) ? todo.items : (legacyText || legacyNote || todo.completed ? [{
    id: `${todo.id || `prep-${index + 1}`}-item-1`,
    text: legacyText || "Preparation item",
    note: legacyNote,
    completed: Boolean(todo.completed)
  }] : []);
  return {
    id: String(todo.id || `prep-${Date.now()}-${index}`),
    heading: String(todo.heading || todo.title || "New preparation").trim() || "New preparation",
    note: String(todo.note || ""),
    expanded: todo.expanded !== false,
    items: items.map((item, itemIndex) => {
      const legacyChild = String(item.note || item.body || "").trim();
      const children = Array.isArray(item.children) ? item.children : (legacyChild ? [{
        id: `${item.id || `prep-item-${itemIndex + 1}`}-child-1`, text: legacyChild, completed: false
      }] : []);
      return {
        id: String(item.id || `${todo.id || `prep-${index + 1}`}-item-${itemIndex + 1}`),
        text: String(item.text || item.heading || "Preparation section"),
        completed: Boolean(item.completed),
        children: children.map((child, childIndex) => ({
          id: String(child.id || `${item.id || `prep-item-${itemIndex + 1}`}-child-${childIndex + 1}`),
          text: String(child.text || child.heading || "Preparation item"),
          completed: Boolean(child.completed)
        }))
      };
    })
  };
}

function resizePreparationTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(Number(textarea.dataset.minHeight || 30), textarea.scrollHeight)}px`;
}

function resizePreparationTextareas(root = document) {
  $$('textarea[data-prep-autogrow]', root).forEach(resizePreparationTextarea);
}

function renderTodoList() {
  state.todos = state.todos.map(normalizePreparationTopic);
  const allItems = state.todos.flatMap((topic) => topic.items.flatMap((item) => [item, ...item.children]));
  const completed = allItems.filter((item) => item.completed).length;
  $("#todo-progress").textContent = `${completed} / ${allItems.length}`;
  $("#todo-list").innerHTML = state.todos.length ? state.todos.map((topic) => {
    return `
    <article class="prep-topic" data-todo-id="${escapeHtml(topic.id)}">
      <header class="prep-topic__header">
        <button class="prep-topic-toggle" type="button" aria-expanded="${topic.expanded}" aria-label="${topic.expanded ? "Collapse" : "Expand"} ${escapeHtml(topic.heading)}"><span aria-hidden="true"></span></button>
        <textarea class="prep-topic-heading" data-todo-field="heading" data-prep-autogrow data-min-height="36" rows="1" maxlength="180" aria-label="Preparation heading" placeholder="Preparation heading">${escapeHtml(topic.heading)}</textarea>
        <button type="button" class="todo-delete" aria-label="Delete ${escapeHtml(topic.heading)}">×</button>
      </header>
      <div class="prep-topic__body" ${topic.expanded ? "" : "hidden"}>
        <textarea class="prep-topic-note" data-todo-field="note" data-prep-autogrow data-min-height="34" rows="1" maxlength="800" aria-label="Note for ${escapeHtml(topic.heading)}" placeholder="Take note…">${escapeHtml(topic.note)}</textarea>
        <div class="prep-subitems">
          ${topic.items.map((item) => `
          <div class="prep-subitem${item.completed ? " is-complete" : ""}" data-prep-item-id="${escapeHtml(item.id)}">
            <label class="prep-subitem-check"><input type="checkbox" ${item.completed ? "checked" : ""} aria-label="Complete ${escapeHtml(item.text)}"><span class="todo-check" aria-hidden="true">✓</span></label>
            <div class="prep-subitem-copy">
              <textarea class="prep-subitem-text" data-prep-field="text" data-prep-autogrow data-min-height="32" rows="1" maxlength="500" aria-label="Preparation section" placeholder="Preparation section">${escapeHtml(item.text)}</textarea>
              <div class="prep-subsubitems">
                ${item.children.map((child) => `
                <div class="prep-subsubitem${child.completed ? " is-complete" : ""}" data-prep-child-id="${escapeHtml(child.id)}">
                  <label class="prep-subsubitem-check"><input type="checkbox" ${child.completed ? "checked" : ""} aria-label="Complete ${escapeHtml(child.text)}"><span class="todo-check" aria-hidden="true">✓</span></label>
                  <textarea class="prep-subsubitem-text" data-prep-child-field="text" data-prep-autogrow data-min-height="30" rows="1" maxlength="500" aria-label="Nested preparation item" placeholder="Add an item…">${escapeHtml(child.text)}</textarea>
                  <button type="button" class="prep-subsubitem-delete" aria-label="Delete ${escapeHtml(child.text)}">×</button>
                </div>`).join("")}
              </div>
              <button type="button" class="prep-add-item">＋ Add item</button>
            </div>
            <button type="button" class="prep-subitem-delete" aria-label="Delete ${escapeHtml(item.text)}">×</button>
          </div>`).join("")}
        </div>
        <button type="button" class="prep-add-section">＋ Add section</button>
      </div>
    </article>`;
  }).join("") : `<p class="todo-empty">No preparation topics yet. Add one whenever you are ready.</p>`;
  resizePreparationTextareas($("#todo-list"));
}

function renderTravelPrep() {
  renderTodoList();
  const addTodo = (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    const todo = { id: `prep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, heading: "New preparation", note: "", expanded: true, items: [] };
    state.todos.push(todo);
    $("#todo-panel").open = true;
    saveSharedChange("todos", todo).catch(console.error);
    renderTodoList();
    window.setTimeout(() => {
      const textarea = $(`[data-todo-id="${todo.id}"] .prep-topic-heading`);
      textarea?.focus(); textarea?.select();
    }, 0);
  };
  $("#todo-add").onclick = addTodo;
  $("#todo-add-bottom").onclick = addTodo;
  $("#todo-list").onchange = (event) => {
    const topicElement = event.target.closest("[data-todo-id]");
    if (!topicElement) return;
    const topic = state.todos.find((entry) => entry.id === topicElement.dataset.todoId);
    const itemElement = event.target.closest("[data-prep-item-id]");
    const item = itemElement && topic.items.find((entry) => entry.id === itemElement.dataset.prepItemId);
    const childElement = event.target.closest("[data-prep-child-id]");
    const child = childElement && item?.children.find((entry) => entry.id === childElement.dataset.prepChildId);
    let shouldRender = false;
    if (child && event.target.matches("input[type='checkbox']")) {
      child.completed = event.target.checked;
      item.completed = item.children.length > 0 && item.children.every((entry) => entry.completed);
      shouldRender = true;
    }
    else if (child && event.target.matches("[data-prep-child-field]")) child[event.target.dataset.prepChildField] = event.target.value.trim();
    else if (item && event.target.matches(".prep-subitem-check input[type='checkbox']")) {
      item.completed = event.target.checked;
      item.children.forEach((entry) => { entry.completed = item.completed; });
      shouldRender = true;
    }
    else if (item && event.target.matches("[data-prep-field]")) item[event.target.dataset.prepField] = event.target.value.trim();
    else if (event.target.matches("[data-todo-field]")) topic[event.target.dataset.todoField] = event.target.value.trim();
    else return;
    saveSharedChange("todos", topic).catch(console.error);
    if (shouldRender) renderTodoList();
  };
  $("#todo-list").onclick = (event) => {
    const topicElement = event.target.closest("[data-todo-id]");
    if (!topicElement) return;
    const topic = state.todos.find((entry) => entry.id === topicElement.dataset.todoId);
    if (event.target.closest(".prep-topic-toggle")) {
      topic.expanded = !topic.expanded;
      saveSharedChange("todos", topic).catch(console.error);
      renderTodoList();
    } else if (event.target.closest(".prep-add-section")) {
      const item = { id: `prep-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: "New preparation section", completed: false, children: [] };
      topic.items.push(item);
      saveSharedChange("todos", topic).catch(console.error);
      renderTodoList();
      window.setTimeout(() => { const textarea = $(`[data-prep-item-id="${item.id}"] .prep-subitem-text`); textarea?.focus(); textarea?.select(); }, 0);
    } else if (event.target.closest(".prep-add-item")) {
      const itemElement = event.target.closest("[data-prep-item-id]");
      const item = topic.items.find((entry) => entry.id === itemElement.dataset.prepItemId);
      const child = { id: `prep-child-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: "New item", completed: false };
      item.children.push(child);
      item.completed = false;
      saveSharedChange("todos", topic).catch(console.error);
      renderTodoList();
      window.setTimeout(() => { const textarea = $(`[data-prep-child-id="${child.id}"] .prep-subsubitem-text`); textarea?.focus(); textarea?.select(); }, 0);
    } else if (event.target.closest(".prep-subsubitem-delete")) {
      const itemElement = event.target.closest("[data-prep-item-id]");
      const childElement = event.target.closest("[data-prep-child-id]");
      const item = topic.items.find((entry) => entry.id === itemElement.dataset.prepItemId);
      item.children = item.children.filter((child) => child.id !== childElement.dataset.prepChildId);
      item.completed = item.children.length > 0 && item.children.every((child) => child.completed);
      saveSharedChange("todos", topic).catch(console.error);
      renderTodoList();
    } else if (event.target.closest(".prep-subitem-delete")) {
      const itemElement = event.target.closest("[data-prep-item-id]");
      topic.items = topic.items.filter((item) => item.id !== itemElement.dataset.prepItemId);
      saveSharedChange("todos", topic).catch(console.error);
      renderTodoList();
    } else if (event.target.closest(".todo-delete")) {
      state.todos = state.todos.filter((entry) => entry.id !== topic.id);
      saveSharedChange("todos", { id: topic.id }, "delete").catch(console.error);
      renderTodoList();
    }
  };
  $("#todo-list").oninput = (event) => {
    const textarea = event.target.closest("textarea[data-prep-autogrow]");
    if (textarea) resizePreparationTextarea(textarea);
  };
}

function safeExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function localAssetUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return "";
  try {
    const url = new URL(raw, location.href);
    return url.origin === location.origin ? url.href : "";
  } catch {
    return "";
  }
}

let ticketDialogOpener = null;

function openTicketDialog(ticketId, opener) {
  const ticket = state.data.ticketPlanning?.items?.find((item) => item.id === ticketId);
  const dialog = $("#ticket-dialog");
  if (!ticket || !dialog) return;
  ticketDialogOpener = opener || null;
  $("#ticket-dialog-title").textContent = ticketTitle(ticket);
  const document = ticketDocument(ticket);
  const localDocument = localAssetUrl(document?.url);
  const externalDocument = !localDocument ? safeExternalUrl(document?.url) : "";
  const officialUrl = safeExternalUrl(ticket.officialUrl || ticket.booking?.officialUrl || ticket.booking?.purchaseUrl);
  const extension = localDocument.split(/[?#]/)[0].split(".").at(-1)?.toLocaleLowerCase();
  let preview = "";
  if (localDocument && ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(extension)) {
    preview = `<img class="ticket-dialog__preview" src="${escapeHtml(localDocument)}" alt="${escapeHtml(ticketTitle(ticket))}">`;
  } else if (localDocument) {
    preview = `<iframe class="ticket-dialog__preview" src="${escapeHtml(localDocument)}" title="${escapeHtml(ticketTitle(ticket))}" sandbox="allow-same-origin" referrerpolicy="no-referrer"></iframe>`;
  }
  const links = [
    localDocument ? `<a href="${escapeHtml(localDocument)}" target="_blank" rel="noopener noreferrer">Open ticket in a new window ↗</a>` : "",
    externalDocument ? `<a href="${escapeHtml(externalDocument)}" target="_blank" rel="noopener noreferrer">${escapeHtml(document?.label || "View ticket")} ↗</a>` : "",
    officialUrl ? `<a href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener noreferrer">Open official page ↗</a>` : ""
  ].filter(Boolean).join("");
  $("#ticket-dialog-body").innerHTML = `
    <p class="ticket-dialog__status">${escapeHtml(isTicketPurchased(ticket) ? "Marked as purchased" : ticketRequirement(ticket))}</p>
    ${ticketGuidance(ticket) ? `<p class="ticket-dialog__guidance">${escapeHtml(ticketGuidance(ticket))}</p>` : ""}
    ${preview || (!links ? `<p class="ticket-dialog__empty">No ticket file or official link is available for preview.</p>` : "")}
    ${links ? `<div class="ticket-dialog__links">${links}</div>` : ""}`;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  $("#ticket-dialog-close").focus();
}

function setupTicketDialog() {
  const dialog = $("#ticket-dialog");
  if (!dialog) return;
  const close = () => {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  };
  $("#ticket-dialog-close").onclick = close;
  dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
  dialog.addEventListener("close", () => {
    const body = $("#ticket-dialog-body");
    if (!body.querySelector(".ticket-dialog__preview--pdf")) body.replaceChildren();
    ticketDialogOpener?.focus({ preventScroll: true });
    ticketDialogOpener = null;
  });
}

function setupPlaceMap() {
  const panel = $("#place-map");
  const frame = $("#place-map-frame");
  let opener;
  let previousOverflow = "";
  const close = () => {
    panel.hidden = true;
    frame.src = "about:blank";
    document.body.style.overflow = previousOverflow;
    opener?.focus();
  };
  document.addEventListener("click", (event) => {
    const link = event.target.closest("button[data-map-query]");
    if (!link) return;
    event.preventDefault();
    opener = link;
    $("#place-map-title").textContent = link.dataset.mapLabel;
    $("#place-map-external").href = safeExternalUrl(link.dataset.mapUrl) || mapsSearch(link.dataset.mapQuery);
    frame.title = `${link.dataset.mapLabel} Google Maps`;
    frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(link.dataset.mapQuery)}&output=embed`;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.hidden = false;
    $("#place-map-close").focus();
  });
  $("#place-map-close").onclick = close;
  panel.addEventListener("click", (event) => { if (event.target === panel) close(); });
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
    if (event.key === "Tab") {
      const first = $("#place-map-close");
      const last = $("#place-map-external");
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
}

function preloadDefaultRouteMap() {
  const routeMap = state.data?.routeMap;
  const source = travelMapSource(routeMap, routeMap?.defaultRegionId);
  if (!source?.baseImage) return;
  const image = new Image();
  image.decoding = "async";
  image.fetchPriority = "high";
  image.src = source.baseImage;
  state.routeMapPreload = image;
}

async function init() {
  try {
    if (location.protocol === "file:") {
      if (!window.TRAVEL_PLAN_DATA_BUNDLE) throw new Error("trip-data.js is required when opening index.html directly");
      state.data = structuredClone(window.TRAVEL_PLAN_DATA_BUNDLE);
    } else {
      const response = await fetch("./trip-data.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.data = await response.json();
    }
    state.config = normalizeTripConfig(state.data.config);
    window.TRAVEL_PLAN_CONFIG = state.config;
    window.TRAVEL_PLAN_DATA = state.data;
    loadPersonalState();
    if (sharedBackendAvailable()) await loadWorkspaceState();
    setupMediaLightbox();
    setupAppointmentDialog();
    document.dispatchEvent(new CustomEvent("travel-data-ready", { detail: state.data }));
    applyModuleConfig();
    if (moduleEnabled("overview")) preloadDefaultRouteMap();
    renderHero();
    if (moduleEnabled("flights")) renderFlights();
    if (moduleEnabled("overview")) setupRouteExplorer();
    if (moduleEnabled("itinerary")) {
      setupPlaceMap();
      setupTicketDialog();
    }
    if (moduleEnabled("todo") || moduleEnabled("itinerary")) {
      createRuntimeAdapters();
      try {
        await loadSharedState();
      } catch (error) {
        console.error(`${state.config.persistence.mode === "d1" ? "Shared" : "Local"} runtime data could not be loaded`, error);
        state.todos = [];
        state.purchasedTickets = new Set();
      }
    }
    if (moduleEnabled("itinerary")) renderTimeline();
    if (moduleEnabled("driving")) renderRental();
    if (moduleEnabled("todo")) renderTravelPrep();
    if (moduleEnabled("ledger")) renderExpenses();
    setupWorkspaceRefresh();
  } catch (error) {
    console.error("Travel data could not be loaded", error);
    $("#loading-error").hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", init);
