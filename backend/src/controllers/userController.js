

/*
===========================================================
 SPACEBYTE - USER CONTROLLER
 File: backend/src/controllers/userController.js

 PURPOSE:
 1. Create or update a user's Firestore profile.
 2. Retrieve the authenticated user's profile.
 3. Automatically create a profile if one does not exist.
 4. Revoke Firebase refresh tokens when logging out.
 5. Retrieve a user's dietary restrictions.
 6. Add dietary restrictions to a user's profile.
 7. Delete dietary restrictions from a user's profile.

 IMPORTANT:
 Firebase Authentication manages the user's login account.
 Firestore stores the additional user profile information.

 USER IDENTIFICATION:
 The authenticated user's Firebase UID is obtained from
 req.user.uid, which is populated by authentication middleware.

 FIRESTORE COLLECTIONS:
 - users: Stores user profile information.
 - users/{uid}/dietaryRestrictions: Stores dietary restrictions
   belonging to an individual user.

===========================================================
*/


// ==========================================
//       IMPORT FIREBASE AND FIRESTORE
// ==========================================

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

// HTTP endpoint: POST /users/profile
//
// PURPOSE:
// Create a new Firestore user profile or update an
// existing profile.
//
// Firebase Authentication creates and manages the actual
// authentication account.
//
// This function stores additional user information
// in the Firestore users collection.
//
// EXPECTED REQUEST BODY:
// {
//   "displayName": "Crew Member"
// }
//
// The authenticated user's UID is used as the
// Firestore document ID.

exports.createProfile = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE AUTHENTICATED USER
    // ------------------------------------------

    // Get the UID of the authenticated user.
    //
    // This value comes from the verified Firebase token
    // attached to req.user by authentication middleware.
    //
    // Do not use a UID supplied by the frontend because
    // users should only be able to create or update
    // their own profiles.
    const uid = req.user.uid;


    // ------------------------------------------
    // STEP 2: READ THE REQUEST BODY
    // ------------------------------------------

    // Read the display name sent by the frontend.
    //
    // If displayName is missing, the Firebase Authentication
    // display name can be used as a fallback.
    const { displayName } = req.body;


    // ------------------------------------------
    // STEP 3: GET THE FIREBASE USER ACCOUNT
    // ------------------------------------------

    // Retrieve the user's Firebase Authentication record.
    //
    // This provides trusted account information such as:
    // - Email address.
    // - Display name.
    // - Firebase user ID.
    //
    // The UID identifies the account being retrieved.
    const userRecord = await admin.auth().getUser(uid);


    // ------------------------------------------
    // STEP 4: CREATE OR UPDATE THE FIRESTORE PROFILE
    // ------------------------------------------

    // Access the user's document in the Firestore users
    // collection.
    //
    // The Firebase UID is used as the document ID.
    //
    // This keeps each profile associated with its
    // authenticated Firebase account.
    //
    // set() saves the profile information.
    //
    // { merge: true } updates the supplied fields without
    // removing other existing fields from the document.
    await db.collection("users").doc(uid).set(
      {
        // Store the user's unique Firebase ID.
        uid: uid,

        // Store the email address from Firebase Authentication.
        email: userRecord.email,

        // Prefer the display name submitted by the frontend.
        //
        // If no display name was submitted, use the name
        // stored in Firebase Authentication.
        //
        // If neither exists, save an empty string.
        displayName: displayName || userRecord.displayName || "",

        // Record when the profile was last updated.
        //
        // Firestore generates the actual server timestamp.
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );


    // ------------------------------------------
    // STEP 5: RETURN THE SUCCESS RESPONSE
    // ------------------------------------------

    // Return HTTP 201 (Created) after the profile
    // information has been successfully saved.
    //
    // The frontend can use this response to confirm
    // that the user's profile was created or updated.
    res.status(201).json({
      message: "User profile created successfully."
    });

  } catch (error) {

    // ------------------------------------------
    // HANDLE PROFILE CREATION ERRORS
    // ------------------------------------------

    // Log the detailed error in the backend terminal.
    //
    // This helps identify Firebase Authentication,
    // Firestore, or server problems.
    console.error("Create profile error:", error);


    // Return HTTP 500 (Internal Server Error).
    //
    // Send a general error message to the frontend
    // without exposing internal server details.
    res.status(500).json({
      message: "Unable to create user profile."
    });
  }
};



