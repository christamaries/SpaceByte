
/*
===========================================================
 DASHBOARD SERVICE
 
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


// Import inventory functions.
//
// getInventory:
// Retrieves food inventory records.
//
// getFoodStatus:
// Determines whether an inventory item is OK, LOW,
// EXPIRING, or EXPIRED based on its stored information.
const {
  getInventory,
  getFoodStatus
} = require("./inventoryService");


// Import the nutrition service.
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

// Daily calorie target used by the dashboard.
// Keep this value consistent with nutritionController.js
// so the dashboard and nutrition page show the same target.
const CALORIE_TARGET = 2800;


// ==========================================
//             BUILD DASHBOARD
// ==========================================

// Gather the information required by the Crew Dashboard.
//
// Parameter:
// userId - the Firebase UID of the authenticated user.
//
// Returns:
// An object containing inventory, alerts, and nutrition.
async function getDashboard(userId) {

  // ----------------------------------------
  // 1. Retrieve inventory
  // ----------------------------------------

  // Request the inventory records from inventoryService.
  //
  // IMPORTANT:
  // This currently calls getInventory() without userId.
  // If inventory is private to each user, update the service
  // and this call so the correct user's records are returned.
  const inventory = await getInventory();


  // ----------------------------------------
  // 2. Retrieve today's nutrition
  // ----------------------------------------

  // Get nutrition totals for the authenticated user.
  // The nutrition service is responsible for calculating
  // the user's food consumption for the current day.
  const nutrition = await getTodayNutrition(userId);


  // ----------------------------------------
  // 3. Calculate inventory statuses
  // ----------------------------------------

  // Create a new array containing the original food fields
  // plus a calculated status for each food item.
  //
  // The spread operator preserves existing item properties.
  // getFoodStatus(food) calculates the item's current status.
  const items = inventory.map(food => ({
    ...food,
    status: getFoodStatus(food)
  }));


  // ----------------------------------------
  // 4. Group inventory alerts
  // ----------------------------------------

  // Find food items that are running low.
  const lowStock =
    items.filter(food => food.status === "LOW");


  // Find food items that are approaching expiration.
  const expiringSoon =
    items.filter(food => food.status === "EXPIRING");


  // Find food items that have already expired.
  const expired =
    items.filter(food => food.status === "EXPIRED");


  // ----------------------------------------
  // 5. Calculate remaining calories
  // ----------------------------------------

  // Subtract today's consumed calories from the daily target.
  //
  // Math.max(0, ...) prevents the remaining-calorie value
  // from becoming negative if the user exceeds the target.
  //
  // The fallback prevents an undefined calories value from
  // producing NaN. Confirm that nutrition.calories is
  // normally returned as a number by nutritionService.
  const caloriesRemaining =
    Math.max(0, CALORIE_TARGET - (Number(nutrition.calories) || 0));


  // ----------------------------------------
  // 6. Return dashboard data
  // ----------------------------------------

  // Return a single object that the controller can send
  // to the frontend as a JSON response.
  //
  // inventory:
  // All retrieved food items with their calculated statuses.
  //
  // alerts:
  // Separate lists for low-stock, expiring, and expired food.
  //
  // nutrition:
  // Today's nutrition totals, the calorie target, and
  // the number of calories remaining.
  return {

    inventory: items,

    alerts: {
      lowStock,
      expiringSoon,
      expired
    },

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

// Export getDashboard so dashboardController.js can call it.
module.exports = {
  getDashboard
};
