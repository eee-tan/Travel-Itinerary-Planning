/* Golden route interaction reused with frozen map templates. */
let mapRoutes = [];
const transportNames = {
  drive: "Drive", train: "Train", rail: "Rail", "cable-car": "Cable car",
  hike: "Hike", walk: "Walk", return: "Return", "rental-car": "Rental car",
  boat: "Boat", ferry: "Ferry", flight: "Flight", transfer: "Transfer"
};
const journeyColors = [
  "#1769aa", "#e67e22", "#2e8b57", "#c0392b", "#7d3c98", "#008fa3",
  "#d4a017", "#d14f8b", "#4257b2", "#008577", "#9a572f", "#70a832",
  "#e15b4f", "#254f87", "#c43d73", "#0096a6", "#6c49a8"
];

function mapRouteDefinitions(source) {
  return routeLayersFor(source).map(({ day }, index) => ({ day, color: journeyColors[index % journeyColors.length] }));
}

function dailyMapLayoutFor(source, dayNumber) {
  const authored = source.dailyLayouts?.[String(dayNumber)];
  if (authored) return { places: [], labels: {}, transport: [], ...authored };
  const route = routeLayersFor(source).find((candidate) => candidate.day === dayNumber);
  if (!route) return null;
  return { places: route.placeIds || [], labels: {}, transport: [] };
}

function placeOptions(source, placeId) {
  const place = placeLayersFor(source).find((item) => item.id === placeId);
  if (!place) return [[placeId, placeId]];
  if (Array.isArray(place.options) && place.options.length) return place.options.map((option) => [option.label, option.query]);
  return [[place.lines?.at(-1) || placeId, place.query || place.lines?.[0] || placeId]];
}

function scheduleItemsForPin(day, pin) {
  const rawReferences = Array.isArray(pin?.itemIds) && pin.itemIds.length ? pin.itemIds : pin?.items || [];
  const references = Array.isArray(rawReferences) ? rawReferences : [rawReferences].filter(Boolean);
  return references.map((reference) => typeof reference === "number"
    ? day.schedule[reference]
    : day.schedule.find((item) => item.id === reference)
  ).filter(Boolean);
}

function dailyViewportFor(source) {
  const canvas = source.canvas || { width: 1448, height: 1086 };
  return { x: 0, y: 0, width: canvas.width, height: canvas.height };
}

const posterMap = {
  width: 1585, height: 992,
  south: 34, west: 135.52, north: 38.13, east: 140.67
};

function posterPoint(geo) {
  return {
    x: ((Number(geo.lng) - posterMap.west) / (posterMap.east - posterMap.west)) * posterMap.width,
    y: posterMap.height - ((Number(geo.lat) - posterMap.south) / (posterMap.north - posterMap.south)) * posterMap.height
  };
}

function organicRoutePath(points) {
  if (points.length < 2) return "";
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] || points[index];
    const start = points[index];
    const finish = points[index + 1];
    const next = points[index + 2] || finish;
    const control1 = { x: start.x + (finish.x - previous.x) / 6, y: start.y + (finish.y - previous.y) / 6 };
    const control2 = { x: finish.x - (next.x - start.x) / 6, y: finish.y - (next.y - start.y) / 6 };
    path += ` C ${control1.x.toFixed(1)} ${control1.y.toFixed(1)}, ${control2.x.toFixed(1)} ${control2.y.toFixed(1)}, ${finish.x.toFixed(1)} ${finish.y.toFixed(1)}`;
  }
  return path;
}

