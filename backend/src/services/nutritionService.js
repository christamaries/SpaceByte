// nutritionService.js

// Import Firestore.
const { db } = require("../config/firebase");


// ==========================================
// GET TODAY'S NUTRITION
// ==========================================

async function getTodayNutrition(userId) {

  // Get all consumption records.
  const snapshot =
    await db
      .collection("consumptionLogs")
      .where("userId", "==", userId)
      .get();

  // Store the totals.
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;


  // Process each consumption record.
  for (const doc of snapshot.docs) {

    const log = doc.data();

    // Get the food item associated
    // with this consumption record.
    const foodDoc =
      await db
        .collection("inventory")
        .doc(log.foodId)
        .get();

    // Skip the record if the food
    // no longer exists.
    if (!foodDoc.exists) {
      continue;
    }

    const food = foodDoc.data();

    // Amount represents the number
    // of servings/items consumed.
    const amount =
      Number(log.amount) || 0;

    // Add nutritional information.
    calories +=
      (Number(food.calories) || 0) * amount;

    protein +=
      (Number(food.protein) || 0) * amount;

    carbs +=
      (Number(food.carbs) || 0) * amount;

    fat +=
      (Number(food.fat) || 0) * amount;

  }


  // Return the calculated totals.
  return {

    calories: Number(calories.toFixed(2)),

    protein: Number(protein.toFixed(2)),

    carbs: Number(carbs.toFixed(2)),

    fat: Number(fat.toFixed(2))

  };

}


// Export the service.
module.exports = {
  getTodayNutrition
};