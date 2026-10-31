/*
===========================================================
 SPACEBYTE - USER ROUTES
 File: backend/src/routes/userRoutes.js

 PURPOSE:
 Define API endpoints for user profiles and dietary restrictions.

 FEATURES:
 1. Create a user profile.
 2. Retrieve a user profile.
 3. Log out a user.
 4. Retrieve dietary restrictions.
 5. Add dietary restrictions.
 6. Delete dietary restrictions.

 SECURITY:
 All routes require Firebase authentication.
===========================================================
*/


// ==========================================
//              IMPORT EXPRESS
// ==========================================

// Import Express to create and manage API routes.
const express = require("express");

// Create an Express router to organize user-related endpoints.
const router = express.Router();


// ==========================================
//          IMPORT CONTROLLER
// ==========================================

// Import the user controller.
// The controller contains the functions that handle
// profile management and dietary restriction requests.
const userController = require("../controllers/userController");


// ==========================================
//       IMPORT AUTHENTICATION MIDDLEWARE
// ==========================================

// Import middleware that verifies the user's Firebase ID token.
//
// This middleware checks whether the user is authenticated
// and attaches the authenticated user's information to req.user.
//
// If authentication fails, the request is rejected.
const verifyToken = require("../middleware/authMiddleware");


// ==========================================
//           USER PROFILE ROUTES
// ==========================================

// POST /users/profile
//
// PURPOSE:
// Create or save the authenticated user's profile.
//
// verifyToken confirms the user's identity.
// createProfile handles saving the profile information
// in the Firestore database.
router.post(
  "/profile",
  verifyToken,
  userController.createProfile
);


// GET /users/profile
//
// PURPOSE:
// Retrieve the profile information for the signed-in user.
//
// verifyToken identifies the authenticated user.
// getProfile retrieves the user's information from Firestore.
router.get(
  "/profile",
  verifyToken,
  userController.getProfile
);


// POST /users/logout
//
// PURPOSE:
// Log out the authenticated user.
//
// verifyToken confirms the user's identity.
// logoutUser handles the logout request.
router.post(
  "/logout",
  verifyToken,
  userController.logoutUser
);


// ==========================================
//       DIETARY RESTRICTION ROUTES
// ==========================================

// GET /users/dietary-restrictions
//
// PURPOSE:
// Retrieve all dietary restrictions belonging
// to the currently signed-in user.
//
// Examples of restrictions may include:
// - Food allergies
// - Food intolerances
// - Medical dietary restrictions
// - Vegetarian or vegan preferences
//
// The controller retrieves the user's restrictions from Firestore.
router.get(
  "/dietary-restrictions",
  verifyToken,
  userController.getDietaryRestrictions
);


// POST /users/dietary-restrictions
//
// PURPOSE:
// Add a new dietary restriction to the user's account.
//
// The frontend sends the restriction information.
// The controller validates the information and saves
// the new restriction under the authenticated user's profile.
router.post(
  "/dietary-restrictions",
  verifyToken,
  userController.addDietaryRestriction
);


// DELETE /users/dietary-restrictions/:id
//
// PURPOSE:
// Delete a dietary restriction belonging to the signed-in user.
//
// :id represents the Firestore document ID of the restriction.
//
// Example:
// DELETE /users/dietary-restrictions/abc123
//
// The controller verifies that the restriction belongs
// to the authenticated user before deleting it.
router.delete(
  "/dietary-restrictions/:id",
  verifyToken,
  userController.deleteDietaryRestriction
);


// ==========================================
//              EXPORT ROUTER
// ==========================================

// Export the router so app.js can register
// the user endpoints with the backend server.
module.exports = router;
