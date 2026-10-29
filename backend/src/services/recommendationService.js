
/*
===========================================================
 RECOMMENDATION SERVICE

 PURPOSE:
 1. Retrieve the user's profile and food preferences.
 2. Read food inventory from Firestore.
 3. Exclude foods that are out of stock.
 4. Filter foods that conflict with the user's allergies.
 5. Apply basic dietary restrictions.
 6. Return the remaining recommended foods.

 USED BY:
 recommendationController.js

 FIRESTORE COLLECTIONS:
 - users
 - inventory

 IMPORTANT:
 This version reads the entire inventory collection.
 If inventory is private to each user, filter records by
 the authenticated user's UID before returning recommendations.
===========================================================
*/


// Import the Firestore database connection.
const { db } = require("../config/firebase");


// ==========================================
//        GET FOOD RECOMMENDATIONS
// ==========================================

// Generate food recommendations based on the user's profile
// and the food currently available in inventory.
//
// Parameter:
// userId - the authenticated user's Firebase UID.
//
// Returns:
// An array of food items that pass the availability and
// supported dietary preference checks.
async function getRecommendations(userId) {

  // ----------------------------------------
  // 1. Retrieve the user's profile
  // ----------------------------------------

  // Find the profile document using the user's Firebase UID.
  const userDoc =
    await db
      .collection("users")
      .doc(userId)
      .get();


  // ----------------------------------------
  // 2. Retrieve inventory
  // ----------------------------------------

  // Read all documents in the inventory collection.
  //
  // IMPORTANT:
  // This does not currently filter by userId. If inventory
  // belongs to individual users, this query must be updated
  // to retrieve only the correct user's inventory.
  const inventorySnapshot =
    await db
      .collection("inventory")
      .get();


  // ----------------------------------------
  // 3. Read user preferences
  // ----------------------------------------

  // Use the saved profile if it exists.
  // Otherwise, use an empty object so missing profiles
  // do not cause an immediate error.
  const user =
    userDoc.exists
      ? userDoc.data()
      : {};


  // Read the user's allergy list.
  // Example: ["peanuts", "shellfish"].
  const allergies =
    Array.isArray(user.allergies)
      ? user.allergies
      : [];


  // Read the user's dietary restrictions.
  // Example: ["vegetarian"].
  const restrictions =
    Array.isArray(user.dietaryRestrictions)
      ? user.dietaryRestrictions
      : [];


  // ----------------------------------------
  // 4. Convert Firestore documents to objects
  // ----------------------------------------

  // Convert each Firestore document into a JavaScript object.
  // Include the Firestore document ID as the food's id.
  const foods =
    inventorySnapshot.docs.map(
      doc => ({
        id: doc.id,
        ...doc.data()
      })
    );


  // ----------------------------------------
  // 5. Remove unavailable foods
  // ----------------------------------------

  // Keep foods whose quantity is greater than zero.
  // Items with zero, negative, or nonnumeric quantities
  // will not be recommended.
  const availableFoods =
    foods.filter(
      food =>
        Number(food.quantity) > 0
    );


  // ----------------------------------------
  // 6. Apply dietary preference filters
  // ----------------------------------------

  // Examine each available food item and keep it only if
  // it passes the supported allergy and vegetarian checks.
  const recommendations =
    availableFoods.filter(food => {

      // Read the allergens associated with this food.
      // Use an empty array if the field is missing.
      const foodAllergens =
        Array.isArray(food.allergens)
          ? food.allergens
          : [];


      // Normalize food allergen names to lowercase strings.
      // This makes comparisons case-insensitive.
      const normalizedFoodAllergens =
        foodAllergens.map(
          item => String(item).toLowerCase().trim()
        );


      // Check whether any user allergy matches an allergen
      // listed for this food.
      const hasAllergy =
        allergies.some(
          allergy =>
            normalizedFoodAllergens.includes(
              String(allergy).toLowerCase().trim()
            )
        );


      // Exclude the food if an allergy matches.
      if (hasAllergy) {
        return false;
      }


      // ----------------------------------------
      // Vegetarian restriction
      // ----------------------------------------

      // Normalize dietary restriction names so the
      // comparison is case-insensitive.
      const normalizedRestrictions =
        restrictions.map(
          item => String(item).toLowerCase().trim()
        );


      // If the user follows a vegetarian diet, exclude foods
      // explicitly marked as non-vegetarian.
      //
      // This preserves the existing behavior:
      // a food with isVegetarian missing or null is not
      // automatically excluded.
      if (
        normalizedRestrictions.includes("vegetarian")
      ) {

        if (food.isVegetarian === false) {
          return false;
        }

      }


      // The food passed all currently implemented filters.
      return true;

    });


  // ----------------------------------------
  // 7. Return recommendations
  // ----------------------------------------

  // Return the recommended foods to recommendationController.
  // The controller sends them to the frontend as JSON.
  return recommendations;

}


// ==========================================
//              EXPORT SERVICE
// ==========================================

// Allow other backend files to import this function.
module.exports = {
  getRecommendations
};
