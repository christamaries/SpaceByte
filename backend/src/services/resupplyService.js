/*
===========================================================
 SPACEBYTE - RESUPPLY SERVICE
 File: backend/src/services/resupplyService.js

 PURPOSE:
 1. Retrieve food inventory from Firestore.
 2. Read historical food consumption logs.
 3. Estimate average daily consumption for each food item.
 4. Forecast expected consumption over a future period.
 5. Calculate the recommended amount of food to resupply.

 USED BY:
 resupplyController.js

 FIRESTORE COLLECTIONS:
 - inventory
 - consumptionLogs

 SPRINT 1 ASSUMPTION:
 All retrieved consumption records are treated as roughly
 30 days of history.

 IMPORTANT:
 This version does not filter consumption by user or date.
 It also assumes log.amount uses the same quantity unit as
 inventory.quantity. Verify this before relying on forecasts.
===========================================================
*/


// Import the Firestore database connection.
const { db } = require("../config/firebase");


// ==========================================
//      CALCULATE RESUPPLY FORECAST
// ==========================================

/**
 * Calculate how much of each food item may need to be
 * replenished for a future period.
 *
 * @param {number} daysRemaining - Number of days to forecast.
 * Defaults to 30 days when no argument is supplied.
 *
 * Returns:
 * An array of forecast objects, one per inventory item.
 */
async function calculateResupplyForecast(
  daysRemaining = 30
) {

  // ----------------------------------------
  // 1. RETRIEVE INVENTORY
  // ----------------------------------------

  // Read all food items from the inventory collection.
  //
  // Each Firestore inventory document represents a food item
  // and contains information such as its name and quantity.
  const inventorySnapshot =
    await db
      .collection("inventory")
      .get();


  // ----------------------------------------
  // 2. RETRIEVE CONSUMPTION HISTORY
  // ----------------------------------------

  // Read the consumption logs used to estimate food usage.
  //
  // IMPORTANT:
  // This currently retrieves every consumption log without
  // filtering by user or date.
  const consumptionSnapshot =
    await db
      .collection("consumptionLogs")
      .get();


  // ----------------------------------------
  // 3. INITIALIZE CONSUMPTION TOTALS
  // ----------------------------------------

  // Store the total recorded consumption for each food ID.
  //
  // Example:
  // {
  //   "foodDocumentId1": 12,
  //   "foodDocumentId2": 8
  // }
  //
  // These totals are later used to estimate daily usage.
  const consumptionTotals = {};


  // ----------------------------------------
  // 4. CALCULATE HISTORICAL CONSUMPTION
  // ----------------------------------------

  // Process each consumption log retrieved from Firestore.
  consumptionSnapshot.docs.forEach(doc => {

    // Read the fields saved in the consumption log.
    const log = doc.data();


    // Get the ID of the food item associated with this log.
    // It should match the corresponding inventory document ID.
    const foodId = log.foodId;


    // Convert the logged amount to a number.
    // Missing or invalid values default to zero.
    const amount =
      Number(log.amount) || 0;


    // Ignore logs that do not identify a food item.
    //
    // Without a foodId, the consumption cannot be matched
    // to a specific inventory record.
    if (!foodId) {
      return;
    }


    // Initialize the total for this food item if necessary.
    if (!consumptionTotals[foodId]) {

      consumptionTotals[foodId] = 0;

    }


    // Add this log's amount to the food item's total.
    //
    // IMPORTANT:
    // This assumes log.amount represents the same quantity
    // unit used by inventory.quantity.
    //
    // For example, if amount represents servings but
    // inventory.quantity represents packages or grams,
    // a unit conversion will be necessary.
    consumptionTotals[foodId] += amount;

  });


  // ----------------------------------------
  // 5. CALCULATE FORECAST FOR EACH FOOD ITEM
  // ----------------------------------------

  // Generate a forecast for every inventory document.
  const forecast =
    inventorySnapshot.docs.map(doc => {

      // Read the saved food information from Firestore.
      const food = doc.data();


      // Use the Firestore document ID as the food identifier.
      const foodId = doc.id;


      // Get total historical consumption for this food.
      // Use zero if no matching consumption logs exist.
      const totalConsumed =
        consumptionTotals[foodId] || 0;


      // ----------------------------------------
      // ESTIMATE AVERAGE DAILY USAGE
      // ----------------------------------------

      // Sprint 1 assumption:
      // Treat the collected consumption history as roughly
      // 30 days of recorded usage.
      //
      // This is an estimate, not a date-filtered average.
      const averageDailyUse =
        totalConsumed / 30;


      // ----------------------------------------
      // ESTIMATE FUTURE CONSUMPTION
      // ----------------------------------------

      // Project the amount of food expected to be consumed
      // during the requested forecast period.
      const expectedUse =
        averageDailyUse * daysRemaining;


      // ----------------------------------------
      // READ CURRENT INVENTORY QUANTITY
      // ----------------------------------------

      // Convert the current inventory quantity to a number.
      // Use zero if the value is missing or invalid.
      const currentQuantity =
        Number(food.quantity) || 0;


      // ----------------------------------------
      // CALCULATE RECOMMENDED RESUPPLY AMOUNT
      // ----------------------------------------

      // Subtract the current inventory from projected use.
      //
      // Math.ceil rounds up to a whole unit so the forecast
      // does not recommend less than the calculated need.
      //
      // Math.max prevents negative resupply recommendations.
      const recommendedAmount =
        Math.max(
          0,
          Math.ceil(
            expectedUse -
            currentQuantity
          )
        );


      // ----------------------------------------
      // BUILD THE FORECAST RESULT
      // ----------------------------------------

      // Return the information needed by the controller
      // and the frontend resupply page.
      return {

        // Firestore document ID of the food item.
        foodId,


        // Display name of the food.
        foodName: food.name,


        // Current quantity available in inventory.
        currentQuantity,


        // Estimated average daily consumption, rounded
        // to two decimal places.
        averageDailyUse:
          Number(
            averageDailyUse.toFixed(2)
          ),


        // Number of days covered by this forecast.
        daysRemaining,


        // Estimated quantity expected to be consumed.
        estimatedFutureUse:
          Number(
            expectedUse.toFixed(2)
          ),


        // Recommended quantity to replenish.
        recommendedResupply:
          recommendedAmount

      };

    });


  // ----------------------------------------
  // 6. RETURN THE FORECAST
  // ----------------------------------------

  // Return the forecast array to resupplyController.js.
  //
  // The controller filters out items that do not need
  // additional supplies before returning the response.
  return forecast;

}


// ==========================================
//              EXPORT SERVICE
// ==========================================

// Allow the resupply controller to call this function.
module.exports = {
  calculateResupplyForecast
};
