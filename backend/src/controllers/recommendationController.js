
/*
===========================================================
 RECOMMENDATION CONTROLLER

 PURPOSE:
 1. Handle requests for food recommendations.
 2. Identify the authenticated user.
 3. Call the recommendation service to generate recommendations.
 4. Return the recommendations and their total count.
 5. Handle errors without crashing the server.

 ROUTE:
 GET /recommendations

 DEPENDENCIES:
 - recommendationService.js
 - Authentication middleware that sets req.user.uid
===========================================================
*/


// Import the recommendation service function.
// The service contains the logic used to generate recommendations.
// This controller handles the HTTP request and response.
const {
  getRecommendations
} = require("../services/recommendationService");


// ==========================================
//          GET RECOMMENDATIONS
// ==========================================

// Handle GET requests to /recommendations.
//
// Expected behavior:
// 1. Read the authenticated user's Firebase UID.
// 2. Ask the recommendation service for that user's recommendations.
// 3. Return the results as JSON.
exports.getRecommendations = async (req, res) => {

  try {

    // Get the unique ID of the currently authenticated user.
    // Authentication middleware must set req.user before this
    // controller runs.
    const userId = req.user.uid;


    // Generate or retrieve recommendations for this user.
    // The recommendation service determines how recommendations
    // are selected and whether inventory or nutrition data is used.
    const recommendations =
      await getRecommendations(userId);


    // Return HTTP 200 (OK) when the request succeeds.
    //
    // count:
    // The number of recommendations returned.
    //
    // recommendations:
    // The actual list of recommended foods or meals.
    res.status(200).json({

      count:
        recommendations.length,

      recommendations

    });

  } catch (error) {

    // Log the detailed error in the backend terminal.
    // This helps with debugging while keeping internal error
    // details out of the response sent to the frontend.
    console.error(
      "Error getting recommendations:",
      error
    );


    // Return HTTP 500 (Internal Server Error).
    // The frontend can use this response to display an error
    // message if recommendations cannot be generated.
    res.status(500).json({
      error:
        "Unable to generate recommendations"
    });

  }

};
