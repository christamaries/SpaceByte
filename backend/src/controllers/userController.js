
/*
===========================================================
 USER CONTROLLER

 PURPOSE:
 1. Create or update a user's Firestore profile.
 2. Retrieve the authenticated user's profile.
 3. Automatically create a profile if one does not exist.
 4. Revoke Firebase refresh tokens when logging out.

 IMPORTANT:
 Firebase Authentication manages the user's login account.
 Firestore stores the additional user profile information.
===========================================================
*/


// Import Firebase Admin and Firestore.
//
// admin:
// Provides administrative access to Firebase Authentication
// and Firestore utilities such as server timestamps.
//
// db:
// Provides access to the SpaceByte Firestore database.
const { admin, db } = require("../config/firebase");


// ==========================================
//          CREATE OR UPDATE PROFILE
// ==========================================

// Create a user profile in Firestore.
//
// Firebase Authentication creates and manages the actual
// authentication account. This function stores profile data
// in Firestore.
//
// Expected request body:
// {
//   "displayName": "Crew Member"
// }
//
// Route example:
// POST /users/profile
exports.createProfile = async (req, res) => {

  try {

    // Get the UID of the authenticated user.
    // This value must come from verified authentication
    // middleware, not from a UID supplied by the frontend.
    const uid = req.user.uid;


    // Read the display name sent by the frontend.
    // If it is missing, the Firebase Authentication display
    // name can be used as a fallback.
    const { displayName } = req.body;


    // Retrieve the user's Firebase Authentication record.
    // This provides trusted account information such as email
    // and the display name stored in Firebase Authentication.
    const userRecord = await admin.auth().getUser(uid);


    // Reference the user's Firestore profile document.
    // Using the Firebase UID as the document ID keeps each
    // profile associated with its authenticated account.
    //
    // merge: true updates the supplied fields without
    // removing other existing fields from the profile.
    await db.collection("users").doc(uid).set(
      {
        // Store the user's unique Firebase ID.
        uid: uid,

        // Store the email from Firebase Authentication.
        email: userRecord.email,

        // Prefer the submitted display name.
        // Otherwise use the Firebase account's display name.
        // If neither exists, store an empty string.
        displayName: displayName || userRecord.displayName || "",

        // Record when this profile was last updated.
        // Firestore sets the actual server timestamp.
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );


    // Return HTTP 201 (Created) after the profile is saved.
    res.status(201).json({
      message: "User profile created successfully."
    });

  } catch (error) {

    // Log detailed error information in the backend terminal.
    // This helps identify Firebase or Firestore problems.
    console.error("Create profile error:", error);


    // Return a general error message to the frontend.
    // Avoid exposing internal server details to the user.
    res.status(500).json({
      message: "Unable to create user profile."
    });
  }
};



// ==========================================
//          GET USER PROFILE
// ==========================================

// Retrieve the currently authenticated user's profile.
//
// If the Firestore profile does not exist yet, create it
// using information from the verified Firebase account.
//
// Route example:
// GET /users/profile
exports.getProfile = async (req, res) => {

  try {

    // Get the UID from the verified Firebase ID token.
    const uid = req.user.uid;


    // Retrieve the user's Firebase Authentication record.
    // This is used to initialize a missing Firestore profile.
    const userRecord = await admin.auth().getUser(uid);


    // Reference the user's profile document in Firestore.
    const userRef = db.collection("users").doc(uid);


    // Retrieve the profile document from Firestore.
    const userDocument = await userRef.get();


    // Check whether the profile document exists.
    if (!userDocument.exists) {

      // Build a new profile using the authenticated account.
      const newProfile = {
        uid: uid,

        // Use an empty string if the account has no email.
        email: userRecord.email || "",

        // Use an empty string if no display name is set.
        displayName: userRecord.displayName || "",

        // Record when the profile was initially created.
        createdAt: admin.firestore.FieldValue.serverTimestamp(),

        // Record when the profile was last updated.
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };


      // Save the new profile in the users collection.
      // The document ID is the authenticated user's UID.
      await userRef.set(newProfile);


      // Return the newly created profile information.
      //
      // The response uses the account values directly because
      // server timestamps may not yet be available as resolved
      // values in the object sent to Firestore.
      return res.status(200).json({
        message: "User profile created successfully.",
        user: {
          uid: uid,
          email: userRecord.email || "",
          displayName: userRecord.displayName || ""
        }
      });
    }


    // If a profile already exists, return its saved data.
    // This allows the frontend to load the user's profile
    // without creating a duplicate document.
    return res.status(200).json({
      user: userDocument.data()
    });

  } catch (error) {

    // Log the detailed error for backend troubleshooting.
    console.error("Get profile error:", error);


    // Tell the frontend that the profile could not be loaded
    // or created.
    return res.status(500).json({
      message: "Unable to retrieve or create user profile."
    });
  }
};


// ==========================================
//                LOG OUT USER
// ==========================================

// Revoke the authenticated user's Firebase refresh tokens.
//
// Important:
// Firebase logout normally happens on the frontend.
// This backend function revokes refresh tokens so they
// can no longer be used to obtain new ID tokens.
//
// Route example:
// POST /users/logout
exports.logoutUser = async (req, res) => {

  try {

    // Get the UID of the authenticated user.
    const uid = req.user.uid;


    // Revoke refresh tokens for this Firebase account.
    // Existing ID tokens may remain valid until they expire
    // unless your authentication middleware also checks
    // token revocation.
    await admin.auth().revokeRefreshTokens(uid);


    // Return HTTP 200 (OK) when revocation succeeds.
    res.status(200).json({
      message: "User logged out successfully."
    });

  } catch (error) {

    // Log the detailed error in the backend terminal.
    console.error("Logout error:", error);


    // Return a general logout error to the frontend.
    res.status(500).json({
      message: "Unable to log out user."
    });
  }
};
