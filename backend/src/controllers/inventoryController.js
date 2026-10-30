

/*
===========================================================
 SPACEBYTE - INVENTORY CONTROLLER
 File: backend/src/controllers/inventoryController.js

 PURPOSE:
 1. Retrieve all food inventory items.
 2. Calculate the status of each food item.
 3. Identify food items approaching their expiration dates.
 4. Add new food items to the inventory.
 5. Return inventory information to the React frontend.
 6. Handle errors during inventory operations.

 HOW IT WORKS:
 The inventory controller handles HTTP requests and responses.
 The inventory service handles the actual inventory data
 retrieval, calculations, and database operations.

===========================================================
*/


// =====================================================
//       IMPORT INVENTORY SERVICE FUNCTIONS
// =====================================================

// Import the required functions from inventoryService.js.
//
// getInventory:
// Retrieves food items stored in the inventory collection.
//
// getFoodStatus:
// Calculates the current status of an individual food item.
//
// getExpiringFood:
// Identifies food items approaching their expiration dates.
//
// addFoodItem:
// Creates and saves a new food item in the inventory.
//
// Keeping these functions in a separate service file
// helps organize the backend and avoid repeating database logic.
const {
  getInventory,
  getFoodStatus,
  getExpiringFood,
  addFoodItem
} = require("../services/inventoryService");


// =====================================================
//                  GET ALL FOOD
// =====================================================

// HTTP METHOD: GET
// API ENDPOINT: /inventory
//
// PURPOSE:
// Retrieve all food inventory items and calculate
// the status of each item before sending the results
// to the React frontend.
//
// EXPECTED RESPONSE:
// An array containing food items and their calculated
// inventory statuses.
//
// IMPORTANT:
// This function currently calls getInventory() without
// passing a user ID.
//
// If inventory is supposed to be user-specific, verify
// that inventoryService.js filters the results using
// the authenticated user's Firebase UID.
exports.getAllFood = async (req, res) => {

  try {

    // =====================================================
    //          STEP 1: RETRIEVE INVENTORY ITEMS
    // =====================================================

    // Call the inventory service to retrieve all food items
    // stored in the Firestore inventory collection.
    //
    // The returned foods variable is expected to contain
    // an array of food inventory objects.
    const foods = await getInventory();


    // =====================================================
    //          STEP 2: CALCULATE FOOD STATUS
    // =====================================================

    // Use the map() method to loop through each food item.
    //
    // map() creates a new array without changing the
    // original foods array.
    //
    // The spread operator (...food) preserves all existing
    // properties of each food item.
    //
    // The status property adds a calculated inventory
    // status to each food item.
    //
    // Possible statuses include:
    //
    // OK:
    // Food is available and not approaching expiration.
    //
    // LOW:
    // Food quantity has reached the low-stock threshold.
    //
    // EXPIRING:
    // Food is approaching its expiration date.
    //
    // EXPIRED:
    // Food has passed its expiration date.
    //
    // The actual rules for these statuses are defined
    // inside inventoryService.js.
    const inventory = foods.map(food => ({

      // Preserve the existing properties of the food item.
      ...food,

      // Calculate and attach the current inventory status.
      status: getFoodStatus(food)

    }));


    // =====================================================
    //          STEP 3: RETURN INVENTORY TO FRONTEND
    // =====================================================

    // Return an HTTP 200 OK response to indicate that
    // the inventory request was successful.
    //
    // Send the complete inventory array as JSON.
    //
    // The React frontend can use this information to
    // display food names, quantities, nutrition data,
    // expiration dates, and inventory statuses.
    res.status(200).json(inventory);


  } catch (error) {

    // =====================================================
    //              STEP 4: HANDLE ERRORS
    // =====================================================

    // Display the full error in the backend terminal.
    //
    // This helps developers troubleshoot issues such as:
    // - Firestore connection problems.
    // - Inventory service errors.
    // - Database query failures.
    // - Unexpected inventory data.
    console.error(
      "Error getting inventory:",
      error
    );


    // Return an HTTP 500 Internal Server Error response.
    // The frontend receives a general error message
    // without exposing internal backend information.
    res.status(500).json({
      error: "Unable to retrieve inventory"
    });

  }

};


// =====================================================
//                GET EXPIRING FOOD
// =====================================================

