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

function geographicRoutePath(points) {
  if (points.length < 2) return "";
  return points.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

const posterTransferRoutes = [
  { day: 4, points: [[139.650293,35.676178],[139.618470,35.749149],[139.546461,35.791213],[139.447054,35.908865],[139.383120,35.956658],[139.377153,36.035820],[139.273713,36.108737],[139.141723,36.245414],[139.091183,36.307446],[139.011736,36.467476],[139.032095,36.512396],[139.062980,36.607361],[139.063689,36.667522],[138.976339,36.712120],[138.965710,36.779622],[138.974817,36.793195]] },
  { day: 6, points: [[138.974817,36.793195],[138.849247,36.887219],[138.802860,36.948977],[138.739377,36.988148],[138.663733,37.043438],[138.608070,37.087129],[138.541282,37.159476],[138.442254,37.155227],[138.266197,37.172802],[138.151460,37.160716],[138.038248,37.121482],[137.911291,37.058806],[137.779079,37.016990],[137.606806,36.972383],[137.448865,36.852899],[137.342775,36.715389],[137.230443,36.646228],[137.090859,36.692917],[136.952358,36.624422],[136.962987,36.580970]] },
  { day: 9, points: [[136.962987,36.580970],[137.008962,36.552346],[136.991387,36.498453],[136.973558,36.442131],[136.919097,36.401007],[136.868366,36.374067],[136.900284,36.318895],[136.877440,36.223954],[136.910719,36.148709],[136.943347,36.086835],[136.901678,35.998543],[136.876840,35.951668],[136.913675,35.782536],[136.951347,35.731874],[136.936313,35.604171],[136.899444,35.492814],[136.994183,35.445452],[136.993700,35.386298],[136.913822,35.318869],[136.914478,35.174085],[136.888956,35.169134]] },
  { day: 11, points: [[136.888956,35.169134],[136.942841,35.204176],[137.015809,35.281128],[137.107837,35.332845],[137.188571,35.366482],[137.278066,35.400224],[137.394160,35.454178],[137.512169,35.490478],[137.597117,35.587066],[137.693392,35.697496],[137.682448,35.831430],[137.759482,35.880151],[137.850259,35.992173],[137.935629,36.115071],[137.943057,36.173985],[137.938779,36.231262],[137.923882,36.325178],[138.011641,36.403252],[138.058963,36.481226],[138.098687,36.534648],[138.156626,36.559297],[138.196610,36.565332]] },
  { day: 13, points: [[138.196610,36.565332],[138.139238,36.544643],[138.196208,36.473954],[138.307017,36.408148],[138.433507,36.342086],[138.465710,36.274356],[138.486148,36.168675],[138.483271,36.094309],[138.493834,36.003241],[138.474598,35.958408],[138.439467,35.925487],[138.433270,35.841449],[138.417576,35.782537],[138.530452,35.663503],[138.573483,35.599234],[138.624780,35.528829],[138.606978,35.477965],[138.571896,35.387448],[138.611367,35.273481],[138.754129,35.239229],[138.874308,35.239382],[138.978755,35.230924],[139.026621,35.192036]] },
  { day: 15, points: [[139.026621,35.192036],[139.061266,35.214420],[139.132789,35.245246],[139.200153,35.290116],[139.234175,35.353173],[139.291227,35.403708],[139.396003,35.428260],[139.487743,35.512313],[139.599741,35.623492],[139.618470,35.749149],[139.573976,35.767276],[139.508639,35.830582],[139.457451,35.893453],[139.481952,35.906057]] },
  { day: 17, points: [[139.481952,35.906057],[139.459553,35.893138],[139.508777,35.830643],[139.574114,35.767361],[139.618778,35.749233],[139.614389,35.677429],[139.688187,35.682554],[139.711028,35.628973],[139.752556,35.617252],[139.759867,35.570400],[139.789708,35.547786],[139.783197,35.550973]] }
];

const posterHotels = [
  [35.6762,139.6503],[36.7950,138.9680],[36.5810,136.9630],[35.1690,136.8890],
  [36.5650,138.1970],[35.1920,139.0260],[35.9060,139.4820]
];

function hotelIconMarkup() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20V9.5m0 6h17V20m-14-4v-5h5a4 4 0 0 1 4 4v1M3.5 19h17"/></svg>';
}

function posterMapMarkup(source, visiblePlaceIds, selectedRoute) {
  const routeMarkup = posterTransferRoutes.map((transfer) => {
    const points = transfer.points.map(([lng, lat]) => posterPoint({ lat, lng }));
    const path = geographicRoutePath(points);
    const isActive = !selectedRoute || transfer.day === selectedRoute.day;
    return `<path class="poster-route${isActive ? " is-active" : " is-dimmed"}" data-poster-route-day="${transfer.day}" d="${path}"/>`;
  }).join("");
  const hotels = posterHotels.map(([lat, lng]) => {
    const point = posterPoint({ lat, lng });
    return `<span class="poster-hotel-marker" style="--left:${(point.x / posterMap.width * 100).toFixed(3)}%;--top:${(point.y / posterMap.height * 100).toFixed(3)}%">${hotelIconMarkup()}</span>`;
  }).join("");
  return `<div class="poster-map" role="group" aria-label="${selectedRoute ? `Day ${selectedRoute.day}` : "17-day route overview"} on a Kanto and Chubu relief map">
    <img src="assets/maps/kanto-chubu-relief-clean.png?v=20260914-2" alt="" draggable="false">
    <svg class="poster-route-layer" viewBox="0 0 ${posterMap.width} ${posterMap.height}" aria-hidden="true">${routeMarkup}</svg>
    <div class="poster-hotel-layer" aria-hidden="true">${hotels}</div>
    ${posterLegendMarkup()}
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
    </div>
    <div class="map-utility"><span>${escapeHtml(mapNote)} · Fixed illustrated route poster</span></div>
  </div>`;
}

function posterLegendMarkup() {
  return `<aside class="poster-map-legend" aria-label="Map legend">
    <span><i class="poster-legend-line"></i>Hotel change</span>
    <span><i class="poster-legend-hotel">${hotelIconMarkup()}</i>Hotel</span>
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