const posterRouteWaypoints = {
  1: [[35.5494,139.7798],[35.6285,139.7397],[35.6762,139.6503]],
  2: [[35.6762,139.6503],[35.6938,139.7034],[35.7148,139.7967],[35.6812,139.7671]],
  3: [[35.6762,139.6503],[35.4437,139.6380],[35.3192,139.5467],[35.4437,139.6380],[35.6762,139.6503]],
  4: [[35.6762,139.6503],[35.8617,139.6455],[36.3224,139.0034],[36.5451,138.8885],[36.7950,138.9680]],
  5: [[36.7950,138.9680],[36.8370,138.9320],[36.8490,139.0550],[36.7950,138.9680]],
  6: [[36.7950,138.9680],[37.0436,138.8475],[37.4460,138.8512],[37.9162,139.0364],[37.1478,138.2361],[36.6953,137.2137],[36.5810,136.9630]],
  7: [[36.5810,136.9630],[36.5613,136.6562],[36.5947,136.6256],[36.5810,136.9630]],
  8: [[36.5810,136.9630],[36.2606,136.9062],[36.1428,137.2520],[36.5810,136.9630]],
  9: [[36.5810,136.9630],[36.2606,136.9062],[36.1428,137.2520],[35.7847,137.2394],[35.3912,136.7223],[35.1690,136.8890]],
  10: [[35.1690,136.8890],[35.3882,136.9394],[35.2899,136.9723],[35.1690,136.8890]],
  11: [[35.1690,136.8890],[35.4550,137.4121],[35.5149,137.8203],[36.2380,137.9720],[36.5650,138.1970]],
  12: [[36.5650,138.1970],[36.6513,138.1875],[36.7326,138.4622],[36.5650,138.1970]],
  13: [[36.5650,138.1970],[36.2380,137.9720],[35.6642,138.5684],[35.1920,139.0260]],
  14: [[35.1920,139.0260],[35.2440,139.0070],[35.2324,138.9950],[35.2048,139.0228],[35.1920,139.0260]],
  15: [[35.1920,139.0260],[35.4437,139.3625],[35.6049,139.5037],[35.9060,139.4820]],
  16: [[35.9060,139.4820],[35.9174,139.4858],[35.9251,139.4721],[35.9060,139.4820]],
  17: [[35.9060,139.4820],[35.6812,139.7671],[35.6285,139.7397],[35.5494,139.7798]]
};

function posterMapMarkup(source, visiblePlaceIds, selectedRoute) {
  const routeMarkup = mapRoutes.map((routeItem) => {
    const points = (posterRouteWaypoints[routeItem.day] || []).map(([lat, lng]) => posterPoint({ lat, lng }));
    const path = organicRoutePath(points);
    if (!path) return "";
    const isActive = !selectedRoute || routeItem.day === selectedRoute.day;
    return `<path class="poster-route${isActive ? " is-active" : " is-dimmed"}" data-poster-route-day="${routeItem.day}" d="${path}" style="--day-color:${routeItem.color}"/>`;
  }).join("");
  return `<div class="poster-map" role="group" aria-label="${selectedRoute ? `Day ${selectedRoute.day}` : "17-day route overview"} on a Kanto and Chubu relief map">
    <img src="assets/maps/kanto-chubu-relief-clean.png?v=20260914-2" alt="" draggable="false">
    <svg class="poster-route-layer" viewBox="0 0 ${posterMap.width} ${posterMap.height}" aria-hidden="true">${routeMarkup}</svg>
  </div>`;
}

function travelMapMarkup(source, route) {
  const day = route && state.data.days.find((item) => item.day === route.day);
  const layout = route && dailyMapLayoutFor(source, route.day);
  const placeLayers = placeLayersFor(source);
  const visiblePlaceIds = route && layout ? layout.places : (source.overviewPlaceIds || placeLayers.map((place) => place.id));
  const mapNote = route ? `Day ${day.day} · ${formatFullCompactDate(day.date)}` : "Kanto & Chubu · 17-day overview";
  return `<div class="travel-map-block ${route ? "is-daily" : "is-overview"}" ${route ? `style="--route-color:${route.color}"` : ""}>
    <div class="journey-map-layout">
      <div class="journey-map-stage">
        ${posterMapMarkup(source, visiblePlaceIds, route)}
      </div>
      ${posterLegendMarkup(route)}
    </div>
    <div class="map-utility"><span>${escapeHtml(mapNote)} · Fixed illustrated route poster</span></div>
  </div>`;
}

function posterLegendMarkup(route) {
  const routes = route ? [route] : mapRoutes;
  const dates = routes.map((routeItem) => {
    const routeDay = state.data.days.find((candidate) => candidate.day === routeItem.day);
    const [, month, date] = routeDay?.date?.split("-") || [];
    return routeDay ? `<button type="button" data-poster-legend-day="${routeItem.day}" style="--day-color:${routeItem.color}" aria-label="Highlight Day ${routeItem.day}, ${date}/${month}"><i></i><span>${date}/${month}</span></button>` : "";
  }).join("");
  return `<aside class="poster-map-legend" aria-label="Map legend">
    <div class="poster-date-legend" aria-label="Route colors by date">${dates}</div>
  </aside>`;
}

