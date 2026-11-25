

// ===========================================================
// SPACEBYTE - FOOD LOOKUP SERVICE
// File: backend/src/services/foodLookupService.js
//
// Searches USDA FoodData Central and ranks results so that
// ordinary raw foods are preferred over processed products.
//
// All nutrition values returned are per 100 grams.
// ===========================================================

const path = require("path");

// Load environment variables from backend/.env.
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const SEARCH_URL =
  "https://api.nal.usda.gov/fdc/v1/foods/search";

// Convert a value to a rounded number.
// Missing values remain null.
function toNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? Math.round(number * 10) / 10
    : null;
}

// Find a nutrient by its USDA name and unit.
function findNutrient(food, nutrientName, unit) {
  const nutrient = (food.foodNutrients || []).find(
    (item) =>
      item.nutrientName === nutrientName &&
      item.unitName === unit
  );

  return nutrient ? toNumber(nutrient.value) : null;
}

// Normalize food names for matching.
function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Check whether a name contains the actual food word.
// For example, "apples" matches "apple".
function containsFoodWord(name, foodName) {
  const normalized = normalizeName(name);
  const food = normalizeName(foodName);

  if (!food) return false;

  const words = normalized.split(" ");

  return words.some(
    (word) =>
      word === food ||
      (food.endsWith("y") &&
        word === food.slice(0, -1) + "ies") ||
      (food.endsWith("e") &&
        word === food + "s") ||
      word === food + "s"
  );
}

// Remove unrelated foods and processed products.
function isUnwantedMatch(name, searchName) {
  const normalized = normalizeName(name);
  const food = normalizeName(searchName);

  const excludedTerms = [
    "strudel",
    "croissant",
    "juice",
    "babyfood",
    "fruit butter",
    "dried",
    "dehydrated",
    "pie",
    "cake",
    "candy",
    "sauce",
    "preserves",
    "jam",
    "jelly",
    "cooked",
    "boiled",
    "microwave",
  ];

  if (
    excludedTerms.some((term) =>
      normalized.includes(term)
    )
  ) {
    return true;
  }

  // Prevent different fruits containing the search word
  // from being treated as the requested food.
  if (
    food === "apple" &&
    (
      normalized.includes("rose apple") ||
      normalized.includes("mammy apple") ||
      normalized.includes("sugar apple")
    )
  ) {
    return true;
  }

  if (
    food === "apple" &&
    normalized.includes("apricot")
  ) {
    return true;
  }

  return false;
}

// Rank USDA results by how closely they match the food.
function scoreFood(food, searchName) {
  const name = normalizeName(food.description);
  const search = normalizeName(searchName);

  if (!containsFoodWord(name, search)) {
    return -1000;
  }

  if (isUnwantedMatch(name, search)) {
    return -1000;
  }

  let score = 0;

  // Prefer raw foods.
  if (name.includes("raw")) {
    score += 30;
  }

  // Prefer foods with skin when the search asks for it.
  if (search.includes("with skin") && name.includes("with skin")) {
    score += 20;
  }

  // Prefer ordinary whole foods.
  if (name.includes("whole")) {
    score += 5;
  }

  // Penalize skinless foods when skin is requested.
  if (search.includes("with skin") && name.includes("without skin")) {
    score -= 20;
  }

  // Prefer entries with complete nutrition information.
  const calories = findNutrient(food, "Energy", "KCAL");
  const protein = findNutrient(food, "Protein", "G");
  const carbs = findNutrient(
    food,
    "Carbohydrate, by difference",
    "G"
  );
  const fat = findNutrient(food, "Total lipid (fat)", "G");

  if (calories !== null) score += 15;
  if (protein !== null) score += 3;
  if (carbs !== null) score += 3;
  if (fat !== null) score += 3;

  return score;
}

// Search USDA for a food.
async function lookupFood(name, limit = 5) {
  if (!name || !String(name).trim()) {
    return [];
  }

  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "USDA_API_KEY is missing from backend/.env"
    );
  }

  const searchName = String(name).trim();

  const params = new URLSearchParams({
    api_key: apiKey,
    query: searchName,
    pageSize: "25",
    dataType: "Foundation,SR Legacy",
  });

  const response = await fetch(
    `${SEARCH_URL}?${params}`
  );

  if (!response.ok) {
    throw new Error(
      `USDA returned status ${response.status}`
    );
  }

  const data = await response.json();

  const results = (data.foods || [])
    .map((food) => ({
      food,
      score: scoreFood(food, searchName),
    }))
    .filter((item) => item.score > -1000)
    .sort((a, b) => b.score - a.score)
    .map(({ food }) => ({
      name: food.description,
      brand: food.brandOwner || "",
      per100g: {
        calories: findNutrient(food, "Energy", "KCAL"),
        protein: findNutrient(food, "Protein", "G"),
        carbs: findNutrient(
          food,
          "Carbohydrate, by difference",
          "G"
        ),
        fat: findNutrient(
          food,
          "Total lipid (fat)",
          "G"
        ),
      },
    }))
    // Do not return entries without calorie information.
    .filter((food) => food.per100g.calories !== null);

  const resultLimit = Math.max(
    1,
    Math.min(Number(limit) || 5, 25)
  );

  return results.slice(0, resultLimit);
}

module.exports = {
  lookupFood,
};
