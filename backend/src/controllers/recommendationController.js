// recommendationController.js

// Import recommendation service.
const {
  getRecommendations
} = require("../services/recommendationService");


// ==========================================
//          GET RECOMMENDATIONS
// ==========================================

// GET /recommendations
exports.getRecommendations = async (req, res) => {

  try {

    // Get authenticated user.
    const userId = req.user.uid;


    // Generate recommendations.
    const recommendations =
      await getRecommendations(userId);


    // Return recommendations.
    res.status(200).json({

      count:
        recommendations.length,

      recommendations

    });

  } catch (error) {

    console.error(
      "Error getting recommendations:",
      error
    );

    res.status(500).json({
      error:
        "Unable to generate recommendations"
    });

  }

};