function renderRoutePanel(regionId, dayNumber = 0) {
  const root = $("#route-explorer");
  const routeMap = state.data?.routeMap;
  const regions = travelMapRegions(routeMap);
  const source = travelMapSource(routeMap, regionId || routeMap?.defaultRegionId || root.dataset.region);
  root.dataset.region = source.id || "";
  mapRoutes = mapRouteDefinitions(source);
  const route = mapRoutes.find((item) => item.day === dayNumber);
  root.innerHTML = `${regions.length > 1 ? `<div class="route-region-tabs" aria-label="Destination countries">${regions.map((region) => `<button type="button" data-route-region="${escapeHtml(region.id)}" aria-pressed="${region.id === source.id}">${escapeHtml(region.label || region.heading?.text || region.id)}</button>`).join("")}</div>` : ""}
  <div class="route-day-tabs" aria-label="Trip route dates"><button type="button" data-route-day="0" aria-pressed="${!route}">Overview</button>${mapRoutes.map((item) => { const day = state.data.days.find((candidate) => candidate.day === item.day); return day ? `<button type="button" data-route-day="${item.day}" style="--route-color:${item.color}" aria-pressed="${item === route}"><i></i>Day ${day.day}, ${escapeHtml(formatCompactDate(day.date))}</button>` : ""; }).join("")}</div>${travelMapMarkup(source, route)}`;
}

