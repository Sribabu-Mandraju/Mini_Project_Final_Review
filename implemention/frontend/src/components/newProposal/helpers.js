export const formatMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
};

export const getStepStatus = (stepIndex, activeIndex, maxReachedIndex) => {
  if (stepIndex < activeIndex) return "done";
  if (stepIndex === activeIndex) return "active";
  if (stepIndex <= maxReachedIndex) return "reachable";
  return "locked";
};

export const geocodeAddress = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    address,
  )}`;
  const response = await fetch(url, {
    headers: { "Accept-Language": "en" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch location");
  }

  const data = await response.json();
  if (!data?.length) {
    throw new Error("No results found");
  }

  const { lat, lon, display_name: displayName } = data[0];
  return {
    latitude: Number.parseFloat(lat),
    longitude: Number.parseFloat(lon),
    displayName,
  };
};

export const parsePostcodes = (postcodeValue) => {
  if (!postcodeValue) return [];

  const rawParts = String(postcodeValue)
    .split(/[;,/]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const normalized = [];
  for (const part of rawParts) {
    const sixDigit = part.match(/\b\d{6}\b/g);
    if (sixDigit?.length) {
      normalized.push(...sixDigit);
    } else {
      normalized.push(part.toUpperCase());
    }
  }

  return normalized;
};

export const fetchPincodesInRadius = async (
  latitude,
  longitude,
  radiusKm,
  signal,
) => {
  const radiusMeters = Math.max(100, Math.round(radiusKm * 1000));
  const query = `[out:json][timeout:25];
(
  node["addr:postcode"](around:${radiusMeters},${latitude},${longitude});
  way["addr:postcode"](around:${radiusMeters},${latitude},${longitude});
  relation["addr:postcode"](around:${radiusMeters},${latitude},${longitude});
);
out tags;`;

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: query,
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pincode data from ${endpoint}`);
      }

      const data = await response.json();
      const pincodeSet = new Set();
      for (const element of data?.elements || []) {
        const postcode = element?.tags?.["addr:postcode"];
        for (const parsed of parsePostcodes(postcode)) {
          pincodeSet.add(parsed);
        }
      }
      return [...pincodeSet].sort((a, b) => a.localeCompare(b));
    } catch (error) {
      if (error.name === "AbortError") throw error;
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to fetch pincodes");
};
