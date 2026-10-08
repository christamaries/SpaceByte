// resupplyRoutes.js

// Import Express.
const express = require("express");

// Create router.
const router = express.Router();

// Import authentication middleware.
const verifyToken =
  require("../middleware/authMiddleware");

// Import resupply controller.
const resupplyController =
  require("../controllers/resupplyController");


// ==========================================
//            RESUPPLY FORECAST
// ==========================================

// GET /resupply/forecast
//
// Example:
// /resupply/forecast?days=30
router.get(
  "/forecast",
  verifyToken,
  resupplyController.getResupplyForecast
);


// Export router.
module.exports = router;