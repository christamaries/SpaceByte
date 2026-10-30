
/*
===========================================================
 SPACEBYTE - DASHBOARD CONTROLLER
 File: backend/src/controllers/dashboardController.js

 PURPOSE:
 1. Handle incoming requests to the dashboard API.
 2. Identify the currently authenticated user.
 3. Retrieve dashboard information from the dashboard service.
 4. Return inventory, inventory alerts, and nutrition data.
 5. Send dashboard information to the frontend.
 6. Handle errors if dashboard information cannot load.

 HOW IT WORKS:
 The dashboard controller handles HTTP requests and responses.
 The dashboard service handles the actual database queries
 and calculations needed to build the dashboard.

===========================================================
*/


// =====================================================
//              IMPORT DASHBOARD SERVICE
// =====================================================

// Import the getDashboard function from dashboardService.js.
//
// The dashboard service is responsible for retrieving and
// organizing the information needed by the dashboard.
//
// Keeping database operations in the service helps separate
// the application's data logic from its HTTP request logic.
const {
  getDashboard
} = require("../services/dashboardService");


// =====================================================
//                  GET DASHBOARD
// =====================================================

// HTTP METHOD: GET
// API ENDPOINT: /dashboard
//
// PURPOSE:
// Retrieve dashboard information for the currently
// authenticated SpaceByte user.
//
// INFORMATION RETURNED:
// - Food inventory
// - Inventory alerts
// - Nutrition information
//
// AUTHENTICATION REQUIREMENT:
// authMiddleware.js must run before this controller.
//
// The middleware verifies the Firebase authentication token
// and attaches the authenticated user's information to req.user.
exports.getDashboard = async (req, res) => {

  try {

    // =====================================================
    //          STEP 1: GET AUTHENTICATED USER ID
    // =====================================================

    // Retrieve the Firebase UID of the authenticated user.
    //
    // The UID is provided by authMiddleware.js after
    // successfully verifying the user's Firebase token.
    //
    // This ensures the dashboard service retrieves
    // information associated with the correct user.
    //
    // Example:
    // userId = "firebase-authenticated-user-id"
    const userId = req.user.uid;


    // =====================================================
    //          STEP 2: RETRIEVE DASHBOARD DATA
    // =====================================================

    // Call the getDashboard function from dashboardService.js.
    //
    // Pass the authenticated user's UID to the service
    // so it knows which user's dashboard information
    // needs to be retrieved.
    //
    // The await keyword pauses execution until the service
    // finishes retrieving and processing the dashboard data.
    const dashboard = await getDashboard(userId);


    // =====================================================
    //          STEP 3: SEND DATA TO FRONTEND
    // =====================================================

    // Return an HTTP 200 OK response to indicate that
    // the dashboard request was successful.
    //
    // The json() method converts the dashboard object
    // into JSON so the React frontend can receive and
    // display the information.
    //
    // The response may contain:
    // - Inventory information
    // - Low-stock alerts
    // - Expiration alerts
    // - Nutrition totals
    res.status(200).json(dashboard);


  } catch (error) {

    // =====================================================
    //                  STEP 4: ERROR HANDLING
    // =====================================================

    // Display the actual error in the backend terminal.
    //
    // This helps developers troubleshoot problems such as:
    // - Firestore connection errors.
    // - Missing user information.
    // - Dashboard service errors.
    // - Database query failures.
    console.error(
      "Error loading dashboard:",
      error
    );


    // Return an HTTP 500 Internal Server Error response.
    //
    // The frontend receives a general error message
    // without exposing sensitive backend information.
    res.status(500).json({
      error: "Unable to load dashboard"
    });

  }

};


