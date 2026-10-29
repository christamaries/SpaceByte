/*
===========================================================
 DASHBOARD CONTROLLER
 
 PURPOSE:
 1. Handle requests to the dashboard API.
 2. Identify the authenticated user.
 3. Retrieve dashboard data from the dashboard service.
 4. Return inventory, alerts, and nutrition data to
    the frontend.
 5. Handle errors if the dashboard cannot load.

 NOTE:
 The dashboard controller handles HTTP requests and
 responses. The dashboard service handles the data logic.
===========================================================
*/

// Import the getDashboard function from the dashboard
// service. This function retrieves the user's dashboard
// information from the backend data source.
const {
  getDashboard
} = require("../services/dashboardService");


// ==========================================
//              GET DASHBOARD
// ==========================================

// HTTP endpoint: GET /dashboard
//
// PURPOSE:
// Returns dashboard information for the currently
// authenticated user.
//
// EXPECTED RESPONSE:
// - Inventory information
// - Inventory alerts
// - Nutrition information
//
// REQUIREMENT:
// The authentication middleware must run before this
// controller so req.user.uid is available.
exports.getDashboard = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: GET THE AUTHENTICATED USER ID
    // ------------------------------------------

    // Firebase authentication middleware should attach
    // the verified user's information to req.user.
    // The UID identifies which user's data to retrieve.
    const userId = req.user.uid;


    // ------------------------------------------
    // STEP 2: RETRIEVE DASHBOARD DATA
    // ------------------------------------------

    // Call the dashboard service and pass the user's UID.
    // The service is responsible for gathering the data.
    const dashboard = await getDashboard(userId);


    // ------------------------------------------
    // STEP 3: SEND THE DATA TO THE FRONTEND
    // ------------------------------------------

    // HTTP 200 means the request succeeded.
    // Send the dashboard object as a JSON response.
    res.status(200).json(dashboard);


  } catch (error) {

    // ------------------------------------------
    // STEP 4: HANDLE ERRORS
    // ------------------------------------------

    // Log the full error in the backend terminal to help
    // identify the cause of dashboard loading problems.
    console.error(
      "Error loading dashboard:",
      error
    );

    // Send a generic error message to the frontend.
    // Avoid exposing internal error details to users.
    res.status(500).json({
      error: "Unable to load dashboard"
    });

  }

};
