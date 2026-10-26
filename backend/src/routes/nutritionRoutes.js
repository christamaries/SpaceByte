// nutritionRoutes.js

// Import Express to create routes.
const express = require("express");

// Create one Express router for nutrition endpoints.
const router = express.Router();

// Import the nutrition controller only once.
const nutritionController =
  require("../controllers/nutritionController");

// Import middleware to verify the user's authentication token.
const verifyToken =
  require("../middleware/authMiddleware");

// ==========================================
//        GET TODAY'S NUTRITION
// ==========================================

// GET /nutrition/today
// Requires a logged-in user.
router.get(
  "/today",
  verifyToken,
  nutritionController.getTodayNutrition
);

// ==========================================
// GET NUTRITION FOR A SPECIFIC FOOD ITEM
// ==========================================

// GET /nutrition/:foodId
// Example: GET /nutrition/food1
// Requires a logged-in user.
router.get(
  "/:foodId",
  verifyToken,
  nutritionController.getNutrition
);

// Export the router so app.js can use it.
module.exports = router;