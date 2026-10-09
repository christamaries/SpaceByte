// nutritionController.js

// Import nutrition service.
const {
  getTodayNutrition
} = require("../services/nutritionService");


// ==========================================
//        GET TODAY'S NUTRITION
// ==========================================

// GET /nutrition/today
// The authenticated user's ID is used
// to find their consumption records.
exports.getTodayNutrition = async (req, res) => {

  try {

    // Get authenticated user ID.
    const userId = req.user.uid;

    // Calculate today's nutrition.
    const nutrition =
      await getTodayNutrition(userId);

    // Optional daily target.
    // a 2,800 calorie target.
    const calorieTarget = 2800;

    // Calculate percentage of calorie goal.
    const caloriePercentage =
      Math.min(
        100,
        Math.round(
          (nutrition.calories /
            calorieTarget) * 100
        )
      );

    // Return nutrition information.
    res.status(200).json({

      userId,

      calories: nutrition.calories,

      protein: nutrition.protein,

      carbs: nutrition.carbs,

      fat: nutrition.fat,

      calorieTarget,

      caloriePercentage

    });

  } catch (error) {

    console.error(
      "Error calculating nutrition:",
      error
    );

    res.status(500).json({
      error: "Unable to calculate nutrition"
    });

  }

};