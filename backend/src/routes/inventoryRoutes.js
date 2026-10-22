// inventoryRoutes.js

// Import Express.
const express = require("express");

// Create router.
const router = express.Router();

// Import inventory controller.
const inventoryController =
  require("../controllers/inventoryController");

// Import authentication middleware.
const verifyToken =
  require("../middleware/authMiddleware");


// ==========================================
// GET ALL INVENTORY
// ==========================================

// GET /inventory
router.get(
  "/",
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


// Export router.
module.exports = router;