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

    
    // Create or update the user's profile without deleting
    // existing profile fields that are not included here.
    await db.collection("users").doc(uid).set(
      {
        uid: uid,
        email: userRecord.email,
        displayName: displayName || userRecord.displayName || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

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
// If a profile does not exist yet, create one using the verified Firebase Authentication account.
exports.getProfile = async (req, res) => {
  try {
    // Get the UID from the verified Firebase token.
    const uid = req.user.uid;

    // Find the user's Firebase Authentication record.
    const userRecord = await admin.auth().getUser(uid);

    // Find the user's Firestore profile document.
    const userRef = db.collection("users").doc(uid);
    const userDocument = await userRef.get();

    // If the profile doesn't exist, create it.
    if (!userDocument.exists) {
      const newProfile = {
        uid: uid,
        email: userRecord.email || "",
        displayName: userRecord.displayName || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Save the new profile under the authenticated user's UID.
      await userRef.set(newProfile);

      // Return the newly created profile.
      return res.status(200).json({
        message: "User profile created successfully.",
        user: {
          uid: uid,
          email: userRecord.email || "",
          displayName: userRecord.displayName || ""
        }
      });
    }

    // Return the existing profile if one was found.
    return res.status(200).json({
      user: userDocument.data()
    });

  } catch (error) {
    // Log details in the backend terminal for troubleshooting.
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Unable to retrieve or create user profile."
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