/* Golden route interaction reused with frozen map templates. */
let mapRoutes = [];
const transportNames = {
  drive: "Drive", train: "Train", rail: "Rail", "cable-car": "Cable car",
  hike: "Hike", walk: "Walk", return: "Return", "rental-car": "Rental car",
  boat: "Boat", ferry: "Ferry", flight: "Flight", transfer: "Transfer"
};
const journeyColors = [
  "#6f8190", "#9a765c", "#728263", "#a85e55", "#4f7891", "#846b91",
  "#708b82", "#aa7b52", "#657899", "#887463", "#7a6b8d", "#5f8589",
  "#9b645f", "#6e8568", "#8c704f", "#607b91", "#7e6a78"
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

function transportIcon(type) {
  const icons = {
    drive: '<path d="m5 9 2-5h10l2 5M4 9h16v9H4zM7 18v2m10-2v2M7 12h1m8 0h1"/>',
    "cable-car": '<path d="m2 4 20-2M12 3v5M6 9h12l2 9H4zM6 18v3h12v-3M9 9v9m6-9v9"/>',
    train: '<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 10h14M12 3v7m-4 5h1m6 0h1M8 18l-3 4m11-4 3 4M7 20h10"/>',
    hike: '<circle cx="14" cy="4" r="2"/><path d="m11 8 4 2 3 4m-7-6-3 6-4 1m7-3 3 4-1 6m-2-10-3 7-4 3M8 8l-2 3"/>',
    boat: '<path d="M12 3v11M5 7h14v6M3 14l9-3 9 3-3 6H6zM2 22q3-3 5 0 3-3 5 0 3-3 5 0 3-3 5 0"/>',
    "rental-car": '<path d="m3 10 2-5h9l2 5M2 10h15v8H2zM5 18v2m9-2v2M5 13h1m7 0h1M18 4h4m-2-2 2 2-2 2"/>',
    flight: '<path d="M3 16 21 8M9 13 5 6l2-1 6 5m2-1 1-6 2-1 1 5M8 15l-1 4 2-1 3-4"/>'
  };
  const key = type === "rail" ? "train" : type === "ferry" ? "boat" : type === "walk" ? "hike" : ["return", "transfer"].includes(type) ? "drive" : type;
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[key] || icons.drive}</svg>`;
}

function placeCategoryIcon(category) {
  const icons = {
    hotel: '<path d="M4 19V8h5a4 4 0 0 1 4 4v7M4 14h16v5M7 11h2M3 21v-2m18 2v-2"/>',
    noodles: '<path d="M4 11h16c0 5-3 8-8 8s-8-3-8-8Zm2 10h12M8 3c2 2-2 3 0 5m5-5c2 2-2 3 0 5m5-5c2 2-2 3 0 5"/>',
    bbq: '<path d="M5 11h14a7 7 0 0 1-14 0Zm3 7-2 4m10-4 2 4M8 7l2-4m4 4 2-4"/>',
    airport: '<path d="m3 16 18-8M9 13 5 6l2-1 6 5m2-1 1-6 2-1 1 5M8 15l-1 4 2-1 3-4"/>',
    attraction: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    city: '<path d="M5 21V8h6v13M11 4h8v17M8 11h1m-1 3h1m-1 3h1m5-9h2m-2 4h2m-2 4h2M3 21h18"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[category] || icons.attraction}</svg>`;
}

