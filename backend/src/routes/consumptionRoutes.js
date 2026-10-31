// consumptionRoute.js

// Import Express so we can create and manage API routes.
const express = require("express");

// Create an Express router to define consumption-related endpoints.
const router = express.Router();

// Import the consumption controller.
// The controller contains the function that records food consumption.
const consumptionController =
  require("../controllers/consumptionController");

// Import authentication middleware.
// This middleware verifies the user's Firebase authentication token
// before allowing access to protected routes.
const verifyToken =
  require("../middleware/authMiddleware");

// Record food consumption.
// POST "/" allows an authenticated user to submit a food consumption
// request. The verifyToken middleware runs first to confirm the user's
// identity. If authentication succeeds, logConsumption handles the
// request and records the consumption information.
router.post(
  "/",
  verifyToken,
  consumptionController.logConsumption
);

// Export the router so app.js can register these consumption routes.
module.exports = router;
