// inventoryRoutes.js

// Import Express.
const express = require("express");

// Create an Express router.
const router = express.Router();

// Import the inventory controller.
const inventoryController =
  require("../controllers/inventoryController");

// Import authentication middleware.
const verifyToken =
  require("../middleware/authMiddleware");


/*
 * Get all inventory items.
 *
 * GET /inventory
 *
 * The user must be logged in.
 */
router.get(
  "/",
  verifyToken,
  inventoryController.getAllFood
);


// Export the router.
module.exports = router;