// foodLookup.js
//
// Browser helper for nutrition lookup.
// Asks the SpaceByte backend (/food-lookup) to search
// Open Food Facts, because browsers block direct searches.
// All numbers are per 100 grams.

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

// Ask the backend to search for a food.
// Returns an array of possible matches.
export async function lookupFood(name, limit = 5) {
  if (!name || !String(name).trim()) {
    return [];
  }

  const params = new URLSearchParams({
    name: String(name).trim(),
    limit: String(limit),
  });

  const response = await fetch(
    `${API_BASE_URL}/food-lookup?${params}`
  );

  if (!response.ok) {
    throw new Error(
      `Food lookup failed with status ${response.status}`
    );
  }

  const data = await response.json();

  return data.results;
}
