/* Golden route interaction reused with frozen map templates. */
let mapRoutes = [];
let mapInstance = 0;
let activeGeographicMap = null;
let activeGeographicBounds = null;
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

function mapArtwork(source, selected, id, viewport) {
  if (!selected) return travelOverviewArtwork(state.data.days, source);
  const layout = dailyMapLayoutFor(source, selected.day);
  const day = state.data.days.find((item) => item.day === selected.day);
  const doc = new DOMParser().parseFromString(travelOverviewArtwork(state.data.days, source, { includeAllPlaces: true, useDetailedRoutes: true }), "image/svg+xml");
  const svg = doc.documentElement;
  svg.removeAttribute("data-overview-version");
  svg.setAttribute("data-daily-version", "3");
  svg.setAttribute("aria-label", day.title);
  svg.querySelector("title").textContent = day.title;
  svg.querySelector("desc").textContent = "Shows this day's route only. Select a place dot for the map or a transport icon for trip details.";
  svg.querySelectorAll('[id^="overview-route-"]').forEach((group) => {
    if (group.id !== `overview-route-${selected.day}`) group.remove();
  });
  ["overview-date-legend", "overview-markers", "overview-geographic-names"].forEach((key) => svg.querySelector(`#${key}`)?.remove());
  svg.querySelectorAll('[id^="overview-label-"]').forEach((label) => {
    const placeId = label.id.replace("overview-label-", "");
    if (!layout?.places.includes(placeId)) { label.remove(); return; }
    const place = placeLayersFor(source).find((item) => item.id === placeId);
    const labelLayout = layout.labels?.[placeId] || { x: place?.tx, y: place?.ty, anchor: place?.anchor };
    if (!Number.isFinite(Number(labelLayout.x)) || !Number.isFinite(Number(labelLayout.y))) { label.remove(); return; }
    label.setAttribute("x", labelLayout.x);
    label.setAttribute("y", labelLayout.y);
    label.setAttribute("text-anchor", labelLayout.anchor || "start");
    label.querySelectorAll("tspan").forEach((line) => line.setAttribute("x", labelLayout.x));
  });
  svg.querySelectorAll("[id]").forEach((element) => { element.id = `${id}-${element.id}`; });
  return new XMLSerializer().serializeToString(svg);
}

function dailyPointRole(layout, placeId, index) {
  if (layout.roles?.[placeId]) return layout.roles[placeId];
  if (layout.places.length === 1) return "Start / finish";
  if (index === 0) return "Start";
  if (index === layout.places.length - 1) return "Finish";
  return "Via";
}

function travelMapMarkup(source, route) {
  const id = `travel-map-${++mapInstance}`;
  const day = route && state.data.days.find((item) => item.day === route.day);
  const layout = route && dailyMapLayoutFor(source, route.day);
  const placeLayers = placeLayersFor(source);
  const visiblePlaceIds = route && layout ? layout.places : (source.overviewPlaceIds || placeLayers.map((place) => place.id));
  const mapNote = route ? `Day ${day.day} · ${formatFullCompactDate(day.date)}` : "Kanto & Chubu · 17-day overview";
  window.setTimeout(() => initializeGeographicMap(id, source, visiblePlaceIds, route), 0);
  return `<div class="travel-map-block ${route ? "is-daily" : "is-overview"}" ${route ? `style="--route-color:${route.color}"` : ""}>
    <div class="journey-map-layout">
      <div class="accurate-map handdrawn-map" id="${id}" role="application" aria-label="${route ? `Day ${day.day}` : "Trip overview"} interactive illustrated map"><p>Painting the journey map…</p></div>
      ${mapLegendMarkup(route)}
    </div>
    <div class="map-utility"><span>${escapeHtml(mapNote)} · Pinch or use + / − to zoom</span><button type="button" data-fit-map>Reset view</button></div>
  </div>`;
}

function mapLegendMarkup(route) {
  const routes = route ? [route] : mapRoutes;
  const rows = routes.map((item) => {
    const day = state.data.days.find((candidate) => candidate.day === item.day);
    const [, month, date] = day?.date?.split("-") || [];
    return day ? `<li><i style="--legend-color:${item.color}"></i><span>${escapeHtml(`${date}/${month}`)}</span></li>` : "";
  }).join("");
  return `<aside class="map-legend" aria-label="Map legend">
    <div class="map-legend__icons"><span><i class="legend-place legend-place--hotel">${placeCategoryIcon("hotel")}</i>Hotel</span><span><i class="legend-place legend-place--attraction">${placeCategoryIcon("attraction")}</i>Attraction</span><span><i class="legend-place legend-place--restaurant">${placeCategoryIcon("noodles")}</i>Restaurant</span></div>
    <div class="map-legend__lines"><span><i class="legend-line is-solid"></i>Hotel change</span><span><i class="legend-line is-dotted"></i>Local stops</span></div>
    <ul class="map-date-legend">${rows}</ul>
  </aside>`;
}

