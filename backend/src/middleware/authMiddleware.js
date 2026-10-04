// authMiddleware.js

// Import the Firebase Admin SDK
// from the Firebase configuration file
const { admin } = require("../config/firebase");

// Create middleware to verify the user's Firebase ID token
const verifyToken = async (req, res, next) => {

  try {

    // Get the Authorization header
    const authHeader = req.headers.authorization;

    // Check whether an Authorization header was provided
    if (!authHeader) {

      return res.status(401).json({
        error: "Authorization token is required"
      });
    }

    // Check that the header starts with "Bearer"
    if (!authHeader.startsWith("Bearer ")) {

      return res.status(401).json({
        error: "Invalid authorization format"
      });
    }

    // Remove "Bearer " from the beginning
    // and get the Firebase ID token
    const token = authHeader.split("Bearer ")[1];

    // Verify the token with Firebase Admin
    const decodedToken =
      await admin.auth().verifyIdToken(token);

    // Store the authenticated user's information
    // so other controllers can access it
    req.user = decodedToken;

    // Continue to the requested route
    next();

  } catch (error) {

    // Display the error in the server console
    console.error("Authentication error:", error);

    // Return a 401 Unauthorized response
    res.status(401).json({
      error: "Invalid or expired authentication token"
    });
  }
};

// Export the middleware
module.exports = verifyToken;