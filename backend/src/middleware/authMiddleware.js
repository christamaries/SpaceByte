

/*
===========================================================
 SPACEBYTE - FIREBASE AUTHENTICATION MIDDLEWARE

 File: backend/src/middleware/authMiddleware.js

 PURPOSE:
 1. Protect backend API routes.
 2. Read the Firebase authentication token.
 3. Verify that the token is valid.
 4. Identify the currently authenticated user.
 5. Make the user's Firebase information available
    to backend controllers.

 HOW IT WORKS:

 React Frontend
      |
      v
 Sends Firebase ID Token
      |
      v
 Authentication Middleware
      |
      v
 Firebase Admin verifies token
      |
      v
 req.user.uid identifies the user
      |
      v
 Controller processes the request

 IMPORTANT:
 This middleware must run before protected controllers.
 It prevents requests with missing or invalid tokens
 from accessing protected backend functionality.

===========================================================
*/


// ==========================================
//          IMPORT FIREBASE ADMIN
// ==========================================

// Import Firebase Admin from the shared Firebase configuration.
//
// Firebase Admin is used on the backend to verify
// authentication tokens issued by Firebase Authentication.
//
// The same Firebase configuration is shared across
// the backend controllers and services.
const { admin } = require("../config/firebase");


// ==========================================
//          VERIFY AUTHENTICATION TOKEN
// ==========================================

// Middleware function used to protect backend API routes.
//
// PARAMETERS:
//
// req:
// The incoming HTTP request from the React frontend.
//
// res:
// The HTTP response sent back to the frontend.
//
// next:
// Allows Express to continue to the next middleware
// or controller when authentication succeeds.
//
// async:
// Allows the function to wait for Firebase to verify
// the user's authentication token before continuing.
const verifyToken = async (req, res, next) => {

  try {

    // ------------------------------------------
    // STEP 1: GET THE AUTHORIZATION HEADER
    // ------------------------------------------

    // Read the Authorization header from the incoming request.
    //
    // The React frontend should attach the Firebase ID token
    // when making requests to protected backend endpoints.
    //
    // EXPECTED FORMAT:
    // Authorization: Bearer YOUR_FIREBASE_TOKEN
    //
    // The token proves that the request comes from
    // an authenticated Firebase user.
    const authHeader = req.headers.authorization;


    // ------------------------------------------
    // STEP 2: CHECK WHETHER THE HEADER EXISTS
    // ------------------------------------------

    // Check whether the frontend included an Authorization header.
    //
    // If the header is missing, the backend cannot verify
    // the identity of the person making the request.
    //
    // Return HTTP 401 (Unauthorized) and stop execution.
    //
    // return prevents the controller from running.
    if (!authHeader) {

      return res.status(401).json({
        message: "Authentication required."
      });

    }


    // ------------------------------------------
    // STEP 3: EXTRACT THE FIREBASE ID TOKEN
    // ------------------------------------------

    // Split the Authorization header into separate parts.
    //
    // Example:
    // "Bearer abc123"
    //
    // authHeader.split(" ") produces:
    // ["Bearer", "abc123"]
    //
    // [1] selects the second part, which contains the token.
    //
    // The extracted token will be sent to Firebase Admin
    // for verification.
    const token = authHeader.split(" ")[1];


    // ------------------------------------------
    // STEP 4: CHECK WHETHER A TOKEN WAS PROVIDED
    // ------------------------------------------

    // Check whether the Authorization header contains
    // an actual token after the Bearer prefix.
    //
    // If the token is missing, return HTTP 401.
    //
    // This prevents requests without an authentication
    // token from accessing protected backend routes.
    if (!token) {

      return res.status(401).json({
        message: "Authentication token is missing."
      });

    }


    // ------------------------------------------
    // STEP 5: VERIFY THE FIREBASE ID TOKEN
    // ------------------------------------------

    // Send the extracted token to Firebase Admin.
    //
    // verifyIdToken() checks whether the token:
    // - Is valid.
    // - Was issued by the expected Firebase project.
    // - Has not expired.
    //
    // If verification succeeds, Firebase returns
    // the decoded information associated with the user.
    //
    // If verification fails, Firebase throws an error
    // and execution moves to the catch block.
    const decodedToken =
      await admin.auth().verifyIdToken(token);


    // ------------------------------------------
    // STEP 6: SAVE THE AUTHENTICATED USER
    // ------------------------------------------

    // Attach the verified Firebase user information
    // to the Express request object.
    //
    // This makes the authenticated user's information
    // available to the next middleware or controller.
    //
    // EXAMPLES:
    //
    // req.user.uid:
    // The user's unique Firebase ID.
    //
    // req.user.email:
    // The user's email address, when available.
    //
    // req.user:
    // Contains the decoded Firebase token information.
    //
    // SPACEBYTE USE:
    // Controllers use req.user.uid to identify the correct
    // user when retrieving or saving:
    // - User profiles.
    // - Inventory records.
    // - Meal plans.
    // - Food consumption records.
    // - Nutrition information.
    // - Dietary restrictions.
    req.user = decodedToken;


    // ------------------------------------------
    // STEP 7: CONTINUE TO THE CONTROLLER
    // ------------------------------------------

    // Firebase successfully verified the authentication token.
    //
    // Call next() to allow Express to continue processing
    // the request.
    //
    // The next function may be another middleware
    // or the controller associated with the requested route.
    //
    // Without next(), the request would not continue
    // to the controller.
    next();


  } catch (error) {

    // ------------------------------------------
    // STEP 8: HANDLE AUTHENTICATION ERRORS
    // ------------------------------------------

    // Display the detailed error in the backend terminal.
    //
    // Possible causes include:
    // - An invalid Firebase ID token.
    // - An expired Firebase ID token.
    // - An incorrectly configured Firebase Admin SDK.
    // - A Firebase Authentication verification failure.
    //
    // Logging helps troubleshoot authentication problems
    // without exposing internal error details to the frontend.
    console.error("Authentication error:", error);


    // Return HTTP 401 (Unauthorized) when Firebase
    // cannot verify the supplied authentication token.
    //
    // The frontend receives a general error message.
    //
    // The protected controller will not execute.
    return res.status(401).json({
      message: "Unauthorized. Invalid or expired token."
    });

  }

};


// ==========================================
//             EXPORT MIDDLEWARE
// ==========================================

// Export verifyToken so other backend route files
// can import and use this authentication middleware.
//
// EXAMPLE:
//
// const verifyToken = require("../middleware/authMiddleware");
//
// router.get("/", verifyToken, controller.getData);
//
// In this example:
// 1. The request reaches the route.
// 2. verifyToken checks the Firebase ID token.
// 3. If authentication succeeds, the controller runs.
//
// This allows SpaceByte to protect routes consistently
// throughout the backend.
module.exports = verifyToken;
