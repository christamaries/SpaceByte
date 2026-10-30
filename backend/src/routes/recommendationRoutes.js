
// recommendationRoutes.js

// Import Express to create and manage API routes.
const express = require("express");

// Create an Express router to organize recommendation endpoints.
const router = express.Router();

// Import authentication middleware.
// This verifies the user's Firebase authentication token
// before allowing access to the recommendations endpoint.
const verifyToken =
  require("../middleware/authMiddleware");

// Import the recommendation controller.
// This controller retrieves food recommendations
// for the authenticated user.
const recommendationController =
  require("../controllers/recommendationController");


// ==========================================
//        GET RECOMMENDATIONS
// ==========================================

// HTTP METHOD: GET
// ROUTE: /recommendations
//
// PURPOSE:
// Retrieve food recommendations for the authenticated user.
//
// verifyToken runs first to confirm that the user is logged in.
//
// getRecommendations then processes the request and returns
// the recommended food items based on the recommendation service.
router.get(
  "/",
  verifyToken,
  recommendationController.getRecommendations
);


// ==========================================
//              EXPORT ROUTER
// ==========================================

// Export the router so app.js can register
// the recommendation endpoint with the backend server.
module.exports = router;
