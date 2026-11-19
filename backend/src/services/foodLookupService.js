// foodLookupService.js
//
// Looks up nutrition facts for a food name using USDA FoodData Central.
// Needs USDA_API_KEY in backend/.env.
// All numbers are per 100 grams.

// Load backend/.env so USDA_API_KEY is available.
require("dotenv").config();

const SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.round(number * 10) / 10
    : null;
}

// Find one nutrient by its USDA name and unit.
function findNutrient(food, nutrientName, unit) {
  const nutrient = (food.foodNutrients || []).find(
    (item) =>
      item.nutrientName === nutrientName &&
      item.unitName === unit
  );

  return nutrient ? toNumber(nutrient.value) : null;
}

async function lookupFood(name, limit = 5) {
  if (!name || !String(name).trim()) {
    return [];
  }

  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey) {
    throw new Error("USDA_API_KEY is missing from backend/.env");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    query: String(name).trim(),
    pageSize: "10",
    // Only plain, generic foods (not branded products).
    dataType: "Foundation,SR Legacy",
  });

  const response = await fetch(`${SEARCH_URL}?${params}`);

  if (!response.ok) {
    throw new Error(
      `USDA returned status ${response.status}`
    );
  }

  const data = await response.json();

  return (data.foods || []).map((food) => ({
    name: food.description,
    brand: food.brandOwner || "",
    per100g: {
      calories: findNutrient(food, "Energy", "KCAL"),
      protein: findNutrient(food, "Protein", "G"),
      carbs: findNutrient(food, "Carbohydrate, by difference", "G"),
      fat: findNutrient(food, "Total lipid (fat)", "G"),
    },
  }))
    // Shortest names first, so "Bananas, raw" beats
    // "Bananas, dehydrated, or banana powder".
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, limit);
}

module.exports = {
  lookupFood
};