function initializeGeographicMap(id, source, visiblePlaceIds, route) {
  const element = document.getElementById(id);
  if (!element) return;
  const places = visiblePlaceIds.map((placeId) => placeLayersFor(source).find((place) => place.id === placeId))
    .filter((place) => Number.isFinite(Number(place?.geo?.lat)) && Number.isFinite(Number(place?.geo?.lng)));
  if (!window.L) {
    element.classList.add("map-fallback");
    element.innerHTML = places.map((place) => { const [label, query] = placeOptions(source, place.id)[0]; return `<a href="${mapsSearch(query)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} ↗</a>`; }).join("");
    return;
  }
  activeGeographicMap?.remove();
  element.replaceChildren();
  const regionalBounds = window.L.latLngBounds([[34.72, 136.45], [37.02, 140.12]]);
  const map = window.L.map(element, {
    zoomControl: true, scrollWheelZoom: true, zoomSnap: .5, zoomDelta: .5,
    minZoom: 6.5, maxZoom: 12, maxBounds: regionalBounds.pad(.08), maxBoundsViscosity: .8,
    attributionControl: false
  });
  activeGeographicMap = map;
  element.insertAdjacentHTML("beforeend", '<span class="map-paper-label" aria-hidden="true">KANTO · CHUBU</span>');
  const land = [[37.0,136.5],[37.02,137.18],[36.93,137.95],[36.98,138.74],[36.75,139.42],[36.34,140.06],[35.76,140.12],[35.18,139.86],[34.76,139.16],[34.72,138.28],[34.8,137.26],[35.08,136.53],[35.7,136.46],[36.4,136.48]];
  const reliefLand = land.map(([lat,lng]) => [lat - .035,lng + .025]);
  window.L.polygon(reliefLand, { className: "handdrawn-land-relief", color: "#abb19e", weight: 3, opacity: .45, fillColor: "#b9b9a8", fillOpacity: .58, interactive: false }).addTo(map);
  window.L.polygon(land, { className: "handdrawn-land", color: "#a5ae99", weight: 2, opacity: .68, fillColor: "#f2f0e5", fillOpacity: .98, interactive: false }).addTo(map);
  [[36.65,137.45,36000],[36.35,138.15,46000],[35.95,138.7,38000],[35.35,137.5,33000]].forEach(([lat,lng,radius]) => {
    window.L.circle([lat,lng], { className: "watercolor-hill", radius, color: "transparent", fillColor: "#85967c", fillOpacity: .1, interactive: false }).addTo(map);
  });
  window.L.polygon([[35.38,138.55],[35.28,138.72],[35.2,138.58]], { className: "handdrawn-mountain", color: "#9c8874", weight: 2, fillColor: "#d9cbbc", fillOpacity: .45, interactive: false }).addTo(map);
  window.L.circle([35.21,139.0], { className: "watercolor-lake", radius: 12000, color: "#91a9ad", weight: 1.5, fillColor: "#cbdcdf", fillOpacity: .5, interactive: false }).addTo(map);
  [[35.32,139.55,"Kamakura"],[36.14,137.25,"Takayama"],[36.26,136.9,"Shirakawa-go"],[36.56,136.66,"Kanazawa"]].forEach(([lat,lng,label]) => {
    const icon = window.L.divIcon({ className: "regional-map-label", html: `<span>${escapeHtml(label)}</span>`, iconSize: [84,18], iconAnchor: [42,9] });
    window.L.marker([lat,lng], { icon, interactive: false }).addTo(map);
  });
  const coordinates = places.map((place) => [Number(place.geo.lat), Number(place.geo.lng)]);
  places.forEach((place) => {
    const [label, query] = placeOptions(source, place.id)[0];
    const category = place.category || "attraction";
    const icon = window.L.divIcon({ className: "leaflet-category-marker", html: `<span class="map-place-dot--${escapeHtml(category)}">${placeCategoryIcon(category)}</span>`, iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -16] });
    window.L.marker([Number(place.geo.lat), Number(place.geo.lng)], { icon, title: label })
      .addTo(map)
      .bindPopup(`<strong>${escapeHtml(label)}</strong><br><a href="${mapsSearch(query)}" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a>`);
  });
  const routesToDraw = route ? [route] : mapRoutes;
  routesToDraw.forEach((routeItem) => {
    const definition = routeLayersFor(source).find((item) => item.day === routeItem.day);
    const routePlaces = (definition?.placeIds || []).map((placeId) => placeLayersFor(source).find((place) => place.id === placeId)).filter((place) => place?.geo);
    const points = routePlaces.map((place) => [Number(place.geo.lat), Number(place.geo.lng)]);
    const dayData = state.data.days.find((item) => item.day === routeItem.day);
    const mode = dayData?.schedule.find((item) => ["drive","walk","hike","train","rail","flight","rental-car"].includes(item.type))?.type || (routeItem.day < 4 ? "walk" : "drive");
    const transportMarker = (position) => {
      const icon = window.L.divIcon({ className: "transport-map-marker", html: `<span style="--transport-color:${routeItem.color}" title="Day ${routeItem.day} · ${transportNames[mode] || mode}">${transportIcon(mode)}</span>`, iconSize: [26,26], iconAnchor: [13,13] });
      window.L.marker(position, { icon, interactive: false }).addTo(map);
    };
    if (points.length > 1) {
      const isHotelTransfer = routePlaces.some((place) => place.category === "hotel") && routePlaces[0].id !== routePlaces.at(-1).id;
      window.L.polyline(points, { className: "journey-route-line", color: routeItem.color, weight: route ? 4 : 3, opacity: .86, dashArray: isHotelTransfer ? null : "4 8", lineCap: "round" }).addTo(map);
      const middle = [(points[0][0] + points.at(-1)[0]) / 2, (points[0][1] + points.at(-1)[1]) / 2];
      transportMarker(middle);
    } else if (points.length === 1) {
      window.L.circle(points[0], { className: "journey-local-loop", radius: route ? 9000 : 6000, color: routeItem.color, weight: 3, opacity: .82, fill: false, dashArray: "3 7", interactive: false }).addTo(map);
      const angle = routeItem.day * 2.399;
      transportMarker([points[0][0] + Math.sin(angle) * .065, points[0][1] + Math.cos(angle) * .08]);
    }
  });
  if (coordinates.length > 1) {
    activeGeographicBounds = window.L.latLngBounds(coordinates).pad(route ? .32 : .16);
    map.fitBounds(activeGeographicBounds, { padding: [24, 24], maxZoom: route ? 9.5 : 7.5 });
  } else if (coordinates.length === 1) {
    activeGeographicBounds = window.L.latLngBounds(coordinates);
    map.setView(coordinates[0], 9);
  } else {
    activeGeographicBounds = null;
    map.fitBounds(regionalBounds, { padding: [20,20] });
  }
  window.setTimeout(() => map.invalidateSize(), 80);
}

