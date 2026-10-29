

/*
===========================================================
 INVENTORY SERVICE

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


// Import Firestore database access and Firebase Admin.
//
// db:
// Used to read and write inventory documents.
//
// admin:
// Provides Firestore utilities, including server timestamps.
const { db, admin } = require("../config/firebase");


// ==========================================
//          GET ALL INVENTORY ITEMS
// ==========================================

// Retrieve all documents from the inventory collection.
//
// Returns an array of food objects. Each object includes
// the Firestore document ID and the fields stored in Firestore.
//
// IMPORTANT:
// This currently retrieves every document in the collection.
// It does not filter records by userId.
async function getInventory() {

  // Read all documents from the inventory collection.
  const snapshot = await db.collection("inventory").get();


  // Convert Firestore documents into ordinary JavaScript
  // objects so controllers and services can use the data.
  //
  // doc.id provides the Firestore document ID.
  // doc.data() provides the saved food fields.
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
// foodId - the document ID of the requested food item.
//
// Returns:
// The food item if it exists, otherwise null.
//
// IMPORTANT:
// This function checks whether the document exists but
// does not verify which user owns the item.
async function getFoodById(foodId) {

  // Find the inventory document using its ID.
  const doc = await db.collection("inventory").doc(foodId).get();


  // Return null when the document does not exist.
  if (!doc.exists) {
    return null;
  }


  // Return the document ID and its saved food information.
  return {
    id: doc.id,
    ...doc.data(),
  };
}


// ==========================================
//          CALCULATE FOOD STATUS
// ==========================================

// Determine whether an inventory item is:
// - LOW: quantity is at or below the low-stock threshold.
// - EXPIRED: expiration date has passed.
// - EXPIRING: expiration is within the next seven days.
// - OK: no other status condition applies.
//
// Parameter:
// food - an inventory object from Firestore.
//
// Returns:
// A status string used by the inventory and dashboard pages.
function getFoodStatus(food) {

  // Convert quantity to a number.
  // If quantity is missing or invalid, use zero.
  const quantity = Number(food.quantity) || 0;


  // Read the low-stock threshold.
  // If it is missing or evaluates to zero, default to 10.
  const threshold = Number(food.lowStockThreshold) || 10;


  // Low stock takes priority over expiration status.
  // An item that is low and expired will be marked LOW.
  if (quantity <= threshold) {
    return "LOW";
  }


  // If there is no expiration date, the item is not flagged
  // as expiring or expired.
  if (!food.expirationDate) {
    return "OK";
  }


  // Set today's time to midnight so comparisons use calendar
  // days rather than the current time of day.
  const today = new Date();
  today.setHours(0, 0, 0, 0);


  // Convert a YYYY-MM-DD date string into a Date object.
  // This expects expirationDate to be stored as a date string.
  const expiration = new Date(`${food.expirationDate}T00:00:00`);


  // If the date is invalid, avoid generating a false alert.
  if (Number.isNaN(expiration.getTime())) {
    return "OK";
  }


  // Calculate how many calendar days remain until expiration.
  const daysRemaining = Math.ceil(
    (expiration.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );


  // Mark an item EXPIRED if its expiration date is before today.
  if (daysRemaining < 0) {
    return "EXPIRED";
  }


  // Mark an item EXPIRING if it expires today or within seven
  // days, inclusive.
  if (daysRemaining <= 7) {
    return "EXPIRING";
  }


  // The item is not low, expired, or expiring soon.
  return "OK";
}


// ==========================================
//          GET EXPIRING FOOD
// ==========================================

// Retrieve food items expiring within the requested number
// of days.
//
// Parameter:
// days - the forecast window, defaulting to seven days.
//
// Returns:
// An array of food items whose expiration dates are today
// or within the requested number of days.
//
// Note:
// This function excludes items that are already expired.
async function getExpiringFood(days = 7) {

  // Retrieve the inventory records.
  const foods = await getInventory();


  // Keep only foods with a valid expiration date within
  // the requested date range.
  return foods.filter((food) => {

    // Ignore items without an expiration date.
    if (!food.expirationDate) {
      return false;
    }


    // Normalize today's date to midnight for calendar-day
    // comparisons.
    const today = new Date();
    today.setHours(0, 0, 0, 0);


    // Parse the saved expiration date.
    const expiration = new Date(`${food.expirationDate}T00:00:00`);


    // Ignore malformed expiration dates.
    if (Number.isNaN(expiration.getTime())) {
      return false;
    }


    // Calculate the number of days remaining.
    const daysRemaining = Math.ceil(
      (expiration.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );


    // Include items expiring today through the requested
    // number of days. Exclude expired items.
    return daysRemaining >= 0 && daysRemaining <= days;
  });
}


// ==========================================
//          ADD INVENTORY ITEM
// ==========================================

// Save a new food item in Firestore.
//
// Parameter:
// food - an object containing the submitted food details.
//
// Returns:
// The new Firestore document ID and the saved field values.
//
// IMPORTANT:
// This function currently does not store a userId. If each
// user should have a private inventory, the authenticated
// user's UID must be passed into this function and saved.
async function addFoodItem(food) {

  // Prepare and normalize the fields stored for the food item.
  const fields = {

    // Required inventory fields.
    // Convert the name to a trimmed string and quantity
    // to a number.
    name: String(food.name).trim(),
    quantity: Number(food.quantity),


    // Store weight as text so different units are supported.
    // Examples: "500 g", "2 lb", or "1 kg".
    weight: food.weight ? String(food.weight).trim() : "",


    // Store shelf life as a number of days.
    // Leave it null when the field is empty or missing.
    shelfLife:
      food.shelfLife !== "" &&
      food.shelfLife !== undefined &&
      food.shelfLife !== null
        ? Number(food.shelfLife)
        : null,


    // Store the food category.
    // Use "Other" when no category is supplied.
    type: food.type ? String(food.type).trim() : "Other",


    // Nutrition values.
    // Default missing or invalid numeric values to zero.
    calories: Number(food.calories) || 0,
    protein: Number(food.protein) || 0,
    carbs: Number(food.carbs) || 0,
    fat: Number(food.fat) || 0,


    // Set the low-stock threshold.
    // Default to 10 if the value is missing or empty.
    lowStockThreshold:
      food.lowStockThreshold !== undefined &&
      food.lowStockThreshold !== ""
        ? Number(food.lowStockThreshold)
        : 10,


    // Store the expiration date, or null if none was provided.
    expirationDate: food.expirationDate || null,


    // Store dietary preference information.
    // Null means the preference is unknown or unspecified.
    isVegetarian: food.isVegetarian ?? null,
    isVegan: food.isVegan ?? null,


    // Store allergens as an array.
    // Use an empty array if the submitted value is not an array.
    allergens: Array.isArray(food.allergens) ? food.allergens : [],
  };


  // Create a new document in the inventory collection.
  // Firestore generates a unique document ID.
  //
  // createdAt records the time the document is written
  // using Firestore's server timestamp.
  const docRef = await db.collection("inventory").add({
    ...fields,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });


  // Return the new document ID and the normalized fields.
  // This is useful for sending the created item to the frontend.
  return {
    id: docRef.id,
    ...fields,
  };
}


// ==========================================
//              EXPORT FUNCTIONS
// ==========================================

// Make these functions available to controllers and services.
module.exports = {
  getInventory,
  getFoodById,
  getFoodStatus,
  getExpiringFood,
  addFoodItem,
};
