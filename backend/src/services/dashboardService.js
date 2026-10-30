
 /*
===========================================================
 SPACEBYTE - DASHBOARD SERVICE
 File: backend/src/services/dashboardService.js

 PURPOSE:
 1. Gather inventory data for the dashboard.
 2. Retrieve the user's nutrition totals for today.
 3. Calculate food inventory statuses.
 4. Group food items into alert categories.
 5. Calculate how many calories remain for the day.
 6. Return one combined dashboard data object.

 USED BY:
 dashboardController.js

 DEPENDENCIES:
 - inventoryService.js
 - nutritionService.js

 NOTE:
 This service combines data from other services.
 The controller handles the HTTP request and response.
===========================================================
*/


// ==========================================
//          IMPORT INVENTORY SERVICE
// ==========================================

// Import functions from inventoryService.js.
//
// getInventory:
// Retrieves food inventory records from Firestore.
//
// getFoodStatus:
// Determines whether an inventory item is OK, LOW,
// EXPIRING, or EXPIRED based on its stored information.
const {
  getInventory,
  getFoodStatus
} = require("./inventoryService");


// ==========================================
//          IMPORT NUTRITION SERVICE
// ==========================================

// Import the nutrition calculation function.
//
// getTodayNutrition:
// Retrieves the authenticated user's nutrition totals
// for the current day.
const {
  getTodayNutrition
} = require("./nutritionService");


// ==========================================
//          DASHBOARD CONFIGURATION
// ==========================================

// Set the daily calorie target used by the dashboard.
//
// Keep this value consistent with nutritionController.js
// so the dashboard and nutrition page display the same target.
const CALORIE_TARGET = 2800;


// ==========================================
//             BUILD DASHBOARD
// ==========================================

// Gather all the information required by the SpaceByte
// Crew Dashboard.
//
// Parameter:
// userId - The Firebase UID of the authenticated user.
//
// Returns:
// A combined object containing inventory, alerts,
// and nutrition information.
async function getDashboard(userId) {

  // ----------------------------------------
  // 1. RETRIEVE INVENTORY
  // ----------------------------------------

  // Request the inventory records from inventoryService.js.
  //
  // IMPORTANT:
  // getInventory() is currently called without userId.
  // If inventory records belong to individual users,
  // verify that the inventory service retrieves the
  // correct user's records.
  const inventory = await getInventory();


  // ----------------------------------------
  // 2. RETRIEVE TODAY'S NUTRITION
  // ----------------------------------------

  // Call the nutrition service to retrieve the
  // authenticated user's nutrition totals for today.
  //
  // Passing userId allows the nutrition service to
  // identify which user's consumption records to retrieve.
  const nutrition = await getTodayNutrition(userId);


  // ----------------------------------------
  // 3. CALCULATE INVENTORY STATUSES
  // ----------------------------------------

  // Create a new array containing the inventory items
  // along with their calculated status.
  //
  // The spread operator (...food) preserves all existing
  // properties of each inventory item.
  //
  // getFoodStatus(food) determines whether the item is:
  // OK       - Inventory quantity is sufficient.
  // LOW      - Inventory quantity is running low.
  // EXPIRING - Food is approaching its expiration date.
  // EXPIRED  - Food has passed its expiration date.
  const items = inventory.map(food => ({
    ...food,
    status: getFoodStatus(food)
  }));


  // ----------------------------------------
  // 4. GROUP INVENTORY ALERTS
  // ----------------------------------------

  // Filter the inventory list to find items
  // that have a LOW inventory status.
  const lowStock =
    items.filter(food => food.status === "LOW");


  // Find food items that are approaching expiration.
  const expiringSoon =
    items.filter(food => food.status === "EXPIRING");


  // Find food items that have already expired.
  const expired =
    items.filter(food => food.status === "EXPIRED");


  // ----------------------------------------
  // 5. CALCULATE REMAINING CALORIES
  // ----------------------------------------

  // Calculate how many calories the user has remaining
  // based on the daily calorie target.
  //
  // Number(nutrition.calories) converts the calorie value
  // into a number.
  //
  // The || 0 fallback prevents an undefined or invalid
  // calorie value from causing an invalid calculation.
  //
  // Math.max(0, ...) prevents remaining calories
  // from becoming negative if the user exceeds the target.
  const caloriesRemaining =
    Math.max(0, CALORIE_TARGET - (Number(nutrition.calories) || 0));


  // ----------------------------------------
  // 6. RETURN DASHBOARD DATA
  // ----------------------------------------

  // Return one combined dashboard object.
  //
  // The dashboard controller receives this object
  // and sends it to the frontend as a JSON response.
  //
  // inventory:
  // Contains all retrieved food items and their statuses.
  //
  // alerts:
  // Contains separate lists of low-stock, expiring,
  // and expired food items.
  //
  // nutrition:
  // Contains today's nutrition totals, the daily
  // calorie target, and the remaining calories.
  return {

    // Inventory information with calculated statuses.
    inventory: items,

    // Inventory alerts grouped by status.
    alerts: {
      lowStock,
      expiringSoon,
      expired
    },

    // Nutrition totals and daily calorie information.
    nutrition: {
      ...nutrition,
      calorieTarget: CALORIE_TARGET,
      caloriesRemaining
    }

  };

}


// ==========================================
//                EXPORT SERVICE
// ==========================================

// Export getDashboard so dashboardController.js
// can import and use it to retrieve dashboard information.
module.exports = {
  getDashboard
};
