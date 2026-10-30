// resupplyRoutes.js

// Import Express to create and manage API routes.
const express = require("express");

// Create an Express router to organize resupply-related endpoints.
const router = express.Router();

// Import authentication middleware.
// This verifies the user's Firebase authentication token
// before allowing access to the resupply forecast.
const verifyToken =
  require("../middleware/authMiddleware");

// Import the resupply controller.
// This controller handles requests for predicting
// which inventory items need to be replenished.
const resupplyController =
  require("../controllers/resupplyController");


// ==========================================
//            RESUPPLY FORECAST
// ==========================================

// HTTP METHOD: GET
// ROUTE: /resupply/forecast
//
// PURPOSE:
// Generate a forecast showing which food items
// may need to be replenished based on inventory usage.
//
// The user must be authenticated before accessing
// the resupply forecast.
//
// The optional "days" query parameter determines
// how many days ahead the forecast should cover.
//
// Example:
// GET /resupply/forecast?days=30
//
// verifyToken checks the user's authentication token.
// getResupplyForecast processes the request and returns
// the items that need to be replenished.
router.get(
  "/forecast",
  verifyToken,
  resupplyController.getResupplyForecast
);


// ==========================================
//              EXPORT ROUTER
// ==========================================

// Export the router so app.js can register
// the resupply forecast endpoint with the backend server.
module.exports = router;
