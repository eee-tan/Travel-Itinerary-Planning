import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "trip-data.json"), "utf8"));

const mapSearchUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const candidates = [];

const addQuery = (label, query) => {
  if (typeof query === "string" && query.trim()) {
    candidates.push({ label, url: mapSearchUrl(query.trim()) });
  }
};
const addUrl = (label, url) => {
  if (typeof url === "string" && url.trim()) candidates.push({ label, url: url.trim() });
};

for (const item of data.accommodations || []) addQuery(item.name, item.address || item.name);
const rental = data.groundTransport?.rentalCar;
if (rental) {
  addQuery(`${rental.company} pickup`, rental.pickup?.address || rental.pickup?.location);
  addQuery(`${rental.company} return`, rental.dropoff?.address || rental.pickup?.address || rental.dropoff?.vehicleReturnPoint);
}
for (const item of data.expenses?.items || []) addQuery(item.description, item.address);
for (const item of data.places || []) {
  addQuery(item.name, item.address || item.query || `${item.name}, ${item.city || "Japan"}`);
}
for (const item of data.mapLinks?.navigationPlaces || []) {
  addQuery(item.label || item.name, item.query || item.address || item.name);
}
for (const item of data.mapLinks?.providedGoogleMapsLinks || []) {
  addUrl(item.label || item.name, item.url);
}
for (const item of data.restaurants || []) {
  if (item.googleMapsUrl) addUrl(item.name, item.googleMapsUrl);
  else addQuery(item.name, `${item.name}, ${item.city || "Japan"}`);
}

const failures = [];
for (const candidate of candidates) {
  try {
    const parsed = new URL(candidate.url);
    const permittedHosts = new Set([
      "www.google.com",
      "google.com",
      "maps.google.com",
      "maps.app.goo.gl"
    ]);
    if (parsed.protocol !== "https:" || !permittedHosts.has(parsed.hostname)) {
      failures.push(`${candidate.label}: ${candidate.url}`);
    }
  } catch {
    failures.push(`${candidate.label}: ${candidate.url}`);
  }
}

if (failures.length) {
  console.error("Invalid Google Maps links:\n" + failures.join("\n"));
  process.exit(1);
}

console.log(`Validated ${candidates.length} Google Maps location links.`);