function activateDayMaps(root) {
  $$(".is-daily .travel-map-scroll", root).forEach((view) => {
    if (view.dataset.positioned || !view.clientWidth) return;
    view.scrollLeft = 0;
    view.dataset.positioned = "true";
  });
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
  if (route) activateDayMaps(root);
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
    const fitMap = event.target.closest("[data-fit-map]");
    if (fitMap && activeGeographicMap && activeGeographicBounds) {
      activeGeographicMap.fitBounds(activeGeographicBounds, { padding: [24, 24], maxZoom: 10 });
      return;
    }
    const zoom = event.target.closest("[data-expand-map]");
    if (zoom) {
      const dialog = $("#map-dialog");
      const source = document.getElementById(zoom.dataset.expandMap);
      const copy = source.cloneNode(true);
      const svg = copy.querySelector("svg");
      const ids = [...svg.querySelectorAll("[id]")].map((element) => element.id);
      for (const oldId of ids) svg.innerHTML = svg.innerHTML.replaceAll(`id="${oldId}"`, `id="${oldId}-zoom"`).replaceAll(`url(#${oldId})`, `url(#${oldId}-zoom)`);
      copy.removeAttribute("id"); copy.classList.toggle("daily-fullscreen", Boolean(source.closest(".is-daily")));
      copy.style.setProperty("--route-color", getComputedStyle(source).getPropertyValue("--route-color"));
      $("#map-dialog-content").replaceChildren(copy); dialog.showModal();
      const viewport = $("#map-dialog-content"); viewport.scrollLeft = Math.max(0, (copy.scrollWidth - viewport.clientWidth) / 2);
    }
    const link = event.target.closest("[data-open-day]");
    if (link) {
      event.preventDefault();
      const button = $(`[data-day="${Number(link.dataset.openDay)}"] .day-toggle`);
      if (button.getAttribute("aria-expanded") !== "true") button.click();
      button.scrollIntoView({ behavior: "smooth" });
    }
    const toggle = event.target.closest(".day-toggle");
    if (toggle && toggle.getAttribute("aria-expanded") === "true") activateDayMaps(toggle.closest(".day-card"));
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && activePin) { event.preventDefault(); event.stopPropagation(); closePopover(true); } });
  window.addEventListener("resize", positionPopover);
  document.addEventListener("scroll", (event) => { if (!event.target.closest?.(".route-popover")) positionPopover(); }, true);
  document.addEventListener("focusin", (event) => { if (popover && !popover.contains(event.target) && event.target !== activePin) closePopover(); });
  window.addEventListener("travel-view:shown", () => {
    const roots = [$("#route-explorer"), ...$$(".day-detail:not([hidden])")].filter(Boolean);
    roots.forEach((root) => {
      $$(".is-daily .travel-map-scroll", root).forEach((view) => view.removeAttribute("data-positioned"));
      activateDayMaps(root);
    });
  });
  $("#map-close").onclick = () => $("#map-dialog").close();
  $("#map-dialog").addEventListener("close", () => closePopover());
  $$(".day-detail:not([hidden])").forEach(activateDayMaps);
}
