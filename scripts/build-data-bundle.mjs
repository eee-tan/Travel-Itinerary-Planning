import fs from "node:fs/promises";

const source = new URL("../trip-data.json", import.meta.url);
const destination = new URL("../trip-data.js", import.meta.url);
const data = JSON.parse(await fs.readFile(source, "utf8"));

await fs.writeFile(
  destination,
  `/* Generated from trip-data.json by npm run build:data. */\nwindow.TRAVEL_PLAN_DATA_BUNDLE = ${JSON.stringify(data, null, 2)};\n`,
  "utf8"
);

console.log("Built trip-data.js for direct file:// preview support.");
