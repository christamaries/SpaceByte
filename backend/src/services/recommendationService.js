

/*
===========================================================
 SPACEBYTE - RECOMMENDATION SERVICE
 File: backend/src/services/recommendationService.js

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

/**
 * Generate food recommendations based on the user's
 * profile, dietary preferences, allergies, and inventory.
 *
 * @param {string} userId - Authenticated user's Firebase UID.
 *
 * Returns:
 * An array of food items that pass the availability and
 * supported dietary preference checks.
 */
async function getRecommendations(userId) {

  // ----------------------------------------
  // 1. RETRIEVE THE USER'S PROFILE
  // ----------------------------------------

  // Find the user's profile document using their Firebase UID.
  // The UID identifies the user's document in the users collection.
  const userDoc =
    await db
      .collection("users")
      .doc(userId)
      .get();


  // ----------------------------------------
  // 2. RETRIEVE FOOD INVENTORY
  // ----------------------------------------

  // Read all documents in the inventory collection.
  //
  // IMPORTANT:
  // This query currently retrieves inventory belonging to
  // every user because it does not filter by userId.
  //
  // If inventory belongs to individual users, this query
  // must be updated to retrieve only the authenticated
  // user's inventory.
  const inventorySnapshot =
    await db
      .collection("inventory")
      .get();


  // ----------------------------------------
  // 3. READ USER PREFERENCES
  // ----------------------------------------

  // Use the saved profile if it exists.
  // Otherwise, use an empty object so a missing profile
  // does not cause an immediate error.
  const user =
    userDoc.exists
      ? userDoc.data()
      : {};


  // Read the user's allergy list.
  //
  // Example:
  // allergies = ["peanuts", "shellfish"]
  //
  // Use an empty array if no allergies are saved.
  const allergies =
    Array.isArray(user.allergies)
      ? user.allergies
      : [];


  // Read the user's dietary restrictions.
  //
  // Example:
  // restrictions = ["vegetarian"]
  //
  // Use an empty array if no restrictions are saved.
  const restrictions =
    Array.isArray(user.dietaryRestrictions)
      ? user.dietaryRestrictions
      : [];


  // ----------------------------------------
  // 4. CONVERT FIRESTORE DOCUMENTS TO OBJECTS
  // ----------------------------------------

  // Convert each Firestore inventory document into
  // a regular JavaScript object.
  //
  // Include the Firestore document ID as the food's id.
  // The frontend can use this ID to identify individual foods.
  const foods =
    inventorySnapshot.docs.map(
      doc => ({
        id: doc.id,
        ...doc.data()
      })
    );


  // ----------------------------------------
  // 5. REMOVE UNAVAILABLE FOODS
  // ----------------------------------------

  // Keep foods whose quantity is greater than zero.
  //
  // Items with zero, negative, or nonnumeric quantities
  // will not be recommended.
  const availableFoods =
    foods.filter(
      food =>
        Number(food.quantity) > 0
    );


  // ----------------------------------------
  // 6. APPLY DIETARY PREFERENCE FILTERS
  // ----------------------------------------

  // Examine each available food item.
  // Keep it only if it passes the supported allergy
  // and vegetarian restriction checks.
  const recommendations =
    availableFoods.filter(food => {

      // ----------------------------------------
      // CHECK FOOD ALLERGENS
      // ----------------------------------------

      // Read the allergens associated with this food.
      // Use an empty array if the field is missing.
      const foodAllergens =
        Array.isArray(food.allergens)
          ? food.allergens
          : [];


      // Normalize allergen names to lowercase strings.
      //
      // This makes comparisons case-insensitive.
      // For example, "Peanuts" and "peanuts" will match.
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
      // CHECK VEGETARIAN RESTRICTION
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
      // Existing behavior is preserved:
      // a food with isVegetarian missing or null is not
      // automatically excluded.
      if (
        normalizedRestrictions.includes("vegetarian")
      ) {

        // Exclude foods explicitly identified as non-vegetarian.
        if (food.isVegetarian === false) {
          return false;
        }

      }


      // The food passed all currently implemented filters.
      // Keep it in the recommendations array.
      return true;

    });


  // ----------------------------------------
  // 7. RETURN FOOD RECOMMENDATIONS
  // ----------------------------------------

  // Return the recommended foods to recommendationController.
  // The controller sends these results to the frontend as JSON.
  return recommendations;

}


// ==========================================
//              EXPORT SERVICE
// ==========================================

// Allow other backend files to import this function.
module.exports = {
  getRecommendations
};
