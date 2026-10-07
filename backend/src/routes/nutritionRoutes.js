// In nutritionService.js, the code grabs all of the user's consumption logs, with no date filter. It will add up everything they've ever eaten, not just today's food. It needs a filter on the log's date.
// nutritionRoutes.js

// Import Express.
const express = require("express");

// Create router.
const router = express.Router();

// Import authentication middleware.
const verifyToken =
  require("../middleware/authMiddleware");

// Import nutrition controller.
const nutritionController =
  require("../controllers/nutritionController");


// ==========================================
// GET TODAY'S NUTRITION
// ==========================================

// GET /nutrition/today
//
// Requires a logged-in user.
router.get(
  "/today",
  verifyToken,
  nutritionController.getTodayNutrition
);


// Export router.
module.exports = router;