function setupRouteExplorer() {
  renderRoutePanel();
  let activePin = null;
  let popover = null;
  const closePopover = (restoreFocus = false) => {
    const opener = activePin;
    if (opener) { opener.setAttribute("aria-expanded", "false"); opener.removeAttribute("aria-controls"); }
    popover?.remove(); popover = null; activePin = null;
    if (restoreFocus) opener?.focus({ preventScroll: true });
  };
  const positionPopover = () => {
    if (!popover || !activePin) return;
    const point = activePin.getBoundingClientRect();
    popover.style.left = `${Math.max(8, Math.min(innerWidth - popover.offsetWidth - 8, point.left + point.width / 2 - popover.offsetWidth / 2))}px`;
    popover.style.top = `${Math.max(8, Math.min(innerHeight - popover.offsetHeight - 8, point.top - popover.offsetHeight - 10))}px`;
  };
  const showPopover = (pin, content, map = false) => {
    const wasOpen = activePin === pin; closePopover(); if (wasOpen) return;
    activePin = pin; pin.setAttribute("aria-expanded", "true"); pin.setAttribute("aria-controls", "route-active-popover");
    popover = document.createElement("section"); popover.id = "route-active-popover"; popover.className = `route-popover ${map ? "route-place-popover" : "transport-popover"}`;
    popover.setAttribute("role", "dialog"); popover.setAttribute("aria-label", map ? "Place on Google Maps" : "Transport details");
    popover.innerHTML = `<button type="button" class="route-popover-close" data-close-route-popover aria-label="Close">×</button>${content}`;
    (pin.closest("dialog") || document.body).append(popover); positionPopover();
    popover.querySelector("[data-close-route-popover]").focus({ preventScroll: true });
  };
  document.addEventListener("click", (event) => {
    const region = event.target.closest("[data-route-region]");
    const dayButton = event.target.closest("[data-route-day]");
    if (region || dayButton) {
      closePopover();
      const selectedRegionId = region?.dataset.routeRegion || $("#route-explorer").dataset.region;
      const selectedDay = region ? 0 : Number(dayButton?.dataset.routeDay || 0);
      if (selectedDay) window.openItineraryDay?.(selectedDay, { scroll: false });
      renderRoutePanel(selectedRegionId, selectedDay);
      if (selectedDay) requestAnimationFrame(() => window.openItineraryDay?.(selectedDay, { scroll: true }));
      return;
    }
    if (event.target.closest("[data-close-route-popover]")) { closePopover(true); return; }
    const placePin = event.target.closest("[data-place-id]");
    if (placePin) {
      const source = travelMapSource(state.data?.routeMap, placePin.dataset.mapRegion);
      const options = placeOptions(source, placePin.dataset.placeId);
      const [label, query] = options[0];
      showPopover(placePin, `<header><small>${escapeHtml(placePin.dataset.placeRole)}</small><strong data-popup-place-label>${escapeHtml(label)}</strong></header>
        ${options.length > 1 ? `<div class="popup-place-options">${options.map(([name, value], index) => `<button type="button" data-popup-query="${escapeHtml(value)}" data-popup-label="${escapeHtml(name)}" aria-pressed="${index === 0}">${escapeHtml(name)}</button>`).join("")}</div>` : ""}
        <iframe title="${escapeHtml(label)} Google Maps" src="https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        <footer><a data-popup-external href="${mapsSearch(query)}" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a><small>The embedded map is for reference; use the map provider's current results for navigation.</small></footer>`, true);
      return;
    }
    const pin = event.target.closest("[data-transport-day]");
    if (pin) {
      const day = state.data.days.find((item) => item.day === Number(pin.dataset.transportDay));
      const source = travelMapSource(state.data?.routeMap, pin.dataset.mapRegion);
      const group = dailyMapLayoutFor(source, day.day).transport[Number(pin.dataset.transportGroup)];
      showPopover(pin, scheduleItemsForPin(day, group).map((item) => `<div class="transport-leg"><strong>${escapeHtml(transportNames[item.type] || "Transport")} · ${escapeHtml(item.time)}</strong><p>${escapeHtml(item.text)}</p></div>`).join(""));
      return;
    }
    const option = event.target.closest("[data-popup-query]");
    if (option && popover) {
      const query = option.dataset.popupQuery;
      const label = option.dataset.popupLabel;
      $$("[data-popup-query]", popover).forEach((button) => button.setAttribute("aria-pressed", String(button === option)));
      $("[data-popup-place-label]", popover).textContent = label;
      const frame = $("iframe", popover); frame.title = `${label} Google Maps`; frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
      $("[data-popup-external]", popover).href = mapsSearch(query);
      return;
    }
    if (event.target.closest(".route-popover")) return;
    closePopover();
    const link = event.target.closest("[data-open-day]");
    if (link) {
      event.preventDefault();
      const button = $(`[data-day="${Number(link.dataset.openDay)}"] .day-toggle`);
      if (button.getAttribute("aria-expanded") !== "true") button.click();
      button.scrollIntoView({ behavior: "smooth" });
    }
  });

  const setLegendHighlight = (legendButton, active) => {
    const mapBlock = legendButton.closest(".travel-map-block");
    const selectedDay = legendButton.dataset.posterLegendDay;
    $$(".poster-route", mapBlock).forEach((path) => {
      const matches = path.dataset.posterRouteDay === selectedDay;
      path.classList.toggle("is-legend-muted", active && !matches);
      path.classList.toggle("is-legend-highlighted", active && matches);
    });
  };
  document.addEventListener("pointerover", (event) => {
    const legendButton = event.target.closest("[data-poster-legend-day]");
    if (legendButton) setLegendHighlight(legendButton, true);
  });
  document.addEventListener("pointerout", (event) => {
    const legendButton = event.target.closest("[data-poster-legend-day]");
    if (legendButton && !legendButton.contains(event.relatedTarget)) setLegendHighlight(legendButton, false);
  });
  document.addEventListener("focusin", (event) => {
    const legendButton = event.target.closest("[data-poster-legend-day]");
    if (legendButton) setLegendHighlight(legendButton, true);
    else if (popover && !popover.contains(event.target) && event.target !== activePin) closePopover();
  });
  document.addEventListener("focusout", (event) => {
    const legendButton = event.target.closest("[data-poster-legend-day]");
    if (legendButton && !legendButton.contains(event.relatedTarget)) setLegendHighlight(legendButton, false);
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && activePin) { event.preventDefault(); event.stopPropagation(); closePopover(true); } });
  window.addEventListener("resize", positionPopover);
  document.addEventListener("scroll", (event) => { if (!event.target.closest?.(".route-popover")) positionPopover(); }, true);
}
