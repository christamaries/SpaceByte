
/*
===========================================================
 INVENTORY CONTROLLER
 
 PURPOSE:
 1. Retrieve all food inventory items.
 2. Calculate the status of each food item.
 3. Find food items that are expiring soon.
 4. Add new food items to the inventory.
 5. Return JSON responses to the React frontend.
 6. Handle errors when inventory operations fail.

 NOTE:
 The controller handles HTTP requests and responses.
 The inventory service handles the inventory data logic.
===========================================================
*/


// ==========================================
//       IMPORT INVENTORY SERVICE FUNCTIONS
// ==========================================

// Import functions from inventoryService.js.
//
// getInventory:
// Retrieves inventory items.
//
// getFoodStatus:
// Calculates the status of an individual food item.
//
// getExpiringFood:
// Finds food items approaching their expiration date.
//
// addFoodItem:
// Saves a new food item to the inventory.
const {
  getInventory,
  getFoodStatus,
  getExpiringFood,
  addFoodItem
} = require("../services/inventoryService");


// ==========================================
//              GET ALL FOOD
// ==========================================

// HTTP endpoint: GET /inventory
//
// PURPOSE:
// Retrieve all inventory items and calculate the status
// of each item before returning the results to the frontend.
//
// EXPECTED RESPONSE:
// An array of food items, including each item's status.
//
// IMPORTANT:
// This function currently calls getInventory() without
// a user ID. If inventory is supposed to be user-specific,
// check whether your service filters items by the authenticated
// user's ID.

exports.getAllFood = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: RETRIEVE INVENTORY ITEMS
    // ------------------------------------------

    // Ask the inventory service to retrieve the food items.
    // The returned value is expected to be an array.
    const foods = await getInventory();


    // ------------------------------------------
    // STEP 2: CALCULATE FOOD STATUS
    // ------------------------------------------

    // Loop through every food item using map().
    //
    // The spread operator (...food) preserves the existing
    // properties of each food item.
    //
    // The status property adds a calculated status.
    // Examples may include:
    // OK       - Food is available and not near expiration.
    // LOW      - Food quantity is running low.
    // EXPIRING - Food is approaching its expiration date.
    // EXPIRED  - Food has passed its expiration date.
    //
    // The exact status rules are defined in the service.
    const inventory = foods.map(food => ({

      // Preserve the existing food item's properties.
      ...food,

      // Calculate and attach the item's current status.
      status: getFoodStatus(food)

    }));


    // ------------------------------------------
    // STEP 3: RETURN INVENTORY TO THE FRONTEND
    // ------------------------------------------

    // HTTP 200 indicates that the request succeeded.
    // Send the complete inventory array as JSON.
    res.status(200).json(inventory);


  } catch (error) {

    // ------------------------------------------
    // STEP 4: HANDLE INVENTORY ERRORS
    // ------------------------------------------

    // Log the full error in the backend terminal.
    // This helps diagnose database or service problems.
    console.error(
      "Error getting inventory:",
      error
    );

    // Send an error response to the frontend.
    res.status(500).json({
      error: "Unable to retrieve inventory"
    });

  }

};


// ==========================================
//            GET EXPIRING FOOD
// ==========================================

// HTTP endpoint: GET /inventory/expiring
//
// OPTIONAL QUERY PARAMETER:
// days - Number of days to look ahead.
//
// EXAMPLE:
// GET /inventory/expiring?days=7
//
// PURPOSE:
// Return food items that are expiring within the
// requested number of days.
//
// EXPECTED RESPONSE:
// {
//   "days": 7,
//   "count": 2,
//   "items": [...]
//
// }

exports.getExpiringFood = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: READ THE QUERY PARAMETER
    // ------------------------------------------

    // Read the "days" value from the URL.
    //
    // Example:
    // /inventory/expiring?days=7
    //
    // Convert the value to a number.
    // If the value is missing or evaluates to zero,
    // use 7 days as the default.
    const days =
      Number(req.query.days) || 7;


    // ------------------------------------------
    // STEP 2: FIND EXPIRING FOOD
    // ------------------------------------------

    // Call the service to retrieve food items that
    // meet the expiration criteria for this period.
    const foods =
      await getExpiringFood(days);


    // ------------------------------------------
    // STEP 3: RETURN THE RESULTS
    // ------------------------------------------

    // Return the requested time period, the number
    // of matching items, and the items themselves.
    //
    // foods.length tells the frontend how many items
    // were returned.
    res.status(200).json({
      days,
      count: foods.length,
      items: foods
    });


  } catch (error) {

    // Log the error for backend troubleshooting.
    console.error(
      "Error getting expiring food:",
      error
    );

    // Tell the frontend that expiration information
    // could not be retrieved.
    res.status(500).json({
      error: "Unable to retrieve expiration information"
    });

  }

};


// ==========================================
//              ADD FOOD ITEM
// ==========================================

// HTTP endpoint: POST /inventory
//
// PURPOSE:
// Validate incoming food information, save the new
// inventory item, and return the created item.
//
// EXPECTED REQUEST BODY EXAMPLE:
// {
//   "name": "Rice",
//   "quantity": 10
// }
//
// The exact accepted fields depend on inventoryService.js
// and the inventory data model.

exports.addFood = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: READ THE REQUEST BODY
    // ------------------------------------------

    // Extract the food name and quantity from the
    // JSON data sent by the React frontend.
    const { name, quantity } = req.body;


    // ------------------------------------------
    // STEP 2: VALIDATE THE FOOD NAME
    // ------------------------------------------

    // A food name must:
    // 1. Be provided.
    // 2. Be a string.
    // 3. Contain at least one non-whitespace character.
    //
    // Return HTTP 400 if the name is invalid.
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        error: "Food name is required"
      });
    }


    // ------------------------------------------
    // STEP 3: VALIDATE THE QUANTITY
    // ------------------------------------------

    // Convert the supplied quantity to a number.
    // This allows numeric strings such as "10".
    const qty = Number(quantity);

    // Reject missing, empty, non-numeric, or negative
    // quantities.
    //
    // Zero is allowed because a food item can have
    // zero units remaining in the inventory.
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


    // ------------------------------------------
    // STEP 4: SAVE THE FOOD ITEM
    // ------------------------------------------

    // Send the request body to the inventory service.
    // The service is responsible for creating and saving
    // the new inventory record.
    //
    // The returned newItem should contain the saved
    // food item's information.
    const newItem = await addFoodItem(req.body);


    // ------------------------------------------
    // STEP 5: RETURN THE CREATED ITEM
    // ------------------------------------------

    // HTTP 201 indicates that a new resource was created.
    //
    // Return a confirmation message and the saved item
    // so the frontend can update its inventory display.
    return res.status(201).json({
      message: "Food item added",
      item: newItem
    });


  } catch (error) {

    // ------------------------------------------
    // STEP 6: HANDLE SAVE ERRORS
    // ------------------------------------------

    // Log the full error to help identify problems
    // with the inventory service or database.
    console.error("Error adding food:", error);

    // Return a generic error response to the frontend.
    return res.status(500).json({
      error: "Unable to add food item"
    });

  }

};
