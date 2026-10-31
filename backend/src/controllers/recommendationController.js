

/*
===========================================================
 SPACEBYTE - RECOMMENDATION CONTROLLER
 File: backend/src/controllers/recommendationController.js

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


// ==========================================
//       IMPORT RECOMMENDATION SERVICE
// ==========================================

// Import the getRecommendations function from
// recommendationService.js.
//
// The recommendation service contains the logic for
// selecting or generating food recommendations.
//
// This controller does not perform the recommendation
// calculations itself. It sends the request to the
// service and returns the results to the frontend.
const {
  getRecommendations
} = require("../services/recommendationService");


// ==========================================
//          GET RECOMMENDATIONS
// ==========================================

// HTTP endpoint: GET /recommendations
//
// PURPOSE:
// Retrieve food recommendations for the authenticated user.
//
// EXPECTED RESPONSE:
// {
//   "count": 2,
//   "recommendations": [
//     {
//       "name": "Rice",
//       "calories": 200
//     },
//     {
//       "name": "Chicken",
//       "calories": 250
//     }
//   ]
// }
//
// The response above is an example.
// Actual recommendations depend on the recommendation service.
//
// AUTHENTICATION:
// This route should use authentication middleware
// before calling this controller.
//
// The middleware verifies the Firebase token and
// attaches the authenticated user's information to req.user.

exports.getRecommendations = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE AUTHENTICATED USER
    // ------------------------------------------

    // Retrieve the Firebase UID of the currently
    // authenticated user.
    //
    // req.user is populated by the authentication middleware.
    //
    // The UID identifies which user's information should
    // be used when generating recommendations.
    const userId = req.user.uid;


    // ------------------------------------------
    // STEP 2: GENERATE RECOMMENDATIONS
    // ------------------------------------------

    // Call the recommendation service and pass the
    // authenticated user's ID.
    //
    // The recommendation service is responsible for
    // determining which foods or meals to recommend.
    //
    // Depending on its implementation, it may use:
    // - Available food inventory.
    // - Food expiration dates.
    // - Nutrition information.
    // - Consumption history.
    //
    // The returned value should be an array of recommendations.
    const recommendations =
      await getRecommendations(userId);


    // ------------------------------------------
    // STEP 3: RETURN THE RECOMMENDATIONS
    // ------------------------------------------

    // Send HTTP 200 (OK) when the request succeeds.
    //
    // count:
    // The total number of recommendations returned.
    //
    // recommendations:
    // The array containing the recommended foods or meals.
    //
    // .length counts how many items are in the array.
    //
    // The React frontend can use this information
    // to display the recommendations to the user.
    res.status(200).json({

      count:
        recommendations.length,

      recommendations

    });

  } catch (error) {

    // ------------------------------------------
    // STEP 4: HANDLE RECOMMENDATION ERRORS
    // ------------------------------------------

    // Display the detailed error in the backend terminal.
    //
    // This helps troubleshoot problems involving:
    // - Firestore database requests.
    // - The recommendation service.
    // - Missing user information.
    // - Recommendation calculations.
    //
    // Internal error details are logged on the server
    // instead of being exposed to the frontend.
    console.error(
      "Error getting recommendations:",
      error
    );


    // Return HTTP 500 (Internal Server Error).
    //
    // This response tells the frontend that the server
    // could not generate the requested recommendations.
    //
    // The frontend can display an appropriate error message.
    res.status(500).json({
      error:
        "Unable to generate recommendations"
    });

  }

};
