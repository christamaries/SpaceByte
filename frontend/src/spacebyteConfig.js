
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

// createElement renders the food icons without JSX,
// since this is a plain .js file.
import { createElement } from "react";

// Food icons from lucide-react.
import {
  Apple, Banana, Bean, Beef, Carrot, Cherry, Coffee, Cookie,
  Croissant, CupSoda, Droplet, Drumstick, EggFried, Fish, Milk,
  Nut, Pizza, Salad, Sandwich, Shrimp, Soup, UtensilsCrossed, Wheat,
} from "lucide-react";


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
    { initials: "CS", color: "#6c63ff" },
    { initials: "EH", color: "#ee5fa7" },
    { initials: "AB", color: "#5ad1b0" },
    { initials: "JC", color: "#f9d56e" },
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
// INVENTORY ITEM TYPES
// ---------------------------------------------------------

// Food categories used by every inventory dropdown, so the
// Inventory and Manual Inventory pages save the same types.
export const ITEM_TYPES = [
  "Natural Form",
  "Beverage",
  "Thermostabilized",
  "Rehydratable",
  "Irradiated",
  "Intermediate Moisture",
  "Fresh Food",
  "Other",
];


// ---------------------------------------------------------
// FOOD ICON LOOKUP
// ---------------------------------------------------------

// Associates food-related keywords with lucide-react icons
// and a tint color.
//
// The application searches a food's name for one of these
// keywords and displays the matching icon.
//
// Example:
// "Shrimp Cocktail" matches "shrimp" and displays the Shrimp icon.
//
// The order matters: the first matching keyword is used.
//
// Tint colors follow the app's palette:
// mint #20d0a7, blue #83cfff, yellow #ffd166, pink #fa69aa.
const ICONS = [
  ["tortilla", Sandwich, "#ffd166"],
  ["taco", Sandwich, "#ffd166"],
  ["wrap", Sandwich, "#ffd166"],

  ["shrimp", Shrimp, "#fa69aa"],
  ["seafood", Shrimp, "#fa69aa"],
  ["fish", Fish, "#83cfff"],

  ["coffee", Coffee, "#ffd166"],
  ["tea", Coffee, "#20d0a7"],

  ["mac", Pizza, "#ffd166"],
  ["cheese", Pizza, "#ffd166"],
  ["pizza", Pizza, "#ffd166"],

  ["egg", EggFried, "#ffd166"],
  ["omelet", EggFried, "#ffd166"],

  ["granola", Wheat, "#ffd166"],
  ["oatmeal", Wheat, "#ffd166"],
  ["cereal", Wheat, "#ffd166"],
  ["wheat", Wheat, "#ffd166"],
  ["cracker", Cookie, "#ffd166"],

  ["banana", Banana, "#ffd166"],
  ["fruit", Apple, "#fa69aa"],
  ["apple", Apple, "#fa69aa"],
  ["berr", Cherry, "#fa69aa"],

  ["toast", Croissant, "#ffd166"],
  ["bread", Croissant, "#ffd166"],
  ["sandwich", Sandwich, "#ffd166"],

  ["noodle", Soup, "#83cfff"],
  ["soup", Soup, "#83cfff"],
  ["rice", Bean, "#20d0a7"],

  ["chicken", Drumstick, "#fa69aa"],
  ["teriyaki", Drumstick, "#fa69aa"],
  ["beef", Beef, "#fa69aa"],

  ["stew", Soup, "#83cfff"],
  ["curry", Soup, "#ffd166"],
  ["veg", Carrot, "#20d0a7"],
  ["salad", Salad, "#20d0a7"],

  ["water", Droplet, "#83cfff"],
  ["milk", Milk, "#83cfff"],
  ["juice", CupSoda, "#83cfff"],
  ["bar", Cookie, "#ffd166"],
  ["nut", Nut, "#ffd166"],
];

// Icon and color used when no keyword matches.
const DEFAULT_ICON = [null, UtensilsCrossed, "#8b91bd"];


// ---------------------------------------------------------
// FOOD ICON FUNCTION
// ---------------------------------------------------------

// Finds the icon entry that matches a food's name.
//
// @param {string} name - Name of the food.
// @returns {{Icon: Function, color: string}} Matching icon
//          component and tint color, or the default.
export function foodIcon(name = "") {

  // Convert the food name to lowercase so the search
  // works regardless of capitalization.
  const n = name.toLowerCase();

  // Find the first keyword contained in the food name.
  // If no keyword matches, use the default utensils icon.
  const [, Icon, color] =
    ICONS.find(([key]) => n.includes(key)) || DEFAULT_ICON;

  return { Icon, color };
}


// Renders the icon for a food's name.
//
// Usage: <FoodIcon name={item.name} size={18} />
//
// The icon inherits the surrounding text color unless
// tinted is true, in which case it uses its own color.
export function FoodIcon({ name = "", size = 18, tinted = false }) {
  const { Icon, color } = foodIcon(name);

  return createElement(Icon, {
    size,
    strokeWidth: 2,
    color: tinted ? color : "currentColor",
    "aria-hidden": true,
  });
}
