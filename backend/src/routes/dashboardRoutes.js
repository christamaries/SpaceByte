
// dashboardRoutes.js
// This file defines the API route for retrieving the SpaceByte dashboard.

// Import Express to create and manage API routes.
const express = require("express");

// Create an Express router to organize dashboard-related routes.
const router = express.Router();

// Import authentication middleware.
// This verifies the Firebase authentication token before
// allowing a user to access the dashboard.
const verifyToken =
  require("../middleware/authMiddleware");

// Import the dashboard controller.
// The controller retrieves the information needed to display
// the user's dashboard, such as inventory and nutrition data.
const dashboardController =
  require("../controllers/dashboardController");

// ==========================================
//             GET DASHBOARD
// ==========================================

// GET /dashboard
//
// Retrieves the dashboard information for the authenticated user.
//
// The verifyToken middleware runs first to confirm that the user
// is logged in. If authentication succeeds, getDashboard handles
// the request and sends the dashboard data back to the frontend.
router.get(
  "/",
  verifyToken,
  dashboardController.getDashboard
);

// Export the router so app.js can register the dashboard endpoint.
module.exports = router;
