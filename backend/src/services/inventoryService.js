

/*
===========================================================
 SPACEBYTE - INVENTORY SERVICE
 File: backend/src/services/inventoryService.js

 PURPOSE:
 1. Read inventory items from Firestore.
 2. Retrieve individual food items.
 3. Calculate inventory status.
 4. Find items approaching expiration.
 5. Save food details, including weight, shelf life,
    expiration date, nutrition, and food type.

 USED BY:
 - inventoryController.js
 - dashboardService.js
 - mealPlanController.js
 - Other services that need inventory data

 IMPORTANT:
 The current functions read and write the shared inventory
 collection without filtering by user ID. See the notes
 following this code before using private user inventories.
===========================================================
*/


// ==========================================
//          IMPORT FIREBASE
// ==========================================

// Import Firestore database access and Firebase Admin.
//
// db:
// Used to read and write inventory documents.
//
// admin:
// Provides Firebase Admin utilities, including
// Firestore server timestamps.
const { db, admin } = require("../config/firebase");


// ==========================================
//          GET ALL INVENTORY ITEMS
// ==========================================

// Retrieve all documents from the Firestore inventory collection.
//
// Returns:
// An array of food objects. Each object includes the
// Firestore document ID and the fields stored in Firestore.
//
// IMPORTANT:
// This currently retrieves every document in the collection.
// It does not filter records by userId.
async function getInventory() {

  // Read all documents from the inventory collection.
  const snapshot = await db.collection("inventory").get();


  // Convert Firestore documents into ordinary JavaScript objects.
  //
  // doc.id provides the Firestore document ID.
  // doc.data() provides the saved food information.
  //
  // map() creates a new array containing all inventory records.
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}


// ==========================================
//          GET ONE FOOD ITEM
// ==========================================

// Retrieve one food item using its Firestore document ID.
//
// Parameter:
// foodId - The document ID of the requested food item.
//
// Returns:
// The food item if it exists, otherwise null.
//
// IMPORTANT:
// This function checks whether the document exists but
// does not verify which user owns the item.
async function getFoodById(foodId) {

  // Find the inventory document using its document ID.
  const doc = await db.collection("inventory").doc(foodId).get();


  // Return null if the requested document does not exist.
  if (!doc.exists) {
    return null;
  }


  // Return the document ID along with its saved food information.
  return {
    id: doc.id,
    ...doc.data(),
  };
}


// ==========================================
//          CALCULATE FOOD STATUS
// ==========================================

