//consumptionRoute.js

// Import Express
// Express is used to create and manage API routes
const express = require("express");

// Create a new Express router
const router = express.Router();

// Import the consumption controller
// The controller contains the code that handles
// food consumption requests
const consumptionController =
  require("../controllers/consumptionController");

// Import authentication middleware
// This verifies that the user is logged into Firebase
const verifyToken =
  require("../middleware/authMiddleware");

// Create a POST route
// POST /consumption
//
// The verifyToken middleware runs first.
// If authentication is successful,
// logConsumption() handles the request.
router.post(
  "/",
  verifyToken,
  consumptionController.logConsumption
);

// Export the router
// so it can be connected to the main Express application
module.exports = router;