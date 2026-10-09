// dashboardRoutes.js
// just created
// Import Express.
const express = require("express");

// Create router.
const router = express.Router();

// Import authentication middleware.
const verifyToken =
  require("../middleware/authMiddleware");

// Import dashboard controller.
const dashboardController =
  require("../controllers/dashboardController");


// ==========================================
//             GET DASHBOARD
// ==========================================

// GET /dashboard
//
// Requires a logged-in user.
router.get(
  "/",
  verifyToken,
  dashboardController.getDashboard
);


// Export router.
module.exports = router;