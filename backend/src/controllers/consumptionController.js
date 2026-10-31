
// ===========================================================
// SPACEBYTE - FOOD CONSUMPTION CONTROLLER
// File: backend/src/controllers/consumptionController.js
//
// PURPOSE:
// 1. Record food consumed by an authenticated user.
// 2. Verify that the requested food exists in Firestore.
// 3. Check that enough food is available in inventory.
// 4. Subtract the consumed amount from inventory.
// 5. Save a consumption record in Firestore.
// 6. Return an appropriate response to the frontend.
// ===========================================================


// =====================================================
//              FIREBASE DATABASE CONNECTION
// =====================================================

// Import Firestore (db) and Firebase Admin (admin)
// from the Firebase configuration file.
//
// db allows this controller to access Firestore.
// admin provides Firebase administrative functions,
// including automatic server timestamps.
const { db, admin } = require("../config/firebase");


// =====================================================
//              RECORD FOOD CONSUMPTION
// =====================================================

// Export the logConsumption function so it can be
// accessed by the consumption routes.
//
// This asynchronous function handles requests from
// the frontend when a user records food consumption.
exports.logConsumption = async (req, res) => {

  try {

    // =====================================================
    //          GET AUTHENTICATED USER INFORMATION
    // =====================================================

    // Get the authenticated user's unique Firebase UID.
    //
    // The UID is provided by authMiddleware.js after
    // successfully verifying the Firebase authentication token.
    //
    // Using req.user.uid ensures that the consumption record
    // belongs to the authenticated user instead of trusting
    // a user ID submitted by the frontend.
    const userId = req.user.uid;


    // =====================================================
    //              GET REQUEST INFORMATION
    // =====================================================

    // Extract the food ID and amount from the request body.
    //
    // foodId identifies which inventory item was consumed.
    //
    // amount represents how much of that food was consumed.
    //
    // Example:
    // {
    //   "foodId": "apple",
    //   "amount": 2
    // }
    const { foodId, amount } = req.body;


    // =====================================================
    //              VALIDATE REQUEST INFORMATION
    // =====================================================

    // Check whether the required food ID and amount
    // were provided by the frontend.
    //
    // If either value is missing, return a 400 Bad Request
    // response instead of continuing with the operation.
    if (!foodId || !amount) {
      return res.status(400).json({
        message: "foodId and amount are required."
      });
    }


    // =====================================================
    //              FIND FOOD IN INVENTORY
    // =====================================================

    // Create a reference to the requested food document
    // inside the Firestore inventory collection.
    //
    // Example:
    // inventory/apple
    //
    // The foodId determines which document is retrieved.
    const foodRef = db.collection("inventory").doc(foodId);


    // Retrieve the food document from Firestore.
    //
    // The await keyword pauses execution until Firestore
    // finishes retrieving the requested document.
    const foodDocument = await foodRef.get();


    // =====================================================
    //              VERIFY FOOD EXISTS
    // =====================================================

    // Check whether the requested food document exists.
    //
    // If the document does not exist, return a 404 Not Found
    // response to inform the frontend that the food item
    // could not be located in the inventory collection.
    if (!foodDocument.exists) {
      return res.status(404).json({
        message: "Food item not found."
      });
    }


    // =====================================================
    //              GET FOOD INFORMATION
    // =====================================================

    // Convert the Firestore document into a JavaScript object.
    //
    // This allows the controller to access the food's
    // stored information, including its current quantity.
    const food = foodDocument.data();


    // =====================================================
    //              CHECK AVAILABLE QUANTITY
    // =====================================================

    // Make sure the requested consumption amount does not
    // exceed the quantity currently available in inventory.
    //
    // Example:
    // Available apples: 10
    // Requested apples: 12
    //
    // Since only 10 apples are available, the request
    // should be rejected.
    if (food.quantity < amount) {
      return res.status(400).json({
        message: "Not enough food in inventory."
      });
    }


    // =====================================================
    //              UPDATE INVENTORY QUANTITY
    // =====================================================

    // Subtract the consumed amount from the current
    // inventory quantity.
    //
    // Example:
    // Previous quantity: 100 apples
    // Amount consumed: 2 apples
    // Remaining quantity: 98 apples
    //
    // The update() method saves the new quantity
    // to the existing Firestore inventory document.
    await foodRef.update({
      quantity: food.quantity - amount
    });


    // =====================================================
    //              SAVE CONSUMPTION RECORD
    // =====================================================

    // Create a new document in the consumptionLogs collection.
    //
    // The add() method automatically generates a unique
    // document ID for each consumption record.
    //
    // The record stores:
    // - The authenticated user's ID.
    // - The ID of the consumed food item.
    // - The amount of food consumed.
    // - The date and time of consumption.
    //
    // This information can later be used by SpaceByte
    // to calculate nutritional totals and generate
    // food consumption reports.
    await db.collection("consumptionLogs").add({

      // Firebase UID of the authenticated user.
      userId: userId,

      // Unique ID of the food item consumed.
      foodId: foodId,

      // Quantity of food consumed.
      amount: amount,

      // Automatically record the date and time
      // when the consumption record is created.
      consumedAt: admin.firestore.FieldValue.serverTimestamp()
    });


    // =====================================================
    //              SEND SUCCESSFUL RESPONSE
    // =====================================================

    // Return a 200 OK response to the frontend.
    //
    // This confirms that the consumption request
    // was successfully processed.
    res.status(200).json({
      message: "Food consumption recorded successfully."
    });


  } catch (error) {

    // =====================================================
    //                  ERROR HANDLING
    // =====================================================

    // Display the actual error in the backend terminal.
    // This helps developers identify problems with
    // Firestore operations or other backend processes.
    console.error("Consumption error:", error);


    // Return a 500 Internal Server Error response
    // if something goes wrong while recording consumption.
    //
    // The frontend receives a general error message
    // without exposing internal backend details.
    res.status(500).json({
      message: "Unable to record food consumption."
    });
  }
};
