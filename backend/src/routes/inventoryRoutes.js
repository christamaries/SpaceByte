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



// Get all inventory items.
// The user must be logged in.
router.get(
  "/",
  verifyToken,
  inventoryController.getAllFood
);


// ==========================================
// GET EXPIRING FOOD
// ==========================================

// GET /inventory/expiring
//
// Example:
// /inventory/expiring?days=7
router.get(
  "/expiring",
  inventoryController.getExpiringFood
);


// ==========================================
// ADD FOOD ITEM
// ==========================================

// POST /inventory
// Requires a logged-in user.
router.post(
  "/",
  verifyToken,
  inventoryController.addFood
);


// Export the router.
module.exports = router;
