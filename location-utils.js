(function exposeLocationUtils(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LocationUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createLocationUtils() {
  const GOOGLE_HOST = /(^|\.)(google\.[a-z.]+|googleusercontent\.com|maps\.app\.goo\.gl|goo\.gl)$/i;

  function decodePlaceText(value = "") {
    let decoded = String(value).replace(/\+/g, " ");
    try { decoded = decodeURIComponent(decoded); } catch { /* retain the readable portion */ }
    return decoded
      .replace(/^place_id:/i, "")
      .replace(/\s+/g, " ")
      .replace(/^\s*[-–—|·]\s*|\s*[-–—|·]\s*$/g, "")
      .trim();
  }

  function firstReadableSegment(value = "") {
    const cleaned = decodePlaceText(value)
      .replace(/^https?:\/\/\S+$/i, "")
      .replace(/\b(?:Japan|日本)\b\s*$/i, "")
      .trim();
    if (!cleaned) return "";
    const segments = cleaned.split(/\s*,\s*/).filter(Boolean);
    const named = segments.find((segment) => /[A-Za-zぁ-んァ-ヶ一-龠]/.test(segment) && !/^\d{3}-?\d{4}$/.test(segment));
    return (named || segments[0] || cleaned).trim();
  }

  function asUrl(value = "") {
    const text = String(value).trim();
    if (!/^https?:\/\//i.test(text)) return null;
    try { return new URL(text); } catch { return null; }
  }

  function isGoogleMapsUrl(value = "") {
    const url = asUrl(value);
    return Boolean(url && GOOGLE_HOST.test(url.hostname) && (/\/maps(?:\/|$)/i.test(url.pathname) || /maps\.app\.goo\.gl|goo\.gl/i.test(url.hostname)));
  }

  function parseLocationInput(value = "", fallbackLabel = "") {
    const raw = String(value).trim();
    const fallback = firstReadableSegment(fallbackLabel);
    const url = asUrl(raw);
    if (url && isGoogleMapsUrl(raw)) {
      const placeMatch = url.pathname.match(/\/maps\/(?:place|search)\/([^/@]+)/i);
      const pathLabel = placeMatch ? decodePlaceText(placeMatch[1]) : "";
      const parameter = ["query", "q", "destination", "daddr"]
        .map((key) => url.searchParams.get(key))
        .find((candidate) => candidate && !/^[-+]?\d+(?:\.\d+)?,\s*[-+]?\d+(?:\.\d+)?$/.test(candidate));
      const query = pathLabel || decodePlaceText(parameter || "") || fallback;
      return {
        label: firstReadableSegment(pathLabel || parameter || fallback) || "Google Maps location",
        query: query || raw,
        url: raw,
        source: pathLabel ? "google-place-url" : parameter ? "google-query-url" : "google-short-url"
      };
    }
    if (url) return { label: fallback || "Location", query: fallback || raw, url: raw, source: "external-url" };
    return {
      label: firstReadableSegment(raw) || fallback || "Location",
      query: decodePlaceText(raw) || fallback,
      url: "",
      source: raw.includes(",") ? "address" : "name"
    };
  }

  return { decodePlaceText, firstReadableSegment, isGoogleMapsUrl, parseLocationInput };
});
