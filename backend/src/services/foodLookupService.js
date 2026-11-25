
// ===========================================================
// SPACEBYTE - FOOD LOOKUP SERVICE
// File: frontend/src/services/foodLookup.js
//
// PURPOSE:
// 1. Request food information from the SpaceByte backend.
// 2. Retrieve results from USDA and FatSecret.
// 3. Return standardized nutrition information.
// 4. Preserve provider information and serving sizes.
// 5. Report provider-specific errors when available.
//
// IMPORTANT:
// API credentials stay in backend/.env.
// The frontend never communicates directly with USDA
// or FatSecret.
// ===========================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

// -----------------------------------------------------------
// SEARCH FOR FOOD
// -----------------------------------------------------------

export async function lookupFood(name, limit = 5) {

  // Validate the food name.
  if (!name || !String(name).trim()) {
    return [];
  }

  // Prepare the search parameters.
  const params = new URLSearchParams({
    name: String(name).trim(),
    limit: String(limit),
  });

  // Send the request to the SpaceByte backend.
  const response = await fetch(
    `${API_BASE_URL}/food-lookup?${params}`
  );

  // Handle HTTP errors.
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.error ||
      `Food lookup failed with status ${response.status}`
    );
  }

  // Read the backend response.
  const data = await response.json();

  // The backend returns:
  // {
  //   results: [],
  //   providerErrors: {}
  // }

  // Make sure results are always an array.
  if (!Array.isArray(data.results)) {
    console.error("Unexpected food lookup response:", data);
    return [];
  }

  // Report individual provider failures without discarding
  // results returned successfully by the other provider.
  if (
    data.providerErrors &&
    Object.keys(data.providerErrors).length > 0
  ) {
    console.warn(
      "Some nutrition providers failed:",
      data.providerErrors
    );
  }

  return data.results;
}
