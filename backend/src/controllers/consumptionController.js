// consumptionController.js

// Import the Firestore database connection
// from the Firebase configuration file
const { db, admin } = require("../config/firebase");

// Create a function to log a user's food consumption
exports.logConsumption = async (req, res) => {

  try {

    // Get the food ID and amount consumed
    // from the request body
    const { foodId, amount } = req.body;

    // Get the authenticated user's ID
    // from the Firebase authentication token
    const userId = req.user.uid;

    // Make sure the food ID was provided
    if (!foodId) {

      // Return a 400 Bad Request response
      return res.status(400).json({
        error: "foodId is required"
      });
    }

    // Make sure the amount is a number
    if (typeof amount !== "number" || isNaN(amount)) {

      // Return an error if amount is not a valid number
      return res.status(400).json({
        error: "Invalid amount"
      });
    }

    // Make sure the amount is greater than zero
    if (amount <= 0) {

      // Return an error if the amount is zero or negative
      return res.status(400).json({
        error: "Amount must be greater than zero"
      });
    }

    // Create a reference to the food item
    // inside the inventory collection
    const foodRef = db.collection("inventory").doc(foodId);

    // Retrieve the food document from Firestore
    const foodDoc = await foodRef.get();

    // Check whether the food item exists
    if (!foodDoc.exists) {

      // Return a 404 error if the food does not exist
      return res.status(404).json({
        error: "Food item not found"
      });
    }

    // Get the food information from Firestore
    const foodData = foodDoc.data();

    // Get the current inventory quantity
    const currentQuantity = foodData.quantity;

    // Make sure the current quantity is a number
    if (typeof currentQuantity !== "number") {

      return res.status(500).json({
        error: "Inventory quantity is invalid"
      });
    }

    // Make sure the user is not consuming
    // more food than is available
    if (amount > currentQuantity) {

      // Return a 400 error if there is not enough food
      return res.status(400).json({
        error: "Not enough food available in inventory"
      });
    }

    // Calculate the new inventory quantity
    const newQuantity = currentQuantity - amount;

    // Update the food quantity in Firestore
    await foodRef.update({
      quantity: newQuantity
    });

    // Add a new consumption record to Firestore
    await db.collection("consumptionLogs").add({

      // Store the ID of the food that was consumed
      foodId: foodId,

      // Store the amount of food consumed
      amount: amount,

      // Store the authenticated user's ID
      userId: userId,

      // Store the date and time of consumption
      timestamp: new Date()
    });

    // Send a successful response back to the frontend
    res.status(200).json({

      // Confirmation message
      message: "Meal logged successfully",

      // Return the updated inventory quantity
      remainingQuantity: newQuantity
    });

  } catch (error) {

    // Display the error in the server console
    console.error("Error logging consumption:", error);

    // Send a 500 server error response
    res.status(500).json({
      error: error.message
    });
  }
};