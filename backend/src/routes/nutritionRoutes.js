// nutritionRoutes.js

// Import Express.
const express = require("express");


// Create an Express router.
const nrouter = express.Router();

// Import the nutrition controller.
const nutritionController = require("../controllers/nutritionController");

// Import authentication middleware.
const verifyToken = require("../middleware/authMiddleware");

// Get nutrition information for a specific food item.
// Example: GET /nutrition/food1
router.get("/:foodId", verifyToken, nutritionController.getNutrition);

// Export the router.
// Create router.
const router = express.Router();

// Import authentication middleware.
const verifyToken =
  require("../middleware/authMiddleware");

// Import nutrition controller.
const nutritionController =
  require("../controllers/nutritionController");


// ==========================================
//           GET TODAY'S NUTRITION
// ==========================================

// GET /nutrition/today
// Requires a logged-in user.
router.get(
  "/today",
  verifyToken,
  nutritionController.getTodayNutrition
);


// Export router.
module.exports = router;