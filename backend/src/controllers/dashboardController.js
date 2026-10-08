// dashboardController.js
// just created
// Import dashboard service.
const {
  getDashboard
} = require("../services/dashboardService");


// ==========================================
// GET DASHBOARD
// ==========================================

// GET /dashboard
//
// Returns inventory, alerts, and today's
// nutrition for the authenticated user.
exports.getDashboard = async (req, res) => {

  try {

    // Get authenticated user ID.
    const userId = req.user.uid;

    // Build the dashboard data.
    const dashboard =
      await getDashboard(userId);

    // Send it to the frontend.
    res.status(200).json(dashboard);

  } catch (error) {

    console.error(
      "Error loading dashboard:",
      error
    );

    res.status(500).json({
      error: "Unable to load dashboard"
    });

  }

};