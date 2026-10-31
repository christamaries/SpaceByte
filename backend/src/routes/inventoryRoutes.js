
// inventoryRoutes.js

// Import Express to create and manage API routes.
const express = require("express");

// Create an Express router to organize inventory-related endpoints.
const router = express.Router();

// Import the inventory controller.
// The controller contains the functions for retrieving,
// adding, and checking inventory items.
const inventoryController =
  require("../controllers/inventoryController");

// Import authentication middleware.
// This verifies the user's Firebase authentication token
// before allowing access to protected inventory routes.
const verifyToken =
  require("../middleware/authMiddleware");


// ==========================================
// GET ALL INVENTORY ITEMS
// ==========================================

// GET /inventory
//
// Retrieves all inventory items.
// The user must be logged in before accessing this endpoint.
//
// verifyToken checks the user's authentication token.
// getAllFood handles the request and returns the inventory data.
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
// Retrieves inventory items that are approaching their expiration date.
//
// Example:
// /inventory/expiring?days=7
//
// The days query parameter specifies how many days ahead
// the backend should check for expiring food.
//
// Note: This route currently does not use verifyToken.
router.get(
  "/expiring",
  inventoryController.getExpiringFood
);


// ==========================================
// ADD FOOD ITEM
// ==========================================

// POST /inventory
//
// Adds a new food item to the inventory.
// The user must be logged in before adding an item.
//
// verifyToken checks authentication.
// addFood processes the submitted food information
// and saves the new item.
router.post(
  "/",
  verifyToken,
  inventoryController.addFood
);


// DELETE /inventory/:id
//
// Permanently removes one food item.
// :id is the item's Firestore document ID.
router.delete(
  "/:id",
  verifyToken,
  inventoryController.deleteFood
);


// Export the router so app.js can register the inventory endpoints.
module.exports = router;
