// recommendationRoutes.js

// Import Express.
const express = require("express");

// Create router.
const router = express.Router();

// Import authentication middleware.
const verifyToken =
  require("../middleware/authMiddleware");

// Import recommendation controller.
const recommendationController =
  require("../controllers/recommendationController");


// ==========================================
//        GET RECOMMENDATIONS
// ==========================================

// GET /recommendations
router.get(
  "/",
  verifyToken,
  recommendationController.getRecommendations
);


// Export router.
module.exports = router;