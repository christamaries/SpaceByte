//consumptionRoute.js

// Import Express.
const express = require("express");

// Create an Express router.
const router = express.Router();

// Import the consumption controller.
const consumptionController =
  require("../controllers/consumptionController");

// Import authentication middleware.
const verifyToken =
  require("../middleware/authMiddleware");


/*
 * Record food consumption.
 *
 * POST /consumption
 *
 * Only authenticated users can record
 * food consumption.
 */
router.post(
  "/",
  verifyToken,
  consumptionController.logConsumption
);


// Export the router.
module.exports = router;