// ==========================================
//          GET USER PROFILE
// ==========================================

// HTTP endpoint: GET /users/profile
//
// PURPOSE:
// Retrieve the currently authenticated user's profile.
//
// If the Firestore profile does not exist yet, this function
// automatically creates one using information from
// Firebase Authentication.
//
// This helps ensure that a signed-in user has a
// corresponding Firestore profile document.

exports.getProfile = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE AUTHENTICATED USER
    // ------------------------------------------

    // Get the UID from the verified Firebase ID token.
    //
    // Authentication middleware attaches the decoded
    // Firebase user information to req.user.
    const uid = req.user.uid;


    // ------------------------------------------
    // STEP 2: GET THE FIREBASE USER ACCOUNT
    // ------------------------------------------

    // Retrieve the user's Firebase Authentication record.
    //
    // This information is used to initialize a missing
    // Firestore profile.
    const userRecord = await admin.auth().getUser(uid);


    // ------------------------------------------
    // STEP 3: REFERENCE THE FIRESTORE PROFILE
    // ------------------------------------------

    // Reference the user's document in the users collection.
    //
    // The document ID is the authenticated user's Firebase UID.
    const userRef = db.collection("users").doc(uid);


    // ------------------------------------------
    // STEP 4: CHECK FOR AN EXISTING PROFILE
    // ------------------------------------------

    // Retrieve the user's profile document from Firestore.
    const userDocument = await userRef.get();


    // Check whether the profile document exists.
    //
    // If it does not exist, a new profile must be created.
    if (!userDocument.exists) {

      // ------------------------------------------
      // STEP 5: BUILD A NEW USER PROFILE
      // ------------------------------------------

      // Create a profile object using information
      // retrieved from Firebase Authentication.
      const newProfile = {
        // Store the authenticated user's Firebase UID.
        uid: uid,

        // Save the account email.
        // Use an empty string if no email is available.
        email: userRecord.email || "",

        // Save the account display name.
        // Use an empty string if no display name is set.
        displayName: userRecord.displayName || "",

        // Record when the profile was initially created.
        // Firestore supplies the server timestamp.
        createdAt: admin.firestore.FieldValue.serverTimestamp(),

        // Record when the profile was last updated.
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };


      // ------------------------------------------
      // STEP 6: SAVE THE NEW PROFILE
      // ------------------------------------------

      // Save the new profile in the users collection.
      //
      // The document ID is the authenticated user's UID.
      //
      // This creates the profile if it does not already exist.
      await userRef.set(newProfile);


      // ------------------------------------------
      // STEP 7: RETURN THE NEW PROFILE
      // ------------------------------------------

      // Return HTTP 200 (OK) with the newly created
      // profile information.
      //
      // The response uses account values directly because
      // server timestamps may not yet be available as
      // resolved values in the object sent to Firestore.
      return res.status(200).json({
        message: "User profile created successfully.",
        user: {
          uid: uid,
          email: userRecord.email || "",
          displayName: userRecord.displayName || ""
        }
      });
    }


    // ------------------------------------------
    // STEP 8: RETURN AN EXISTING PROFILE
    // ------------------------------------------

    // If the profile already exists, return its saved data.
    //
    // userDocument.data() converts the Firestore document
    // into a JavaScript object.
    //
    // This allows the frontend to load the user's profile
    // without creating another document.
    return res.status(200).json({
      user: userDocument.data()
    });

  } catch (error) {

    // ------------------------------------------
    // HANDLE PROFILE RETRIEVAL ERRORS
    // ------------------------------------------

    // Log the detailed error for backend troubleshooting.
    console.error("Get profile error:", error);


    // Return HTTP 500 if the profile could not be
    // retrieved or automatically created.
    return res.status(500).json({
      message: "Unable to retrieve or create user profile."
    });
  }
};


// ==========================================
//                LOG OUT USER
// ==========================================

