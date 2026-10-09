// userController.js

// Import Firebase Admin and Firestore.
const { admin, db } = require("../config/firebase");


// Create a user profile in Firestore.
// Firebase Authentication handles the actual authentication account.
exports.createProfile = async (req, res) => {

  try {

    // Get the authenticated user's UID.
    const uid = req.user.uid;

    // Get information from the request body.
    const { displayName } = req.body;

  
    // Get the user's Firebase Authentication record.
    const userRecord = await admin.auth().getUser(uid);

    
    // Create a user document in Firestore.
    // The Firebase UID is used as the document ID.
    await db.collection("users").doc(uid).set({
      uid: uid,
      email: userRecord.email,
      displayName: displayName || userRecord.displayName || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send a successful response.
    res.status(201).json({
      message: "User profile created successfully."
    });

  } catch (error) {

    // Display the error in the terminal.
    console.error("Create profile error:", error);

    // Send an error response.
    res.status(500).json({
      message: "Unable to create user profile."
    });
  }
};


// Get the currently logged-in user's profile.
exports.getProfile = async (req, res) => {

  try {

    // Get the UID from the verified Firebase token.
    const uid = req.user.uid;

    // Find the user's Firestore document.
    const userDocument = await db
      .collection("users")
      .doc(uid)
      .get();

    // Check whether the profile exists.
    if (!userDocument.exists) {
      return res.status(404).json({
        message: "User profile not found."
      });
    }

    // Return the user's profile.
    res.status(200).json({
      user: userDocument.data()
    });

  } catch (error) {

    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Unable to retrieve user profile."
    });
  }
};


// Logout the authenticated user.
// Firebase logout normally happens on the frontend.
// This backend function revokes the user's Firebase refresh tokens.
exports.logoutUser = async (req, res) => {

  try {

    // Get the logged-in user's UID.
    const uid = req.user.uid;

    
    // Revoke the user's refresh tokens.
    // This makes previously issued refresh tokens
    //invalid.
    await admin.auth().revokeRefreshTokens(uid);

    // Send a successful response.
    res.status(200).json({
      message: "User logged out successfully."
    });

  } catch (error) {

    console.error("Logout error:", error);

    res.status(500).json({
      message: "Unable to log out user."
    });
  }
};