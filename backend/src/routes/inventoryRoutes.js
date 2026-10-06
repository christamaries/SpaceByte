// inventoryRoutes.js

// Import Express.
const express = require("express");

// Create router.
const router = express.Router();

// Import inventory controller.
const inventoryController =
  require("../controllers/inventoryController");


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


// Export router.
module.exports = router;