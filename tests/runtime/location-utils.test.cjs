const test = require("node:test");
const assert = require("node:assert/strict");
let parseLocationInput;
let isGoogleMapsUrl;

test.before(async () => {
  await import("../../location-utils.js");
  ({ parseLocationInput, isGoogleMapsUrl } = globalThis.LocationUtils);
});

test("extracts the official place slug from a Google Maps place URL", () => {
  const result = parseLocationInput("https://www.google.com/maps/place/Tokyo+Skytree/@35.7101,139.8107,17z/data=!3m1!4b1");
  assert.equal(result.label, "Tokyo Skytree");
  assert.equal(result.query, "Tokyo Skytree");
  assert.equal(result.source, "google-place-url");
});

test("extracts a Maps API query without exposing the URL as the label", () => {
  const result = parseLocationInput("https://www.google.com/maps/search/?api=1&query=Tokyo%20Haneda%20Airport");
  assert.equal(result.label, "Tokyo Haneda Airport");
  assert.equal(result.query, "Tokyo Haneda Airport");
  assert.ok(!result.label.startsWith("http"));
});

test("keeps a short Maps URL hidden behind a clean fallback name", () => {
  const result = parseLocationInput("https://maps.app.goo.gl/AbCdEf", "Kamikochi Visitor Center");
  assert.equal(result.label, "Kamikochi Visitor Center");
  assert.equal(result.source, "google-short-url");
  assert.ok(isGoogleMapsUrl(result.url));
});

test("reduces a full address to a compact display segment while preserving search text", () => {
  const input = "Tokyo Station, 1 Chome Marunouchi, Chiyoda City, Tokyo";
  const result = parseLocationInput(input);
  assert.equal(result.label, "Tokyo Station");
  assert.equal(result.query, input);
});