// HTTP endpoint: POST /users/logout
//
// PURPOSE:
// Revoke the authenticated user's Firebase refresh tokens.
//
// IMPORTANT:
// Firebase logout normally happens on the frontend.
//
// This backend function revokes refresh tokens so they
// can no longer be used to obtain new Firebase ID tokens.
//
// Existing ID tokens may remain valid until they expire
// unless authentication middleware also checks token revocation.

exports.logoutUser = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE AUTHENTICATED USER
    // ------------------------------------------

    // Get the UID of the authenticated Firebase user.
    const uid = req.user.uid;


    // ------------------------------------------
    // STEP 2: REVOKE REFRESH TOKENS
    // ------------------------------------------

    // Revoke refresh tokens for this Firebase account.
    //
    // This prevents previously issued refresh tokens
    // from being used to obtain new ID tokens.
    await admin.auth().revokeRefreshTokens(uid);


    // ------------------------------------------
    // STEP 3: RETURN THE LOGOUT RESPONSE
    // ------------------------------------------

    // Return HTTP 200 (OK) when token revocation succeeds.
    res.status(200).json({
      message: "User logged out successfully."
    });

  } catch (error) {

    // ------------------------------------------
    // HANDLE LOGOUT ERRORS
    // ------------------------------------------

    // Log the detailed error in the backend terminal.
    console.error("Logout error:", error);


    // Return HTTP 500 if the logout operation fails.
    res.status(500).json({
      message: "Unable to log out user."
    });
  }
};


// ==========================================
//       GET DIETARY RESTRICTIONS
// ==========================================

// HTTP endpoint: GET /users/dietary-restrictions
//
// PURPOSE:
// Retrieve the dietary restrictions saved for the
// currently authenticated user.
//
// Each user's restrictions are stored in a separate
// Firestore subcollection.
//
// FIRESTORE PATH:
// users/{uid}/dietaryRestrictions
//
// This keeps dietary restriction records associated
// with the correct user.

exports.getDietaryRestrictions = async (req, res) => {
  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE AUTHENTICATED USER
    // ------------------------------------------

    // Get the Firebase UID from the verified token.
    const uid = req.user.uid;


    // ------------------------------------------
    // STEP 2: REFERENCE THE USER'S RESTRICTIONS
    // ------------------------------------------

    // Navigate to the authenticated user's dietary
    // restrictions subcollection.
    //
    // The UID ensures that the query accesses only
    // this user's dietary restriction records.
    const restrictionsRef = db
      .collection("users")
      .doc(uid)
      .collection("dietaryRestrictions");


    // ------------------------------------------
    // STEP 3: RETRIEVE THE RESTRICTIONS
    // ------------------------------------------

    // Retrieve the restrictions from Firestore.
    //
    // orderBy("createdAt", "desc") sorts the results
    // by creation date, with the newest records first.
    const snapshot = await restrictionsRef
      .orderBy("createdAt", "desc")
      .get();


    // ------------------------------------------
    // STEP 4: CONVERT DOCUMENTS INTO AN ARRAY
    // ------------------------------------------

    // Use map() to convert each Firestore document
    // into a JavaScript object.
    //
    // doc.id adds the Firestore document ID.
    // doc.data() contains the saved restriction information.
    //
    // The resulting array can be displayed by the frontend.
    const restrictions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));


    // ------------------------------------------
    // STEP 5: RETURN THE RESTRICTIONS
    // ------------------------------------------

    // Return HTTP 200 (OK) with the user's restrictions.
    //
    // If no restrictions exist, Firestore returns an empty
    // array rather than an error.
    return res.status(200).json({ restrictions });

  } catch (error) {

    // Log errors involving Firestore or restriction retrieval.
    console.error("Get dietary restrictions error:", error);


    // Return HTTP 500 if the restrictions cannot be retrieved.
    return res.status(500).json({
      message: "Unable to retrieve dietary restrictions."
    });
  }
};


// ==========================================
//       ADD DIETARY RESTRICTION
// ==========================================

