// mealPlanRoutes.js

// Import Express.
const express = require("express");

// Create router.
const router = express.Router();

// Authentication middleware.
const verifyToken =
  require("../middleware/authMiddleware");

// Meal plan controller.
const mealPlanController =
  require("../controllers/mealPlanController");


// ==========================================
//          GET MEAL PLAN
// ==========================================

// Get meal-plan
router.get(
  "/",
  verifyToken,
  mealPlanController.getMealPlan
);


// ==========================================
//            CREATE MEAL
// ==========================================

// Create meal-plan
router.post("/", verifyToken, mealPlanController.createMeal);

// ============================
//           MEAL EATEN
// =============================

router.post("/:id/eaten", verifyToken, mealPlanController.markMealEaten);

// ===========================================================
//  REPLACE FOOD IN AN EXISTING PLANNED MEAL
// ===========================================================

router.patch("/:id/swap", verifyToken, mealPlanController.swapMeal);


// ==========================================
//              DELETE MEAL
// ==========================================

// DELETE meal-plan
router.delete(
  "/:id",
  verifyToken,
  mealPlanController.deleteMeal
);


// Export router.
module.exports = router;