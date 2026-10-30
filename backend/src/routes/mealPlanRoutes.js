

/*
===========================================================
 SPACEBYTE - MEAL PLAN ROUTES
 File: backend/src/routes/mealPlanRoutes.js

 PURPOSE:
 1. Define API endpoints for meal planning.
 2. Connect each endpoint to its controller function.
 3. Protect meal plan operations using Firebase authentication.
 4. Ensure users are authenticated before accessing meal data.

 ROUTES:
 GET    /meal-plan           - Retrieve planned meals.
 POST   /meal-plan           - Create a planned meal.
 POST   /meal-plan/:id/eaten - Mark a meal as eaten.
 PATCH  /meal-plan/:id/swap  - Replace food in a planned meal.
 DELETE /meal-plan/:id       - Delete a planned meal.

===========================================================
*/


// ==========================================
//              IMPORT EXPRESS
// ==========================================

// Import Express to create and manage API routes.
const express = require("express");


// ==========================================
//              CREATE ROUTER
// ==========================================

// Create an Express router.
//
// This router groups all meal plan endpoints together.
// It will be registered in app.js using app.use().
const router = express.Router();


// ==========================================
//        IMPORT AUTHENTICATION MIDDLEWARE
// ==========================================

// Import middleware that verifies the Firebase
// authentication token sent by the frontend.
//
// The middleware:
// 1. Reads the user's Firebase ID token.
// 2. Verifies that the token is valid.
// 3. Attaches the authenticated user's information
//    to req.user.
//
// If authentication fails, the request is rejected.
const verifyToken =
  require("../middleware/authMiddleware");


// ==========================================
//           IMPORT MEAL PLAN CONTROLLER
// ==========================================

// Import the controller containing the functions
// that handle meal plan requests.
//
// The controller communicates with Firestore
// and returns the appropriate HTTP responses.
const mealPlanController =
  require("../controllers/mealPlanController");


// ==========================================
//             GET ALL PLANNED MEALS
// ==========================================

// HTTP METHOD: GET
// ROUTE: /meal-plan
//
// PURPOSE:
// Retrieve planned meals belonging to the
// currently authenticated user.
//
// verifyToken runs before getMealPlan.
// This ensures that only authenticated users
// can retrieve their meal plans.
router.get(
  "/",
  verifyToken,
  mealPlanController.getMealPlan
);


// ==========================================
//              CREATE A PLANNED MEAL
// ==========================================

// HTTP METHOD: POST
// ROUTE: /meal-plan
//
// PURPOSE:
// Create and save a new planned meal.
//
// The frontend sends information such as:
// - date
// - mealType
// - foodId
// - servings
//
// The controller validates the information,
// retrieves the food from inventory, calculates
// nutrition, and saves the meal in Firestore.
router.post(
  "/",
  verifyToken,
  mealPlanController.createMeal
);


// ==========================================
//             MARK MEAL AS EATEN
// ==========================================

// HTTP METHOD: POST
// ROUTE: /meal-plan/:id/eaten
//
// PURPOSE:
// Mark an existing planned meal as eaten.
//
// :id is a route parameter containing the
// Firestore document ID of the planned meal.
//
// Example:
// POST /meal-plan/abc123/eaten
//
// The controller updates the meal and creates
// a consumption log for nutrition tracking.
router.post(
  "/:id/eaten",
  verifyToken,
  mealPlanController.markMealEaten
);


// ==========================================
//        REPLACE FOOD IN A PLANNED MEAL
// ==========================================

// HTTP METHOD: PATCH
// ROUTE: /meal-plan/:id/swap
//
// PURPOSE:
// Replace the food item in an existing planned meal.
//
// The frontend sends the replacement foodId.
//
// Example:
// PATCH /meal-plan/abc123/swap
//
// The controller checks meal ownership, verifies
// the replacement food, recalculates nutrition,
// and updates the existing meal document.
router.patch(
  "/:id/swap",
  verifyToken,
  mealPlanController.swapMeal
);


// ==========================================
//              DELETE A PLANNED MEAL
// ==========================================

// HTTP METHOD: DELETE
// ROUTE: /meal-plan/:id
//
// PURPOSE:
// Delete an existing planned meal.
//
// :id identifies the Firestore meal document.
//
// The controller verifies that the meal belongs
// to the authenticated user before deleting it.
router.delete(
  "/:id",
  verifyToken,
  mealPlanController.deleteMeal
);


// ==========================================
//              EXPORT ROUTER
// ==========================================

// Export the router so app.js can register
// these meal plan endpoints with the backend server.
module.exports = router;
