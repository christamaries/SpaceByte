
/*
===========================================================
 SPACEBYTE - SHARED APPLICATION CONFIGURATION
 File: frontend/src/spacebyteConfig.js

 PURPOSE:
 Stores shared settings used throughout the SpaceByte
 frontend, including crew information, nutrition targets,
 and food icons.

 NOTE:
 These values are currently stored in the frontend.
 They can eventually be moved into Firestore or the backend
 so they can be updated dynamically.
===========================================================
*/


// ---------------------------------------------------------
// CREW CONFIGURATION
// ---------------------------------------------------------

// Stores the mission's crew-level settings.
export const CREW = {
  // Total number of crew members participating in the mission.
  size: 4,

  // Current mission day displayed in the dashboard and planner.
  missionDay: 112,

  // Crew member information used for visual identification.
  // Initials and colors can be displayed in crew avatars.
  members: [
    { initials: "CR", color: "#6c63ff" },
    { initials: "AK", color: "#ee5fa7" },
    { initials: "JL", color: "#5ad1b0" },
    { initials: "MO", color: "#f9d56e" },
  ],
};


// ---------------------------------------------------------
// DAILY NUTRITION TARGETS
// ---------------------------------------------------------

// Daily nutrition goals PER CREW MEMBER.
// These values can be used by the dashboard and meal planner
// to calculate nutritional progress.
//
// IMPORTANT:
// The calorie target matches CALORIE_TARGET in the backend
// file dashboardService.js.
export const TARGETS = {
  // Recommended daily calorie target in kilocalories.
  calories: 2800,

  // Daily protein target in grams.
  // Placeholder value that can be adjusted.
  protein: 120,

  // Daily carbohydrate target in grams.
  // Placeholder value that can be adjusted.
  carbs: 350,

  // Daily fat target in grams.
  // Placeholder value that can be adjusted.
  fat: 90,
};


// ---------------------------------------------------------
// FOOD ICON LOOKUP
// ---------------------------------------------------------

// Associates food-related keywords with emojis.
//
// The application searches a food's name for one of these
// keywords and displays the matching emoji.
//
// Example:
// "Shrimp Cocktail" matches "shrimp" and displays 🍤.
//
// The order matters: the first matching keyword is used.
const ICONS = [
  ["tortilla", "🌮"],
  ["taco", "🌮"],
  ["wrap", "🌯"],

  ["shrimp", "🍤"],
  ["seafood", "🦐"],
  ["fish", "🐟"],

  ["coffee", "☕"],
  ["tea", "🍵"],

  ["mac", "🧀"],
  ["cheese", "🧀"],
  ["pizza", "🍕"],

  ["egg", "🍳"],
  ["omelet", "🍳"],

  ["granola", "🥣"],
  ["oatmeal", "🥣"],
  ["cereal", "🥣"],

  ["fruit", "🍎"],
  ["apple", "🍎"],
  ["berr", "🍓"],

  ["toast", "🍞"],
  ["bread", "🍞"],
  ["sandwich", "🥪"],

  ["noodle", "🍜"],
  ["soup", "🥣"],
  ["rice", "🍚"],

  ["chicken", "🍗"],
  ["teriyaki", "🍗"],
  ["beef", "🥩"],

  ["stew", "🍲"],
  ["curry", "🍛"],
  ["veg", "🥦"],

  ["water", "💧"],
  ["bar", "🍫"],
  ["nut", "🥜"],
];


// ---------------------------------------------------------
// FOOD ICON FUNCTION
// ---------------------------------------------------------

// Finds an emoji that matches a food's name.
//
// @param {string} name - Name of the food.
// @returns {string} Matching emoji or a default food emoji.
export function foodIcon(name = "") {

  // Convert the food name to lowercase so the search
  // works regardless of capitalization.
  const n = name.toLowerCase();

  // Find the first keyword contained in the food name.
  const hit = ICONS.find(([key]) => n.includes(key));

  // Return the matching emoji.
  // If no keyword matches, display the default plate emoji.
  return hit ? hit[1] : "🍽️";
}
