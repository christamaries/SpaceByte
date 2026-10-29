
/*
===========================================================
 NUTRITION CONTROLLER
 

 PURPOSE:
 1. Retrieve nutrition information for a specific food item.
 2. Calculate the authenticated user's nutrition for today.
 3. Return calories, protein, carbohydrates, and fat.
 4. Calculate progress toward the daily calorie target.
 5. Return JSON responses to the React frontend.
 6. Handle errors during nutrition requests.

 FIRESTORE COLLECTION:
 - inventory: Stores food items and their nutrition values.

 RELATED SERVICE:
 - nutritionService.js calculates nutrition from consumption
   records and provides today's nutrition totals.

 DAILY CALORIE TARGET:
 - 2800 calories.

===========================================================
*/


// ==========================================
//       IMPORT NUTRITION SERVICE FUNCTIONS
// ==========================================

// Import getTodayNutrition from nutritionService.js.
//
// The alias calculateTodayNutrition makes its purpose
// clearer inside this controller.
//
// The service performs the actual nutrition calculations.
// This controller handles the HTTP request and response.
const {
  getTodayNutrition: calculateTodayNutrition,
} = require("../services/nutritionService");


// ==========================================
//        IMPORT FIRESTORE CONNECTION
// ==========================================

// Import the initialized Firestore database connection.
//
// db is used to retrieve individual food items from
// the inventory collection.
const { db } = require("../config/firebase");


// ==========================================
//  GET NUTRITION FOR A SPECIFIC FOOD ITEM
// ==========================================

// HTTP endpoint: GET /nutrition/:foodId
//
// EXAMPLE:
// GET /nutrition/abc123
//
// PURPOSE:
// Retrieve the nutritional information for one food item.
//
// EXPECTED RESPONSE:
// {
//   "foodId": "abc123",
//   "name": "Rice",
//   "calories": 200,
//   "protein": 4,
//   "carbs": 45,
//   "fat": 1
// }
//
// NOTE:
// Authentication middleware should protect this route.
// If inventory records belong to individual users, this
// controller should also verify that the requested food
// belongs to the authenticated user.

exports.getNutrition = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: GET THE FOOD ID FROM THE URL
    // ------------------------------------------

    // Read the foodId parameter from the request URL.
    //
    // For /nutrition/abc123, foodId will be "abc123".
    const { foodId } = req.params;


    // ------------------------------------------
    // STEP 2: FIND THE FOOD IN FIRESTORE
    // ------------------------------------------

    // Open the inventory collection.
    // Select the document matching the requested food ID.
    // Retrieve the document from Firestore.
    const foodDoc = await db
      .collection("inventory")
      .doc(foodId)
      .get();


    // ------------------------------------------
    // STEP 3: CHECK WHETHER THE FOOD EXISTS
    // ------------------------------------------

    // If Firestore cannot find the document, return
    // HTTP 404 instead of attempting to read its data.
    if (!foodDoc.exists) {
      return res.status(404).json({
        error: "Food item not found"
      });
    }


    // ------------------------------------------
    // STEP 4: READ THE FOOD INFORMATION
    // ------------------------------------------

    // Convert the Firestore document into a JavaScript
    // object containing the saved food properties.
    const food = foodDoc.data();


    // ------------------------------------------
    // STEP 5: RETURN THE NUTRITION INFORMATION
    // ------------------------------------------

    // Return the food ID, name, and nutritional values.
    //
    // The nullish coalescing operator (??) supplies zero
    // if a nutrition field is null or undefined.
    //
    // This prevents missing nutrition fields from being
    // returned as null or undefined.
    //
    // IMPORTANT:
    // These values are returned as stored in inventory.
    // They are not multiplied by servings in this function.
    return res.status(200).json({
      foodId,
      name: food.name,
      calories: food.calories ?? 0,
      protein: food.protein ?? 0,
      carbs: food.carbs ?? 0,
      fat: food.fat ?? 0
    });

  } catch (error) {

    // ------------------------------------------
    // STEP 6: HANDLE FOOD NUTRITION ERRORS
    // ------------------------------------------

    // Log the complete error in the backend terminal.
    // This helps troubleshoot Firestore or server issues.
    console.error("Error retrieving food nutrition:", error);

    // Return a generic error message to the frontend.
    return res.status(500).json({
      error: "Unable to retrieve food nutrition"
    });

  }

};


// ==========================================
//          GET TODAY'S NUTRITION
// ==========================================

// HTTP endpoint: GET /nutrition/today
//
// PURPOSE:
// Calculate the authenticated user's nutrition totals
// for the current day.
//
// EXPECTED RESPONSE:
// {
//   "userId": "firebase-user-id",
//   "calories": 1500,
//   "protein": 80,
//   "carbs": 180,
//   "fat": 45,
//   "calorieTarget": 2800,
//   "caloriePercentage": 54
// }
//
// The numbers above are examples, not actual user data.
//
// IMPORTANT:
// nutritionService.js determines which consumption
// records count toward today's totals.

exports.getTodayNutrition = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE AUTHENTICATED USER
    // ------------------------------------------

    // Read the Firebase UID from the verified request.
    //
    // Authentication middleware must attach the user
    // information to req.user before this controller runs.
    const userId = req.user.uid;


    // ------------------------------------------
    // STEP 2: CALCULATE TODAY'S NUTRITION
    // ------------------------------------------

    // Call the nutrition service to calculate the
    // authenticated user's nutrition for today.
    //
    // The service is responsible for retrieving the
    // appropriate consumption records and totaling
    // their nutritional values.
    const nutrition = await calculateTodayNutrition(userId);


    // ------------------------------------------
    // STEP 3: DEFINE THE DAILY CALORIE TARGET
    // ------------------------------------------

    // SpaceByte's current daily calorie target.
    //
    // The dashboard uses this value to show the user's
    // calorie progress for the day.
    const calorieTarget = 2800;


    // ------------------------------------------
    // STEP 4: CALCULATE CALORIE PROGRESS
    // ------------------------------------------

    // Divide calories consumed by the daily target.
    // Multiply by 100 to convert the result to a percentage.
    //
    // Math.round() rounds the percentage to a whole number.
    //
    // Math.min(100, ...) caps the displayed progress at
    // 100 percent so the progress indicator does not exceed
    // its target.
    //
    // NOTE:
    // This caps the displayed percentage only.
    // The actual calorie total is not capped.
    const caloriePercentage = Math.min(
      100,
      Math.round(
        (nutrition.calories / calorieTarget) * 100
      )
    );


    // ------------------------------------------
    // STEP 5: RETURN TODAY'S NUTRITION SUMMARY
    // ------------------------------------------

    // Send the nutrition data and calorie progress
    // to the React frontend as a JSON response.
    //
    // calories:
    // Total calories consumed today.
    //
    // protein:
    // Total protein consumed today.
    //
    // carbs:
    // Total carbohydrates consumed today.
    //
    // fat:
    // Total fat consumed today.
    //
    // calorieTarget:
    // The daily target of 2800 calories.
    //
    // caloriePercentage:
    // The percentage of the daily calorie target reached.
    return res.status(200).json({
      userId,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      calorieTarget,
      caloriePercentage
    });

  } catch (error) {

    // ------------------------------------------
    // STEP 6: HANDLE NUTRITION CALCULATION ERRORS
    // ------------------------------------------

    // Log the error to help diagnose problems with
    // Firestore, the nutrition service, or calculations.
    console.error("Error calculating nutrition:", error);

    // Return a generic error response to the frontend.
    return res.status(500).json({
      error: "Unable to calculate nutrition"
    });

  }

};
