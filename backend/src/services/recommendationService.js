// recommendationService.js

// Import Firestore.
const { db } = require("../config/firebase");


// ==========================================
//        GET FOOD RECOMMENDATIONS
// ==========================================

async function getRecommendations(userId) {

  // Get the user's profile.
  const userDoc =
    await db
      .collection("users")
      .doc(userId)
      .get();


  // Get all inventory.
  const inventorySnapshot =
    await db
      .collection("inventory")
      .get();


  // Read user preferences.
  const user =
    userDoc.exists
      ? userDoc.data()
      : {};


  const allergies =
    user.allergies || [];


  const restrictions =
    user.dietaryRestrictions || [];


  // Convert inventory into an array.
  const foods =
    inventorySnapshot.docs.map(
      doc => ({
        id: doc.id,
        ...doc.data()
      })
    );


  // Filter foods that are available.
  const availableFoods =
    foods.filter(
      food =>
        Number(food.quantity) > 0
    );


  // Filter foods according to basic
  // dietary preferences.
  const recommendations =
    availableFoods.filter(food => {

      const foodAllergens =
        food.allergens || [];


      // Check allergies.
      const hasAllergy =
        allergies.some(
          allergy =>
            foodAllergens
              .map(item =>
                String(item).toLowerCase()
              )
              .includes(
                String(allergy).toLowerCase()
              )
        );


      if (hasAllergy) {
        return false;
      }


      // Basic vegetarian check.
      if (
        restrictions
          .map(item =>
            String(item).toLowerCase()
          )
          .includes("vegetarian")
      ) {

        if (food.isVegetarian === false) {
          return false;
        }

      }


      return true;

    });


  // Return the recommendations.
  return recommendations;

}


// Export service.
module.exports = {
  getRecommendations
};