// authMiddleware.js


// Import Firebase Admin from our Firebase configuration.
const { admin } = require("../config/firebase");


// This middleware checks whether the user is authenticated with Firebase.
// A protected route will use this middleware before allowing the request to continue.
const verifyToken = async (req, res, next) => {
  try {

    // Get the Authorization header from the request.
    const authHeader = req.headers.authorization;

    // Check whether the Authorization header exists.
    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication required."
      });
    }

  
    // The Authorization header should look like: Authorization: Bearer YOUR_FIREBASE_TOKEN
    const token = authHeader.split(" ")[1];

    // Make sure a token was actually provided.
    if (!token) {
      return res.status(401).json({
        message: "Authentication token is missing."
      });
    }

  
    // Ask Firebase to verify the token.
    // If the token is valid, Firebase returns information about the logged-in user.
    const decodedToken = await admin.auth().verifyIdToken(token);

    
    // Store the user's information in req.user.
    // Other controllers can now use:
    // req.user.uid
    // req.user.email
    req.user = decodedToken;

    // Continue to the protected route.
    next();

  } catch (error) {

    // Display the error in the backend terminal.
    console.error("Authentication error:", error);

    // Tell the client that authentication failed.
    return res.status(401).json({
      message: "Unauthorized. Invalid or expired token."
    });
  }
};

// Export the middleware.
module.exports = verifyToken;