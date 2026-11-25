
// ===========================================================
// SPACEBYTE - FOOD LOOKUP SERVICE
// File: frontend/src/services/foodLookup.js
//
// PURPOSE:
// 1. Request food information from the SpaceByte backend.
// 2. Receive nutrition matches from the backend.
// 3. Support both array and object response formats.
// 4. Return the top nutrition matches to OcrCapture.jsx.
// 5. Preserve nutrition values, brand names, and serving data
//    returned by the backend.
//
// IMPORTANT:
// API credentials stay in backend/.env.
// The frontend never communicates directly with USDA
// or FatSecret.
// ===========================================================

// Backend address.
// Uses VITE_API_URL from frontend/.env when available.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

// ===========================================================
// SEARCH FOR FOOD
// ===========================================================

export async function lookupFood(name, limit = 3) {

  // ---------------------------------------------------------
  //  Validate the food name.
  // ---------------------------------------------------------

  if (!name || !String(name).trim()) {
    return [];
  }

  // ---------------------------------------------------------
  //  Prepare the search parameters.
  // ---------------------------------------------------------

  const params = new URLSearchParams({
    name: String(name).trim(),
    limit: String(limit),
  });

  // ---------------------------------------------------------
  //  Request nutrition information from the backend.
  // ---------------------------------------------------------

  const response = await fetch(
    `${API_BASE_URL}/food-lookup?${params.toString()}`
  );

  // ---------------------------------------------------------
  //  Handle backend errors.
  // ---------------------------------------------------------

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.error ||
      `Food lookup failed with status ${response.status}`
    );
  }

  // ---------------------------------------------------------
  //  Read the response from the backend.
  // ---------------------------------------------------------

  const data = await response.json();

  // IMPORTANT:
  // Your current backend returns a plain array:
  //
  // [
  //   { name: "Bananas, raw", per100g: {...} },
  //   { name: "Bananas, overripe, raw", per100g: {...} }
  // ]
  //
  // Other backend versions may return:
  //
  // {
  //   results: [...],
  //   providerErrors: {}
  // }
  //
  // This service supports BOTH formats.

  let results = [];

  if (Array.isArray(data)) {

    // Current backend format.
    results = data;

  } else if (data && Array.isArray(data.results)) {

    // Alternative object response format.
    results = data.results;

    // Report provider errors without discarding
    // successful results from other providers.
    if (
      data.providerErrors &&
      Object.keys(data.providerErrors).length > 0
    ) {
      console.warn(
        "Some nutrition providers failed:",
        data.providerErrors
      );
    }

  } else {

    // Unexpected response format.
    console.error(
      "Unexpected food lookup response:",
      data
    );

    return [];
  }

  // ---------------------------------------------------------
  //  Keep only valid nutrition matches.
  // ---------------------------------------------------------

  const validResults = results.filter((food) => {

    return (
      food &&
      typeof food.name === "string" &&
      food.name.trim().length > 0
    );

  });

  // ---------------------------------------------------------
  //  Return the requested number of matches.
  // ---------------------------------------------------------

  return validResults.slice(0, Math.max(1, Number(limit) || 3));
}
