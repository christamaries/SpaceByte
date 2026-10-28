// nutritionController.js

// Import the nutrition service functions.
const {
  getTodayNutrition: calculateTodayNutrition,
} = require("../services/nutritionService");

// Import Firestore database connection.
const { db } = require("../config/firebase");

// ==========================================
//  GET NUTRITION FOR A SPECIFIC FOOD ITEM
// ==========================================

// GET /nutrition/:foodId
// Requires a logged-in user.
exports.getNutrition = async (req, res) => {
  try {
    // Get the food ID from the URL.
    const { foodId } = req.params;

    // Find the food item in the Firestore inventory.
    const foodDoc = await db
      .collection("inventory")
      .doc(foodId)
      .get();

    // Return 404 if the food item does not exist.
    if (!foodDoc.exists) {
      return res.status(404).json({
        error: "Food item not found"
      });
    }

    // Return the food item's nutrition information.
    const food = foodDoc.data();

    return res.status(200).json({
      foodId,
      name: food.name,
      calories: food.calories ?? 0,
      protein: food.protein ?? 0,
      carbs: food.carbs ?? 0,
      fat: food.fat ?? 0
    });
  } catch (error) {
    console.error("Error retrieving food nutrition:", error);

    return res.status(500).json({
      error: "Unable to retrieve food nutrition"
    });
  }
};

// ==========================================
//        GET TODAY'S NUTRITION
// ==========================================

// GET /nutrition/today
// Uses the authenticated user's ID.
exports.getTodayNutrition = async (req, res) => {
  try {
    // Get the authenticated user's ID.
    const userId = req.user.uid;

    // Calculate today's nutrition using the service.
    const nutrition = await calculateTodayNutrition(userId);

    // Daily calorie target.
    const calorieTarget = 2800;

    // Calculate the percentage of the calorie target reached.
    const caloriePercentage = Math.min(
      100,
      Math.round(
        (nutrition.calories / calorieTarget) * 100
      )
    );

    // Return today's nutrition summary.
    return res.status(200).json({
      userId,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      calorieTarget,
      caloriePercentage
    });
  } catch (error) {
    console.error("Error calculating nutrition:", error);

    return res.status(500).json({
      error: "Unable to calculate nutrition"
    });
  }
};