// HTTP endpoint: POST /users/dietary-restrictions
//
// PURPOSE:
// Save a new dietary restriction for the authenticated user.
//
// EXPECTED REQUEST BODY:
// {
//   "name": "Peanuts",
//   "type": "Food Allergy",
//   "notes": "Avoid products containing peanuts.",
//   "severity": "Severe"
// }
//
// The allowed categories and severity levels are validated
// before the restriction is saved to Firestore.

exports.addDietaryRestriction = async (req, res) => {
  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE AUTHENTICATED USER
    // ------------------------------------------

    // Retrieve the Firebase UID from the verified token.
    const uid = req.user.uid;


    // ------------------------------------------
    // STEP 2: READ THE SUBMITTED RESTRICTION
    // ------------------------------------------

    // Extract the restriction information from the request body.
    //
    // name:
    // The name of the food or dietary restriction.
    //
    // type:
    // The category of restriction.
    //
    // notes:
    // Optional additional information.
    //
    // severity:
    // The severity level of the restriction.
    const { name, type, notes, severity } = req.body;


    // ------------------------------------------
    // STEP 3: DEFINE ALLOWED RESTRICTION TYPES
    // ------------------------------------------

    // These are the only restriction categories accepted
    // by the backend.
    //
    // The frontend should use these same values when
    // presenting its category selection.
    const allowedTypes = [
      "Food Allergy",
      "Food Intolerance",
      "Medical Dietary Restriction",
      "Religious Restriction",
      "Vegetarian",
      "Vegan",
      "Other"
    ];


    // ------------------------------------------
    // STEP 4: DEFINE ALLOWED SEVERITY LEVELS
    // ------------------------------------------

    // These are the accepted severity options.
    //
    // The submitted severity must match one of these values.
    const allowedSeverities = [
      "Not specified",
      "Mild",
      "Moderate",
      "Severe",
      "Life-threatening"
    ];


    // ------------------------------------------
    // STEP 5: VALIDATE THE RESTRICTION NAME
    // ------------------------------------------

    // Make sure the restriction name:
    // - Is a string.
    // - Is not empty after trimming whitespace.
    // - Contains no more than 100 characters.
    //
    // Return HTTP 400 if the submitted name is invalid.
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        message: "Enter a restriction name of 1 to 100 characters."
      });
    }


    // ------------------------------------------
    // STEP 6: VALIDATE THE RESTRICTION CATEGORY
    // ------------------------------------------

    // Check whether the submitted category is included
    // in the allowedTypes array.
    //
    // includes() returns true when the category is valid.
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: "Select a valid restriction category."
      });
    }


    // ------------------------------------------
    // STEP 7: VALIDATE THE SEVERITY
    // ------------------------------------------

    // Check whether the submitted severity matches
    // one of the approved severity levels.
    if (!allowedSeverities.includes(severity)) {
      return res.status(400).json({
        message: "Select a valid severity."
      });
    }


    // ------------------------------------------
    // STEP 8: VALIDATE OPTIONAL NOTES
    // ------------------------------------------

    // Notes are optional.
    //
    // If notes are provided, they must:
    // - Be a string.
    // - Contain no more than 1,000 characters.
    //
    // This prevents unexpected data types or excessively
    // long notes from being saved.
    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.length > 1000)
    ) {
      return res.status(400).json({
        message: "Notes must be 1,000 characters or fewer."
      });
    }


    // ------------------------------------------
    // STEP 9: BUILD THE RESTRICTION OBJECT
    // ------------------------------------------

    // Create the restriction object that will be saved
    // in the user's dietaryRestrictions subcollection.
    const restriction = {

      // Remove unnecessary whitespace from the name.
      name: name.trim(),

      // Save the validated restriction category.
      type,

      // Save the notes.
      // If notes are missing or empty, use an empty string.
      notes: (notes || "").trim(),

      // Save the validated severity level.
      severity,

      // Record when the restriction was created.
      createdAt: admin.firestore.FieldValue.serverTimestamp(),

      // Record when the restriction was last updated.
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };


    // ------------------------------------------
    // STEP 10: SAVE THE RESTRICTION IN FIRESTORE
    // ------------------------------------------

    // Save the restriction inside the authenticated
    // user's dietaryRestrictions subcollection.
    //
    // add() automatically generates a unique document ID.
    //
    // The restriction is stored under the user's UID,
    // preventing the frontend from choosing another
    // user's Firestore document location.
    const restrictionRef = await db
      .collection("users")
      .doc(uid)
      .collection("dietaryRestrictions")
      .add(restriction);


    // ------------------------------------------
    // STEP 11: RETURN THE SAVED RESTRICTION
    // ------------------------------------------

    // Return HTTP 201 (Created) when the restriction
    // has been successfully saved.
    //
    // Include the generated document ID and saved
    // restriction information in the response.
    return res.status(201).json({
      message: "Dietary restriction saved successfully.",
      restriction: {
        id: restrictionRef.id,
        name: restriction.name,
        type: restriction.type,
        notes: restriction.notes,
        severity: restriction.severity
      }
    });

  } catch (error) {

    // ------------------------------------------
    // HANDLE ADD RESTRICTION ERRORS
    // ------------------------------------------

    // Log the detailed error for backend troubleshooting.
    console.error("Add dietary restriction error:", error);


    // Return HTTP 500 if the restriction cannot be saved.
    return res.status(500).json({
      message: "Unable to save dietary restriction."
    });
  }
};


