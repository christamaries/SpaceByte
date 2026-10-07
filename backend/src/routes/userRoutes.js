// userRoutes.js

// Import Express.
const express = require("express");

// Create an Express router.
const router = express.Router();

// Import the user controller.
const userController = require("../controllers/userController");

// Import authentication middleware.
const verifyToken = require("../middleware/authMiddleware");


/*
 * Create a user profile.
 *
 * POST /users/profile
 *
 * The user must already be authenticated.
 */
router.post(
  "/profile",
  verifyToken,
  userController.createProfile
);


/*
 * Get the user's profile.
 *
 * GET /users/profile
 *
 * This route is protected.
 */
router.get(
  "/profile",
  verifyToken,
  userController.getProfile
);


/*
 * Logout the user.
 *
 * POST /users/logout
 *
 * This route is protected because we need
 * to know which user is logging out.
 */
router.post(
  "/logout",
  verifyToken,
  userController.logoutUser
);


// Export the router.
module.exports = router;