// Determine the current status of an inventory item.
//
// Possible statuses:
// LOW      - Quantity is at or below the low-stock threshold.
// EXPIRED  - The expiration date has passed.
// EXPIRING - The expiration date is within the next seven days.
// OK       - None of the other status conditions apply.
//
// Parameter:
// food - An inventory object retrieved from Firestore.
//
// Returns:
// A status string used by the inventory and dashboard pages.
function getFoodStatus(food) {

  // Convert the inventory quantity into a number.
  //
  // If quantity is missing or invalid, use zero.
  const quantity = Number(food.quantity) || 0;


  // Read the low-stock threshold from the food document.
  //
  // If the threshold is missing or evaluates to zero,
  // use 10 as the default threshold.
  const threshold = Number(food.lowStockThreshold) || 10;


  // Check whether the inventory quantity is low.
  //
  // Low stock takes priority over expiration status.
  // An item that is both low and expired will be marked LOW.
  if (quantity <= threshold) {
    return "LOW";
  }


  // If the food has no expiration date, it cannot be
  // classified as expiring or expired.
  if (!food.expirationDate) {
    return "OK";
  }


  // Get today's date.
  //
  // Setting the time to midnight ensures that comparisons
  // use calendar days instead of the current time of day.
  const today = new Date();
  today.setHours(0, 0, 0, 0);


  // Convert the stored expiration date into a JavaScript Date.
  //
  // This expects expirationDate to be stored as a
  // YYYY-MM-DD date string.
  const expiration = new Date(`${food.expirationDate}T00:00:00`);


  // Check whether the expiration date is valid.
  //
  // If the date is invalid, return OK rather than
  // generating an incorrect expiration alert.
  if (Number.isNaN(expiration.getTime())) {
    return "OK";
  }


  // Calculate the number of calendar days remaining
  // until the food reaches its expiration date.
  //
  // 1000 = milliseconds per second.
  // 60   = seconds per minute.
  // 60   = minutes per hour.
  // 24   = hours per day.
  const daysRemaining = Math.ceil(
    (expiration.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );


  // Mark the food as EXPIRED if its expiration date
  // occurred before today's date.
  if (daysRemaining < 0) {
    return "EXPIRED";
  }


  // Mark the food as EXPIRING if it expires today
  // or within the next seven days.
  if (daysRemaining <= 7) {
    return "EXPIRING";
  }


  // If none of the previous conditions apply,
  // the food is considered safe according to this
  // inventory status calculation.
  return "OK";
}


// ==========================================
//          GET EXPIRING FOOD
// ==========================================

// Retrieve food items expiring within a requested
// number of days.
//
// Parameter:
// days - The expiration forecast window.
//        Defaults to seven days.
//
// Returns:
// An array of food items whose expiration dates
// are today or within the requested number of days.
//
// NOTE:
// This function excludes items that are already expired.
async function getExpiringFood(days = 7) {

  // Retrieve all inventory records from Firestore.
  const foods = await getInventory();


  // Filter the inventory list to keep only food items
  // with valid expiration dates inside the requested window.
  return foods.filter((food) => {

    // Ignore food items that do not have an expiration date.
    if (!food.expirationDate) {
      return false;
    }


    // Get today's date and normalize the time to midnight.
    // This allows accurate calendar-day comparisons.
    const today = new Date();
    today.setHours(0, 0, 0, 0);


    // Convert the saved expiration date into a JavaScript Date.
    const expiration = new Date(`${food.expirationDate}T00:00:00`);


    // Ignore expiration dates that cannot be parsed.
    if (Number.isNaN(expiration.getTime())) {
      return false;
    }


    // Calculate how many days remain until expiration.
    const daysRemaining = Math.ceil(
      (expiration.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );


    // Include items expiring today through the requested
    // number of days.
    //
    // Items with negative daysRemaining are already expired
    // and are excluded from this result.
    return daysRemaining >= 0 && daysRemaining <= days;
  });
}


// ==========================================
//          ADD INVENTORY ITEM
// ==========================================

// Save a new food item in the Firestore inventory collection.
//
// Parameter:
// food - An object containing the submitted food details.
//
// Returns:
// The new Firestore document ID and the normalized field values.
//
// IMPORTANT:
// This function currently does not store a userId.
// If each user should have a private inventory, the
// authenticated user's UID must be passed into this function
// and saved with the inventory document.
async function addFoodItem(food) {

  // ----------------------------------------
  // PREPARE INVENTORY FIELDS
  // ----------------------------------------

  // Create an object containing the food information
  // that will be saved in Firestore.
  //
  // The values are normalized to help maintain consistent
  // data types throughout the application.
  const fields = {

    // ----------------------------------------
    // BASIC FOOD INFORMATION
    // ----------------------------------------

    // Save the food name as a trimmed string.
    name: String(food.name).trim(),

    // Convert the inventory quantity into a number.
    quantity: Number(food.quantity),


    // ----------------------------------------
    // WEIGHT AND SHELF LIFE
    // ----------------------------------------

    // Store weight as text to support different measurement units.
    //
    // Examples:
    // "500 g"
    // "2 lb"
    // "1 kg"
    //
    // If no weight is provided, save an empty string.
    weight: food.weight ? String(food.weight).trim() : "",


    // Store shelf life as a number of days.
    //
    // If the field is empty or missing, save null.
    shelfLife:
      food.shelfLife !== "" &&
      food.shelfLife !== undefined &&
      food.shelfLife !== null
        ? Number(food.shelfLife)
        : null,


    // ----------------------------------------
    // FOOD CATEGORY
    // ----------------------------------------

    // Save the food category or default to "Other"
    // when no category is provided.
    type: food.type ? String(food.type).trim() : "Other",


    // ----------------------------------------
    // NUTRITION INFORMATION
    // ----------------------------------------

    // Save the calorie information.
    // Use zero if the value is missing or invalid.
    calories: Number(food.calories) || 0,

    // Save the protein information.
    protein: Number(food.protein) || 0,

    // Save the carbohydrate information.
    carbs: Number(food.carbs) || 0,

    // Save the fat information.
    fat: Number(food.fat) || 0,


    // ----------------------------------------
    // LOW-STOCK SETTINGS
    // ----------------------------------------

    // Save the minimum quantity that should trigger
    // a low-stock warning.
    //
    // Default to 10 when the value is missing or empty.
    lowStockThreshold:
      food.lowStockThreshold !== undefined &&
      food.lowStockThreshold !== ""
        ? Number(food.lowStockThreshold)
        : 10,


    // ----------------------------------------
    // EXPIRATION INFORMATION
    // ----------------------------------------

    // Save the expiration date.
    // If no expiration date is supplied, save null.
    expirationDate: food.expirationDate || null,


    // ----------------------------------------
    // DIETARY INFORMATION
    // ----------------------------------------

    // Indicate whether the food is vegetarian.
    // Null means the information is unspecified.
    isVegetarian: food.isVegetarian ?? null,

    // Indicate whether the food is vegan.
    // Null means the information is unspecified.
    isVegan: food.isVegan ?? null,


    // Save allergens as an array.
    //
    // Array.isArray checks that the submitted allergens
    // value is an actual array.
    //
    // If it is not an array, save an empty array.
    allergens: Array.isArray(food.allergens) ? food.allergens : [],
  };


  // ----------------------------------------
  // SAVE FOOD ITEM TO FIRESTORE
  // ----------------------------------------

  // Create a new document in the inventory collection.
  //
  // Firestore automatically generates a unique document ID.
  //
  // The spread operator (...fields) adds all normalized
  // food information to the new document.
  //
  // createdAt records when the item was saved.
  // serverTimestamp() uses the Firestore server's time.
  const docRef = await db.collection("inventory").add({
    ...fields,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });


  // ----------------------------------------
  // RETURN SAVED FOOD INFORMATION
  // ----------------------------------------

  // Return the new Firestore document ID
  // together with the normalized food information.
  //
  // The controller can use this object to send
  // the newly created inventory item to the frontend.
  return {
    id: docRef.id,
    ...fields,
  };
}


// ==========================================
//            DELETE A FOOD ITEM
// ==========================================

// Permanently remove one inventory item.
//
// Parameter:
// foodId - The Firestore document ID of the item.
//
// Returns:
// true if the item was deleted, false if it did not exist.
async function deleteFoodItem(foodId) {

  const docRef = db.collection("inventory").doc(foodId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return false;
  }

  await docRef.delete();
  return true;
}


// ==========================================
//              EXPORT FUNCTIONS
// ==========================================

// Export the inventory service functions so they
// can be imported and used by controllers and other services.
//
// getInventory:
// Retrieves all inventory records.
//
// getFoodById:
// Retrieves one inventory item.
//
// getFoodStatus:
// Calculates an inventory item's current status.
//
// getExpiringFood:
// Finds items approaching expiration.
//
// addFoodItem:
// Saves a new food item in Firestore.
//
// deleteFoodItem:
// Removes a food item from Firestore.
module.exports = {
  getInventory,
  getFoodById,
  getFoodStatus,
  getExpiringFood,
  addFoodItem,
  deleteFoodItem,
};
