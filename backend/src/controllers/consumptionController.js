// consumptionController.js

// Import Firestore and Firebase Admin.
const { db, admin } = require("../config/firebase");


/*
 * Record food consumption.
 */
exports.logConsumption = async (req, res) => {

  try {

    /*
     * Get the authenticated user's UID.
     *
     * This comes from authMiddleware.js.
     *
     * This is safer than trusting a userId
     * sent by the frontend.
     */
    const userId = req.user.uid;

    // Get information from the request body.
    const { foodId, amount } = req.body;

    // Make sure the required information was provided.
    if (!foodId || !amount) {
      return res.status(400).json({
        message: "foodId and amount are required."
      });
    }

    /*
     * Get the food document from Firestore.
     */
    const foodRef = db.collection("inventory").doc(foodId);

    const foodDocument = await foodRef.get();

    // Make sure the food exists.
    if (!foodDocument.exists) {
      return res.status(404).json({
        message: "Food item not found."
      });
    }

    // Get the current food information.
    const food = foodDocument.data();

    // Make sure there is enough food available.
    if (food.quantity < amount) {
      return res.status(400).json({
        message: "Not enough food in inventory."
      });
    }

    /*
     * Decrease the inventory quantity.
     */
    await foodRef.update({
      quantity: food.quantity - amount
    });

    /*
     * Save the consumption record.
     *
     * The userId comes from Firebase Authentication.
     */
    await db.collection("consumptionLogs").add({
      userId: userId,
      foodId: foodId,
      amount: amount,
      consumedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send a successful response.
    res.status(200).json({
      message: "Food consumption recorded successfully."
    });

  } catch (error) {

    console.error("Consumption error:", error);

    res.status(500).json({
      message: "Unable to record food consumption."
    });
  }
};