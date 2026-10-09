// inventoryService.js

// Import the Firestore database.
const { db } = require("../config/firebase");


// ==========================================
//           GET ALL INVENTORY
// ==========================================

async function getInventory() {

  // Get all documents from the inventory collection.
  const snapshot =
    await db.collection("inventory").get();

  // Convert Firestore documents into JavaScript objects.
  return snapshot.docs.map(doc => ({

    // Include the Firestore document ID.
    id: doc.id,

    // Include the stored food information.
    ...doc.data()

  }));

}


// ==========================================
//           GET ONE FOOD ITEM
// ==========================================

async function getFoodById(foodId) {

  // Find the food document.
  const doc =
    await db.collection("inventory")
      .doc(foodId)
      .get();

  // Return null if the food doesn't exist.
  if (!doc.exists) {
    return null;
  }

  // Return the food item.
  return {
    id: doc.id,
    ...doc.data()
  };

}


// ==========================================
//        DETERMINE FOOD STATUS
// ==========================================

function getFoodStatus(food) {

  // Check whether the item is below
  // its low-stock threshold.
  const lowStock =
    food.quantity <=
    (food.lowStockThreshold || 10);

  // If the food is low, return LOW.
  if (lowStock) {
    return "LOW";
  }

  // If there is no expiration date,
  // we cannot calculate expiration status.
  if (!food.expirationDate) {
    return "OK";
  }

  // Get today's date.
  const today = new Date();

  // Convert expiration date to a Date object.
  const expiration =
    new Date(food.expirationDate);

  // Calculate the difference in milliseconds.
  const difference =
    expiration.getTime() - today.getTime();

  // Convert milliseconds to days.
  const daysRemaining =
    Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

  // Food is already expired.
  if (daysRemaining < 0) {
    return "EXPIRED";
  }

  // Food expires within seven days.
  if (daysRemaining <= 7) {
    return "EXPIRING";
  }

  // Otherwise the food is okay.
  return "OK";
}


// ==========================================
//          GET EXPIRING FOOD
// ==========================================

async function getExpiringFood(days = 7) {

  // Get all inventory.
  const foods = await getInventory();

  // Today's date.
  const today = new Date();

  // Find foods expiring within the requested
  // number of days.
  return foods.filter(food => {

    // Skip items without expiration dates.
    if (!food.expirationDate) {
      return false;
    }

    const expiration =
      new Date(food.expirationDate);

    const difference =
      expiration.getTime() -
      today.getTime();

    const daysRemaining =
      Math.ceil(
        difference / (1000 * 60 * 60 * 24)
      );

    return (
      daysRemaining >= 0 &&
      daysRemaining <= days
    );

  });

}


// Export the functions so controllers
// can use them.
module.exports = {
  getInventory,
  getFoodById,
  getFoodStatus,
  getExpiringFood
};