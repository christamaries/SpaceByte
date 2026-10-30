
// nutritionRoutes.js

// Import Express to create and manage API routes.
const express = require("express");

// Create an Express router to organize nutrition-related endpoints.
const router = express.Router();

// Import the nutrition controller.
// This controller handles requests for nutrition information.
const nutritionController =
  require("../controllers/nutritionController");

// Import authentication middleware.
// This verifies the user's Firebase authentication token
// before allowing access to nutrition endpoints.
const verifyToken =
  require("../middleware/authMiddleware");


// ==========================================
//        GET TODAY'S NUTRITION
// ==========================================

// HTTP METHOD: GET
// ROUTE: /nutrition/today
//
// PURPOSE:
// Retrieve the authenticated user's nutrition totals
// for the current day.
//
// The response may include:
// - Calories consumed
// - Protein
// - Carbohydrates
// - Fat
// - Daily calorie target
// - Percentage of the calorie target reached
//
// verifyToken ensures the user is logged in.
// getTodayNutrition retrieves and returns the nutrition data.
router.get(
  "/today",
  verifyToken,
  nutritionController.getTodayNutrition
);


// ==========================================
// GET NUTRITION FOR A SPECIFIC FOOD ITEM
// ==========================================

// HTTP METHOD: GET
// ROUTE: /nutrition/:foodId
//
// PURPOSE:
// Retrieve nutrition information for one food item.
//
// :foodId is a route parameter containing the
// Firestore document ID of the food item.
//
// Example:
// GET /nutrition/food1
//
// The user must be authenticated before requesting
// nutrition information for a specific food item.
//
// getNutrition handles the request and returns
// the food item's nutrition information.
router.get(
  "/:foodId",
  verifyToken,
  nutritionController.getNutrition
);


// ==========================================
//              EXPORT ROUTER
// ==========================================

// Export the router so app.js can register
// these nutrition endpoints with the backend server.
module.exports = router;
