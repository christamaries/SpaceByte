// inventoryController.js

// Import the Firestore database connection
// from the Firebase configuration file
const { db } = require("../config/firebase");

// Create a function to retrieve all food items
// from the inventory collection
exports.getAllFood = async (req, res) => {

  try {

    // Get all documents from the "inventory" collection
    const snapshot = await db.collection("inventory").get();

    // Convert each Firestore document into a JavaScript object
    const foods = snapshot.docs.map(doc => ({

      // Store the Firestore document ID as the food ID
      id: doc.id,

      // Include all of the food information
      // stored inside the Firestore document
      ...doc.data()
    }));

    // Send the food inventory back to the frontend
    // with a successful HTTP 200 response
    res.status(200).json(foods);

  } catch (error) {

    // Display the error in the server console
    console.error("Error getting inventory:", error);

    // Send a 500 server error response
    // if the inventory cannot be retrieved
    res.status(500).json({
      error: error.message
    });
  }
};