// userRoutes.js

// Import Express
// Express is used to create and manage API routes
const express = require("express");

// Create an Express router
const router = express.Router();

// Import the user controller
const userController =
  require("../controllers/userController");

// Import authentication middleware
const verifyToken =
  require("../middleware/authMiddleware");

// Get the logged-in user's profile
// GET /users/profile
//
// The user must be authenticated
// before accessing their profile.
router.get(
  "/profile",
  verifyToken,
  userController.getProfile
);

// Create or update the logged-in user's profile
// POST /users/profile
//
// The user must be authenticated
// before creating or updating their profile.
router.post(
  "/profile",
  verifyToken,
  userController.createProfile
);

// Export the router
module.exports = router;