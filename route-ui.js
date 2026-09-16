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
const transferRouteColors = new Map([
  [4, "#397dc1"], [6, "#2b8c89"], [9, "#718a4a"], [11, "#8865a5"],
  [13, "#b8674f"], [15, "#c4902f"]
]);
const transferRouteLabels = new Map([
  [4, ["Tokyo", "Minakami"]],
  [6, ["Minakami", "Toyama"]],
  [9, ["Toyama", "Nagoya"]],
  [11, ["Nagoya", "Nagano"]],
  [13, ["Nagano", "Hakone"]],
  [15, ["Hakone", "Kawagoe"]]
]);
const transferPlaceIds = new Map([
  [4, ["place-haneda", "place-minakami"]],
  [6, ["place-minakami", "place-tonami"]],
  [9, ["place-tonami", "place-nagoya"]],
  [11, ["place-nagoya", "place-nagano"]],
  [13, ["place-nagano", "place-hakone"]],
  [15, ["place-hakone", "place-kawagoe"]]
]);

function mapRouteDefinitions(source) {
  return routeLayersFor(source).map(({ day }, index) => ({
    day,
    color: transferRouteColors.get(day) || journeyColors[index % journeyColors.length]
  }));
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
  { day: 4, points: [[139.750794,35.550666],[139.753231,35.616564],[139.690114,35.650511],[139.682786,35.696969],[139.614942,35.708093],[139.61847,35.749149],[139.546461,35.791213],[139.477122,35.879696],[139.382907,35.956947],[139.377153,36.03582],[139.228994,36.136466],[139.141723,36.245414],[139.099358,36.264706],[139.091183,36.307446],[139.031982,36.365007],[139.011736,36.467476],[139.061454,36.563192],[139.079426,36.644492],[138.976848,36.711492],[138.956936,36.785165]] },
  { day: 6, points: [[138.956936,36.785165],[138.974773,36.746954],[138.849247,36.887219],[138.840151,36.927179],[138.80286,36.948977],[138.807764,36.98441],[138.739377,36.988148],[138.694819,37.051073],[138.663733,37.043438],[138.541282,37.159476],[138.101389,37.173891],[138.038248,37.121482],[137.850503,37.044796],[137.852668,37.026689],[137.835408,37.018145],[137.606806,36.972383],[137.530123,36.92891],[137.448865,36.852899],[137.378448,36.74006],[137.312039,36.675197],[137.230443,36.646228],[137.150203,36.681795],[137.06562,36.689873],[136.995385,36.660474],[136.988095,36.630003],[137.016552,36.614252]] },
  { day: 9, points: [[137.016552,36.614252],[136.987067,36.585807],[137.008973,36.551821],[136.988036,36.527959],[136.970574,36.435813],[136.918826,36.400894],[136.885019,36.403164],[136.868422,36.374818],[136.900284,36.318895],[136.889183,36.294483],[136.906487,36.261775],[136.87744,36.223954],[136.898093,36.202413],[136.905846,36.126631],[136.943347,36.086835],[136.948998,36.048962],[136.88999,36.000004],[136.87684,35.951668],[136.830184,35.927876],[136.913675,35.782536],[136.940066,35.767814],[136.948968,35.691302],[136.967697,35.681468],[136.936313,35.604171],[136.948678,35.59432],[136.914536,35.562366],[136.899444,35.492814],[136.933643,35.458444],[137.013076,35.450114],[136.9937,35.386298],[136.93173,35.353431],[136.913822,35.318869],[136.914478,35.174085],[136.889231,35.169194]] },
  { day: 11, points: [[136.889231,35.169194],[136.919422,35.174313],[136.94791,35.228424],[137.040844,35.319019],[137.158851,35.343337],[137.188571,35.366482],[137.233891,35.361938],[137.335411,35.432482],[137.512169,35.490478],[137.545505,35.548781],[137.537237,35.583239],[137.597117,35.587066],[137.626421,35.66441],[137.715051,35.72231],[137.682448,35.83143],[137.759482,35.880151],[137.771629,35.920628],[137.850259,35.992173],[137.935629,36.115071],[137.980927,36.1184],[137.929812,36.206791],[137.938779,36.231262],[137.923882,36.325178],[137.98661,36.359243],[138.011641,36.403252],[138.008765,36.438858],[138.091872,36.498213],[138.079556,36.51122],[138.098687,36.534648],[138.201083,36.572053]] },
  { day: 13, points: [[138.201083,36.572053],[138.139223,36.544999],[138.204009,36.447677],[138.480104,36.313159],[138.456301,36.230036],[138.486148,36.168675],[138.466953,36.055636],[138.493834,36.003241],[138.510477,36.004188],[138.439467,35.925487],[138.417576,35.782537],[138.537817,35.643975],[138.571007,35.632981],[138.573483,35.599234],[138.598279,35.569133],[138.593462,35.537062],[138.62478,35.528829],[138.608645,35.446201],[138.571896,35.387448],[138.611367,35.273481],[138.754129,35.239229],[138.816265,35.261083],[138.918728,35.215889],[138.978755,35.230924],[138.986374,35.199377],[139.026325,35.190999]] },
  { day: 15, points: [[139.026325,35.190999],[139.132789,35.245246],[139.154287,35.282233],[139.239615,35.308465],[139.234175,35.353173],[139.291227,35.403708],[139.396003,35.42826],[139.534822,35.537509],[139.599741,35.623492],[139.626186,35.627622],[139.613241,35.668648],[139.61847,35.749149],[139.573976,35.767276],[139.508639,35.830582],[139.457451,35.893453],[139.480798,35.90549]] }
];