// HTTP METHOD: GET
// API ENDPOINT: /inventory/expiring
//
// OPTIONAL QUERY PARAMETER:
// days - Number of days to look ahead for expiration.
//
// EXAMPLE REQUEST:
// GET /inventory/expiring?days=7
//
// PURPOSE:
// Retrieve food items that are expected to expire
// within the requested number of days.
//
// EXPECTED RESPONSE:
// {
//   "days": 7,
//   "count": 2,
//   "items": [...]
// }
//
// This endpoint allows the dashboard to display
// upcoming expiration alerts.
exports.getExpiringFood = async (req, res) => {

  try {

    // =====================================================
    //          STEP 1: READ QUERY PARAMETER
    // =====================================================

    // Retrieve the "days" query parameter from the URL.
    //
    // Example:
    // /inventory/expiring?days=7
    //
    // req.query.days reads the value supplied by the frontend.
    //
    // Number() converts the value into a JavaScript number.
    //
    // If the parameter is missing or evaluates to zero,
    // the application uses 7 days as the default.
    const days =
      Number(req.query.days) || 7;


    // =====================================================
    //          STEP 2: FIND EXPIRING FOOD
    // =====================================================

    // Call getExpiringFood() from inventoryService.js.
    //
    // Pass the number of days so the service knows
    // how far ahead to check expiration dates.
    //
    // The returned foods variable contains the matching
    // food items that meet the expiration criteria.
    const foods =
      await getExpiringFood(days);


    // =====================================================
    //          STEP 3: RETURN EXPIRATION RESULTS
    // =====================================================

    // Return an HTTP 200 OK response to the frontend.
    //
    // days:
    // The requested expiration search period.
    //
    // count:
    // The number of food items returned.
    //
    // items:
    // The actual food items approaching expiration.
    //
    // foods.length determines how many items were found.
    res.status(200).json({
      days,
      count: foods.length,
      items: foods
    });


  } catch (error) {

    // =====================================================
    //              HANDLE EXPIRATION ERRORS
    // =====================================================

    // Display the error in the backend terminal
    // to help troubleshoot expiration-related problems.
    console.error(
      "Error getting expiring food:",
      error
    );


    // Return an HTTP 500 response if the application
    // cannot retrieve the expiration information.
    res.status(500).json({
      error: "Unable to retrieve expiration information"
    });

  }

};


// =====================================================
//                    ADD FOOD ITEM
// =====================================================

// HTTP METHOD: POST
// API ENDPOINT: /inventory
//
// PURPOSE:
// Receive food information from the React frontend,
// validate the required fields, save the new food item,
// and return the created inventory record.
//
// EXAMPLE REQUEST BODY:
// {
//   "name": "Rice",
//   "quantity": 10
// }
//
// The complete accepted fields are determined by
// inventoryService.js and the inventory data structure.
exports.addFood = async (req, res) => {

  try {

    // =====================================================
    //          STEP 1: READ REQUEST BODY
    // =====================================================

    // Extract the food name and quantity from the
    // JSON request body sent by the React frontend.
    //
    // req.body contains the information submitted
    // through the inventory form.
    const { name, quantity } = req.body;


    // =====================================================
    //          STEP 2: VALIDATE FOOD NAME
    // =====================================================

    // Make sure the food name is valid.
    //
    // The name must:
    // 1. Be provided.
    // 2. Be a string.
    // 3. Contain at least one non-whitespace character.
    //
    // trim() removes extra spaces from the beginning
    // and end of the submitted food name.
    //
    // If the name is invalid, return HTTP 400 Bad Request.
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        error: "Food name is required"
      });
    }


    // =====================================================
    //          STEP 3: VALIDATE FOOD QUANTITY
    // =====================================================

    // Convert the submitted quantity into a number.
    //
    // Number() also allows numeric strings such as "10"
    // to be converted into the number 10.
    const qty = Number(quantity);


    // Check whether the quantity is valid.
    //
    // Reject the request if:
    // - Quantity was not provided.
    // - Quantity is an empty string.
    // - Quantity is not a valid number.
    // - Quantity is negative.
    //
    // Zero is allowed because a food item may have
    // no remaining units in the inventory.
    if (
      quantity === undefined ||
      quantity === "" ||
      isNaN(qty) ||
      qty < 0
    ) {
      return res.status(400).json({
        error: "Quantity must be 0 or more"
      });
    }


    // =====================================================
    //          STEP 4: SAVE FOOD ITEM
    // =====================================================

    // Call addFoodItem() from inventoryService.js.
    //
    // Pass the submitted food information to the service.
    //
    // The service handles creating and saving the new
    // inventory document in Firestore.
    //
    // The returned newItem variable contains the
    // information for the newly created food item.
    const newItem = await addFoodItem(req.body);


    // =====================================================
    //          STEP 5: RETURN CREATED FOOD ITEM
    // =====================================================

    // Return HTTP 201 Created to indicate that the
    // new inventory item was successfully created.
    //
    // message:
    // Confirms that the food item was added.
    //
    // item:
    // Contains the newly created food item's information.
    //
    // The React frontend can use this response to
    // update the inventory display.
    return res.status(201).json({
      message: "Food item added",
      item: newItem
    });


  } catch (error) {

    // =====================================================
    //              STEP 6: HANDLE SAVE ERRORS
    // =====================================================

    // Display the full error in the backend terminal.
    //
    // This helps identify issues involving:
    // - Invalid Firestore data.
    // - Database connection problems.
    // - Inventory service errors.
    // - Failed document creation.
    console.error("Error adding food:", error);


    // Return an HTTP 500 Internal Server Error response.
    // Do not expose internal database information
    // to the frontend.
    return res.status(500).json({
      error: "Unable to add food item"
    });

  }

};