// ==========================================
//       DELETE DIETARY RESTRICTION
// ==========================================

// HTTP endpoint: DELETE /users/dietary-restrictions/:id
//
// PURPOSE:
// Delete a dietary restriction belonging to the
// currently authenticated user.
//
// The restriction ID is provided through the URL.
//
// IMPORTANT:
// The Firestore query is limited to the authenticated
// user's own dietaryRestrictions subcollection.

exports.deleteDietaryRestriction = async (req, res) => {
  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE USER AND RESTRICTION
    // ------------------------------------------

    // Get the authenticated user's Firebase UID.
    const uid = req.user.uid;

    // Retrieve the restriction document ID from the URL.
    //
    // Example:
    // DELETE /users/dietary-restrictions/abc123
    //
    // In this example, restrictionId will be "abc123".
    const restrictionId = req.params.id;


    // ------------------------------------------
    // STEP 2: VALIDATE THE RESTRICTION ID
    // ------------------------------------------

    // Make sure a restriction ID was provided.
    //
    // If the ID is missing, return HTTP 400 (Bad Request).
    if (!restrictionId) {
      return res.status(400).json({
        message: "A restriction ID is required."
      });
    }


    // ------------------------------------------
    // STEP 3: FIND THE USER'S RESTRICTION
    // ------------------------------------------

    // Reference the restriction document inside the
    // authenticated user's dietaryRestrictions subcollection.
    //
    // This ensures that the lookup is performed within
    // the current user's profile.
    const restrictionRef = db
      .collection("users")
      .doc(uid)
      .collection("dietaryRestrictions")
      .doc(restrictionId);


    // Retrieve the restriction document from Firestore.
    const restrictionDoc = await restrictionRef.get();


    // ------------------------------------------
    // STEP 4: CHECK WHETHER THE RESTRICTION EXISTS
    // ------------------------------------------

    // If the document does not exist in this user's
    // subcollection, return HTTP 404 (Not Found).
    if (!restrictionDoc.exists) {
      return res.status(404).json({
        message: "Dietary restriction not found."
      });
    }


    // ------------------------------------------
    // STEP 5: DELETE THE RESTRICTION
    // ------------------------------------------

    // Delete the selected dietary restriction document.
    //
    // Because restrictionRef points to the authenticated
    // user's subcollection, this operation targets only
    // that user's restriction.
    await restrictionRef.delete();


    // ------------------------------------------
    // STEP 6: RETURN THE SUCCESS RESPONSE
    // ------------------------------------------

    // Return HTTP 200 (OK) after the restriction
    // has been successfully deleted.
    return res.status(200).json({
      message: "Dietary restriction removed successfully."
    });

  } catch (error) {

    // ------------------------------------------
    // HANDLE DELETE RESTRICTION ERRORS
    // ------------------------------------------

    // Log the detailed error in the backend terminal.
    console.error("Delete dietary restriction error:", error);


    // Return HTTP 500 if the restriction cannot be deleted.
    return res.status(500).json({
      message: "Unable to remove dietary restriction."
    });
  }
};