const posterRouteStops = [
  { id: "place-haneda", label: "Tokyo", mapLabel: "Tokyo", query: "Nissan Rent-a-car, 5 Chome-3-1 Haneda, Ota City, Tokyo 144-0043, Japan", geo: { lat: 35.5506924, lng: 139.7506552 } },
  { id: "place-minakami", label: "Minakami", mapLabel: "Minakami", query: "Bettei Senjyuan, 614 Tanigawa, Minakami, Gunma 379-1619, Japan", geo: { lat: 36.7854796, lng: 138.9574947 } },
  { id: "place-tonami", label: "Toyama", mapLabel: "Toyama", query: "Mercure Toyama Tonami Resort & Spa, 330 Tenno, Yasukawa, Tonami, Toyama 939-1438, Japan", geo: { lat: 36.6145447, lng: 137.0169883 } },
  { id: "place-nagoya", label: "Nagoya", mapLabel: "Nagoya", query: "ibis Styles Nagoya, 4 Chome-22-24 Meieki, Nakamura Ward, Nagoya, Aichi 450-0002, Japan", geo: { lat: 35.1690479, lng: 136.8892791 } },
  { id: "place-nagano", label: "Nagano", mapLabel: "Nagano", query: "Mercure Nagano Matsushiro Resort & Spa, 1372-1 Matsushiromachi Nishiderao, Nagano 381-1215, Japan", geo: { lat: 36.5715514, lng: 138.2006133 } },
  { id: "place-hakone", label: "Hakone", mapLabel: "Hakone", query: "Hakone Hotel, 65 Hakone, Ashigarashimo District, Kanagawa 250-0521, Japan", geo: { lat: 35.1907129, lng: 139.0260216 } },
  { id: "place-kawagoe", label: "Kawagoe", mapLabel: "Kawagoe", query: "Kawagoe Tobu Hotel, 8-1 Wakitahoncho, Kawagoe, Saitama 350-1123, Japan", geo: { lat: 35.9057121, lng: 139.4812316 } }
];

function googleDirectionsUrl(stops) {
  return `https://www.google.com/maps/dir/${stops.map((stop) => `${stop.geo.lat},${stop.geo.lng}`).join("/")}/?travelmode=driving`;
}

function hotelIconMarkup() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 4.6 20 11.2V19.4H14.4V14.6H9.6V19.4H4V11.2Z"/></svg>';
}

function flightIconMarkup() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5Z"/></svg>';
}

const posterLabelPlacement = { "place-haneda": "left", "place-minakami": "right", "place-tonami": "below", "place-nagoya": "above", "place-nagano": "right", "place-hakone": "left", "place-kawagoe": "left" };

function posterPlaceMarkupFor(source, place, isActive, roleLabel) {
  const point = posterPoint(place.geo);
  const label = place.mapLabel || place.lines?.[0] || place.label || place.id;
  const officialName = place.label || label;
  const placement = posterLabelPlacement[place.id] || "below";
  return `<button type="button" class="poster-place-marker${isActive ? " is-active" : " is-dimmed"}"
    style="--left:${(point.x / posterMap.width * 100).toFixed(3)}%;--top:${(point.y / posterMap.height * 100).toFixed(3)}%"
    data-place-id="${escapeHtml(place.id)}" data-place-query="${escapeHtml(place.query || officialName)}" data-place-label="${escapeHtml(officialName)}" data-map-region="${escapeHtml(source.id || "")}" data-place-role="${escapeHtml(roleLabel)}"
    aria-label="${escapeHtml(officialName)}">${place.id === "place-haneda" ? flightIconMarkup() : hotelIconMarkup()}<span class="poster-place-label poster-place-label--${placement}">${escapeHtml(label)}</span></button>`;
}

function posterRouteColor(day) {
  return mapRoutes.find((item) => item.day === day)?.color || "#1769aa";
}