function dailyPointRole(layout, placeId, index) {
  if (layout.roles?.[placeId]) return layout.roles[placeId];
  if (layout.places.length === 1) return "Start / finish";
  if (index === 0) return "Start";
  if (index === layout.places.length - 1) return "Finish";
  return "Via";
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

function organicRoutePath(points, dayNumber) {
  if (points.length === 1) {
    const point = points[0];
    const radius = 18 + (dayNumber % 3) * 7;
    const offsetX = ((dayNumber % 4) - 1.5) * 9;
    const offsetY = ((dayNumber % 5) - 2) * 7;
    const x = point.x + offsetX;
    const y = point.y + offsetY;
    return `M ${x - radius} ${y} C ${x - radius} ${y - radius * .7}, ${x - radius * .4} ${y - radius}, ${x} ${y - radius} C ${x + radius * .7} ${y - radius}, ${x + radius} ${y - radius * .35}, ${x + radius} ${y} C ${x + radius} ${y + radius * .72}, ${x + radius * .35} ${y + radius}, ${x} ${y + radius}`;
  }
  if (points.length < 2) return "";
  return points.slice(1).reduce((path, point, index) => {
    const start = points[index];
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const bend = Math.min(92, Math.max(28, distance * .18)) * ((dayNumber + index) % 2 ? 1 : -1);
    const nx = -dy / distance;
    const ny = dx / distance;
    const c1 = { x: start.x + dx * .34 + nx * bend, y: start.y + dy * .34 + ny * bend };
    const c2 = { x: start.x + dx * .68 + nx * bend, y: start.y + dy * .68 + ny * bend };
    return `${path} C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }, `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`);
}

function routeMode(dayData, dayNumber) {
  const scheduled = dayData?.schedule.find((item) => ["drive", "walk", "hike", "train", "rail", "flight", "rental-car"].includes(item.type))?.type;
  return dayData?.date >= "2026-12-20" && dayNumber < 17 ? "drive" : scheduled || (dayNumber < 4 ? "train" : "drive");
}

function posterMapMarkup(source, visiblePlaceIds, selectedRoute) {
  const allPlaces = placeLayersFor(source);
  const visiblePlaces = visiblePlaceIds.map((id) => allPlaces.find((place) => place.id === id)).filter((place) => place?.geo);
  const routeMarkup = mapRoutes.map((routeItem) => {
    const definition = routeLayersFor(source).find((item) => item.day === routeItem.day);
    const routePlaces = (definition?.placeIds || []).map((id) => allPlaces.find((place) => place.id === id)).filter((place) => place?.geo);
    const points = routePlaces.map((place) => posterPoint(place.geo));
    const path = organicRoutePath(points, routeItem.day);
    if (!path) return "";
    const isActive = !selectedRoute || routeItem.day === selectedRoute.day;
    const isLocal = points.length === 1;
    return `<path class="poster-route${isActive ? " is-active" : " is-dimmed"}${isLocal ? " is-local" : ""}" data-poster-route-day="${routeItem.day}" d="${path}" style="--day-color:${routeItem.color}"/>`;
  }).join("");
  const transportMarkup = mapRoutes.map((routeItem) => {
    if (selectedRoute && routeItem.day !== selectedRoute.day) return "";
    const definition = routeLayersFor(source).find((item) => item.day === routeItem.day);
    const routePlaces = (definition?.placeIds || []).map((id) => allPlaces.find((place) => place.id === id)).filter((place) => place?.geo);
    if (routePlaces.length < 2) return "";
    const points = routePlaces.map((place) => posterPoint(place.geo));
    const start = points[0];
    const finish = points.at(-1);
    const point = { x: (start.x + finish.x) / 2, y: (start.y + finish.y) / 2 };
    const dayData = state.data.days.find((item) => item.day === routeItem.day);
    const mode = routeMode(dayData, routeItem.day);
    return `<span class="poster-transport-marker" style="--left:${(point.x / posterMap.width * 100).toFixed(3)}%;--top:${(point.y / posterMap.height * 100).toFixed(3)}%;--day-color:${routeItem.color}" title="Day ${routeItem.day} · ${escapeHtml(transportNames[mode] || mode)}">${transportIcon(mode)}</span>`;
  }).join("");
  const placeMarkup = visiblePlaces.map((place, index) => {
    const point = posterPoint(place.geo);
    const category = place.category || "attraction";
    const [label] = placeOptions(source, place.id)[0];
    return `<button type="button" class="poster-place-marker is-${escapeHtml(category)}" style="--left:${(point.x / posterMap.width * 100).toFixed(3)}%;--top:${(point.y / posterMap.height * 100).toFixed(3)}%" data-place-id="${escapeHtml(place.id)}" data-map-region="${escapeHtml(source.id)}" data-place-role="${escapeHtml(dailyPointRole({ places: visiblePlaceIds }, place.id, index))}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${placeCategoryIcon(category)}</button>`;
  }).join("");
  return `<div class="poster-map" role="group" aria-label="${selectedRoute ? `Day ${selectedRoute.day}` : "17-day route overview"} on a Kanto and Chubu relief map">
    <img src="assets/maps/kanto-chubu-relief-clean.png?v=20260914-2" alt="" draggable="false">
    <svg class="poster-route-layer" viewBox="0 0 ${posterMap.width} ${posterMap.height}" aria-hidden="true">${routeMarkup}</svg>
    <div class="poster-marker-layer">${transportMarkup}${placeMarkup}</div>
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
  const day = route && state.data.days.find((candidate) => candidate.day === route.day);
  const routes = route ? [route] : mapRoutes;
  const dates = routes.map((routeItem) => {
    const routeDay = state.data.days.find((candidate) => candidate.day === routeItem.day);
    const [, month, date] = routeDay?.date?.split("-") || [];
    return routeDay ? `<button type="button" data-poster-legend-day="${routeItem.day}" style="--day-color:${routeItem.color}" aria-label="Highlight Day ${routeItem.day}, ${date}/${month}"><i></i><span>${date}/${month}</span></button>` : "";
  }).join("");
  const travelMode = day ? routeMode(day, day.day) : null;
  return `<aside class="poster-map-legend" aria-label="Map legend">
    <div class="poster-legend-symbols">
      <span><i class="poster-legend-place is-hotel">${placeCategoryIcon("hotel")}</i>Hotel</span>
      <span><i class="poster-legend-place is-restaurant">${placeCategoryIcon("noodles")}</i>Restaurant</span>
      <span><i class="poster-legend-place is-attraction">${placeCategoryIcon("attraction")}</i>Attraction</span>
      <span><i class="poster-legend-route"></i>Curved route</span>
      ${travelMode ? `<span><i class="poster-legend-transport">${transportIcon(travelMode)}</i>${escapeHtml(transportNames[travelMode] || travelMode)}</span>` : ""}
    </div>
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
