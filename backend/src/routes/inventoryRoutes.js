// inventoryRoutes.js

// Import Express
// Express is used to create and manage API routes
const express = require("express");

// Create an Express router
const router = express.Router();

// Import the inventory controller
// The controller contains the code that handles inventory requests
const inventoryController =
  require("../controllers/inventoryController");

// Create a GET route
// GET /inventory
//
// This route calls getAllFood()
// to retrieve all food items from Firestore
router.get("/", inventoryController.getAllFood);

// Export the router
module.exports = router;