function posterMapMarkup(source, visiblePlaceIds, selectedRoute) {
  const activeIds = new Set(visiblePlaceIds || []);
  const routeMarkup = posterTransferRoutes.map((transfer) => {
    const points = transfer.points.map(([lng, lat]) => posterPoint({ lat, lng }));
    const path = geographicRoutePath(points);
    const isActive = !selectedRoute || transfer.day === selectedRoute.day;
    return `<path class="poster-route${isActive ? " is-active" : " is-dimmed"}" data-poster-route-day="${transfer.day}" style="--route-color:${posterRouteColor(transfer.day)}" d="${path}"/>`;
  }).join("");
  const roleLabel = selectedRoute ? `Day ${selectedRoute.day}` : "Overview";
  const places = posterRouteStops;
  const placeMarkup = places
    .map((place) => posterPlaceMarkupFor(source, place, !selectedRoute || activeIds.has(place.id), roleLabel))
    .join("");
  return `<div class="poster-map" role="group" aria-label="${selectedRoute ? `Day ${selectedRoute.day}` : "17-day route overview"} on a Kanto and Chubu relief map">
    <img src="assets/maps/kanto-chubu-relief-clean.png?v=20260914-2" alt="" draggable="false">
    <svg class="poster-route-layer" viewBox="0 0 ${posterMap.width} ${posterMap.height}" aria-hidden="true">${routeMarkup}</svg>
    <div class="poster-marker-layer">${placeMarkup}</div>
  </div>`;
}

function posterRouteDatesMarkup() {
  const rows = posterTransferRoutes.map((transfer) => {
    const day = state.data.days.find((item) => item.day === transfer.day);
    if (!day) return "";
    const [from, to] = transferRouteLabels.get(transfer.day);
    return `<button type="button" class="poster-route-key" data-poster-legend-day="${transfer.day}" style="--route-color:${posterRouteColor(transfer.day)}" aria-label="Highlight Day ${day.day}: ${escapeHtml(from)} to ${escapeHtml(to)}"><i></i><span><b>${escapeHtml(formatCompactDate(day.date))}</b><small>${escapeHtml(from)} → ${escapeHtml(to)}</small></span></button>`;
  }).join("");
  return `<div class="poster-route-dates" role="list" aria-label="Six driving legs by date">${rows}</div>`;
}

function travelMapMarkup(source, route) {
  const day = route && state.data.days.find((item) => item.day === route.day);
  const layout = route && dailyMapLayoutFor(source, route.day);
  const placeLayers = placeLayersFor(source);
  const visiblePlaceIds = route
    ? (transferPlaceIds.get(route.day) || layout?.places || [])
    : (source.overviewPlaceIds || placeLayers.map((place) => place.id));
  const transferLabel = route && transferRouteLabels.get(route.day);
  const googleStops = route
    ? (transferPlaceIds.get(route.day) || []).map((id) => posterRouteStops.find((stop) => stop.id === id)).filter(Boolean)
    : posterRouteStops;
  const mapNote = route
    ? `Day ${day.day} · ${formatFullCompactDate(day.date)}${transferLabel ? ` · ${transferLabel[0]} → ${transferLabel[1]}` : ""}`
    : "Kanto & Chubu · 17-day overview";
  return `<div class="travel-map-block ${route ? "is-daily" : "is-overview"}" ${route ? `style="--route-color:${route.color}"` : ""}>
    <div class="journey-map-layout">
      <div class="journey-map-stage">
        ${posterMapMarkup(source, visiblePlaceIds, route)}
      </div>
    </div>
    <div class="poster-map-tools">${posterLegendMarkup()}<a class="poster-google-route" href="${escapeHtml(googleDirectionsUrl(googleStops))}" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a></div>
    ${route ? "" : posterRouteDatesMarkup()}
    <div class="map-utility"><span>${escapeHtml(mapNote)} · Fixed illustrated route poster</span></div>
  </div>`;
}

function posterLegendMarkup() {
  return `<aside class="poster-map-legend" aria-label="Map legend">
    <span><i class="poster-legend-line"></i>Route</span>
    <span><i class="poster-legend-hotel">${hotelIconMarkup()}</i>Hotel</span>
    <span><i class="poster-legend-hotel">${flightIconMarkup()}</i>Flight</span>
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
  <div class="route-day-tabs" aria-label="Trip route dates"><button type="button" data-route-day="0" aria-pressed="${!route}">Overview</button>${mapRoutes.map((item) => { const day = state.data.days.find((candidate) => candidate.day === item.day); const hasRoute = transferRouteColors.has(item.day); return day ? `<button type="button" data-route-day="${item.day}" style="--route-color:${item.color}" aria-pressed="${item === route}">${hasRoute ? "<i></i>" : ""}Day ${day.day}, ${escapeHtml(formatCompactDate(day.date))}</button>` : ""; }).join("")}</div>${travelMapMarkup(source, route)}`;
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
      renderRoutePanel(selectedRegionId, selectedDay);
      if (dayButton && selectedDay) window.openItineraryDay?.(selectedDay);
      return;
    }
    if (event.target.closest("[data-close-route-popover]")) { closePopover(true); return; }
    const placePin = event.target.closest("[data-place-id]");
    if (placePin) {
      const source = travelMapSource(state.data?.routeMap, placePin.dataset.mapRegion);
      const options = placePin.dataset.placeQuery
        ? [[placePin.dataset.placeLabel, placePin.dataset.placeQuery]]
        : placeOptions(source, placePin.dataset.placeId);
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
