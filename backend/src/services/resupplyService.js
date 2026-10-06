// resupplyService.js

// Import Firestore.
const { db } = require("../config/firebase");


// ==========================================
// CALCULATE RESUPPLY FORECAST
// ==========================================

async function calculateResupplyForecast(
  daysRemaining = 30
) {

  // Get inventory.
  const inventorySnapshot =
    await db
      .collection("inventory")
      .get();

  // Get consumption history.
  const consumptionSnapshot =
    await db
      .collection("consumptionLogs")
      .get();


  // Store total consumption for
  // each food item.
  const consumptionTotals = {};


  // Calculate historical consumption.
  consumptionSnapshot.docs.forEach(doc => {

    const log = doc.data();

    const foodId = log.foodId;

    const amount =
      Number(log.amount) || 0;


    if (!consumptionTotals[foodId]) {

      consumptionTotals[foodId] = 0;

    }


    consumptionTotals[foodId] += amount;

  });


  // Calculate forecast for every food.
  const forecast =
    inventorySnapshot.docs.map(doc => {

      const food = doc.data();

      const foodId = doc.id;


      // Get total historical consumption.
      const totalConsumed =
        consumptionTotals[foodId] || 0;


      // For this simple Sprint 1 model,
      // assume the historical records
      // represent approximately 30 days.
      const averageDailyUse =
        totalConsumed / 30;


      // Calculate expected consumption.
      const expectedUse =
        averageDailyUse * daysRemaining;


      // Current inventory.
      const currentQuantity =
        Number(food.quantity) || 0;


      // Calculate how much will be needed.
      const recommendedAmount =
        Math.max(
          0,
          Math.ceil(
            expectedUse -
            currentQuantity
          )
        );


      return {

        foodId,

        foodName: food.name,

        currentQuantity,

        averageDailyUse:
          Number(
            averageDailyUse.toFixed(2)
          ),

        daysRemaining,

        estimatedFutureUse:
          Number(
            expectedUse.toFixed(2)
          ),

        recommendedResupply:
          recommendedAmount

      };

    });


  return forecast;

}


// Export function.
module.exports = {
  calculateResupplyForecast
};