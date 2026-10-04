// userController.js

// Import the Firestore database connection
const { db, admin } = require("../config/firebase");

// Get the currently logged-in user's profile
exports.getProfile = async (req, res) => {

  try {

    // Firebase provides the user's unique ID
    const userId = req.user.uid;

    // Find the user's profile in Firestore
    const userDoc = await db
      .collection("users")
      .doc(userId)
      .get();

    // Check whether the profile exists
    if (!userDoc.exists) {

      return res.status(404).json({
        error: "User profile not found"
      });
    }

    // Return the user's profile
    res.status(200).json({
      id: userDoc.id,
      ...userDoc.data()
    });

  } catch (error) {

    // Display the error in the server console
    console.error("Error getting profile:", error);

    // Send an error response
    res.status(500).json({
      error: error.message
    });
  }
};


// Create or update the user's profile
exports.createProfile = async (req, res) => {

  try {

    // Get the authenticated user's ID
    const userId = req.user.uid;

    // Get profile information from the request
    const {
      firstName,
      lastName
    } = req.body;

    // Make sure the required information was provided
    if (!firstName || !lastName) {

      return res.status(400).json({
        error: "First name and last name are required"
      });
    }

    // Create or update the user's Firestore profile
    await db
      .collection("users")
      .doc(userId)
      .set({

        // Store the user's Firebase ID
        userId: userId,

        // Store the user's first name
        firstName: firstName,

        // Store the user's last name
        lastName: lastName,

        // Store the user's email
        email: req.user.email,

        // Store the date the profile was created or updated
        updatedAt: admin.firestore.FieldValue.serverTimestamp()

      }, { merge: true });

    // Send a successful response
    res.status(200).json({
      message: "Profile saved successfully"
    });

  } catch (error) {

    // Display the error in the server console
    console.error("Error creating profile:", error);

    // Send an error response
    res.status(500).json({
      error: error.message
    });
  }
};