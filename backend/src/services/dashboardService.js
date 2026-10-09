// dashboardService.js
// just created


// Import existing services.
const {
  getInventory,
  getFoodStatus
} = require("./inventoryService");

const {
  getTodayNutrition
} = require("./nutritionService");


// Daily calorie target.
// Matches the target used in
// nutritionController.js for now.
const CALORIE_TARGET = 2800;


// ==========================================
//            BUILD DASHBOARD
// ==========================================

async function getDashboard(userId) {

  // Get all food in the inventory.
  const inventory = await getInventory();

  // Get the user's nutrition for today.
  const nutrition = await getTodayNutrition(userId);

  // Add a status to each food item
  // (OK, LOW, EXPIRING, or EXPIRED).
  const items = inventory.map(food => ({
    ...food,
    status: getFoodStatus(food)
  }));

  // Sort items into alert groups.
  const lowStock =
    items.filter(food => food.status === "LOW");

  const expiringSoon =
    items.filter(food => food.status === "EXPIRING");

  const expired =
    items.filter(food => food.status === "EXPIRED");

  // Calories still needed today.
  const caloriesRemaining =
    Math.max(0, CALORIE_TARGET - nutrition.calories);

  // Return everything the dashboard needs.
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


// Export the service.
module.exports = {
  getDashboard
};