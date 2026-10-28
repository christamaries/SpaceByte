
/*
===========================================================
 SPACEBYTE - INVENTORY SERVICE
 File: backend/src/services/inventoryService.js

 PURPOSE:
 1. Read inventory from Firestore.
 2. Calculate inventory status.
 3. Find items approaching expiration.
 4. Save food details, including weight, shelf life,
    expiration date, and food type.
===========================================================
*/

const { db, admin } = require("../config/firebase");

// Get all inventory items.
async function getInventory() {
  const snapshot = await db.collection("inventory").get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Get one inventory item by its Firestore document ID.
async function getFoodById(foodId) {
  const doc = await db.collection("inventory").doc(foodId).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  };
}

// Calculate whether an item is low, expiring, or expired.
function getFoodStatus(food) {
  const quantity = Number(food.quantity) || 0;
  const threshold = Number(food.lowStockThreshold) || 10;

  // Low stock takes priority over expiration status.
  if (quantity <= threshold) {
    return "LOW";
  }

  if (!food.expirationDate) {
    return "OK";
  }

  // Compare calendar dates to avoid time-of-day surprises.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiration = new Date(`${food.expirationDate}T00:00:00`);

  if (Number.isNaN(expiration.getTime())) {
    return "OK";
  }

  const daysRemaining = Math.ceil(
    (expiration.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0) {
    return "EXPIRED";
  }

  if (daysRemaining <= 7) {
    return "EXPIRING";
  }

  return "OK";
}

// Get items that expire within the next requested number of days.
async function getExpiringFood(days = 7) {
  const foods = await getInventory();

  return foods.filter((food) => {
    if (!food.expirationDate) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiration = new Date(`${food.expirationDate}T00:00:00`);

    if (Number.isNaN(expiration.getTime())) {
      return false;
    }

    const daysRemaining = Math.ceil(
      (expiration.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return daysRemaining >= 0 && daysRemaining <= days;
  });
}

// Add an inventory item to Firestore.
async function addFoodItem(food) {
  const fields = {
    // Required inventory fields.
    name: String(food.name).trim(),
    quantity: Number(food.quantity),

    // New inventory fields.
    // Weight is text so values such as "500 g" or "2 lb"
    // can be stored without forcing a particular unit.
    weight: food.weight ? String(food.weight).trim() : "",

    // Shelf life is stored as a number of days.
    shelfLife:
      food.shelfLife !== "" &&
      food.shelfLife !== undefined &&
      food.shelfLife !== null
        ? Number(food.shelfLife)
        : null,

    // Example types: Perishable, Non-perishable,
    // Freeze-dried, Dry goods, Frozen, Other.
    type: food.type ? String(food.type).trim() : "Other",

    // Existing nutrition information is preserved.
    calories: Number(food.calories) || 0,
    protein: Number(food.protein) || 0,
    carbs: Number(food.carbs) || 0,
    fat: Number(food.fat) || 0,

    lowStockThreshold:
      food.lowStockThreshold !== undefined &&
      food.lowStockThreshold !== ""
        ? Number(food.lowStockThreshold)
        : 10,

    expirationDate: food.expirationDate || null,

    isVegetarian: food.isVegetarian ?? null,
    isVegan: food.isVegan ?? null,

    allergens: Array.isArray(food.allergens) ? food.allergens : [],
  };

  const docRef = await db.collection("inventory").add({
    ...fields,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    id: docRef.id,
    ...fields,
  };
}

module.exports = {
  getInventory,
  getFoodById,
  getFoodStatus,
  getExpiringFood,
  addFoodItem,
};
