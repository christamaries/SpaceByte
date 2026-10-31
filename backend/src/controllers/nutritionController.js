

/*
===========================================================
 SPACEBYTE - NUTRITION CONTROLLER
 File: backend/src/controllers/nutritionController.js

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
// db allows this controller to retrieve individual food
// items from the inventory collection.
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
//
// If inventory records belong to individual users,
// this controller should also verify that the requested
// food item belongs to the authenticated user.

exports.getNutrition = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: GET THE FOOD ID FROM THE URL
    // ------------------------------------------

    // Read the foodId parameter from the request URL.
    //
    // For example, in /nutrition/abc123,
    // foodId will contain "abc123".
    const { foodId } = req.params;


    // ------------------------------------------
    // STEP 2: FIND THE FOOD IN FIRESTORE
    // ------------------------------------------

    // Access the inventory collection in Firestore.
    //
    // .doc(foodId) selects the document with the
    // matching food ID.
    //
    // .get() retrieves the document from Firestore.
    const foodDoc = await db
      .collection("inventory")
      .doc(foodId)
      .get();


    // ------------------------------------------
    // STEP 3: CHECK WHETHER THE FOOD EXISTS
    // ------------------------------------------

    // Check whether Firestore found the requested document.
    //
    // If the document does not exist, return HTTP 404.
    //
    // This prevents the controller from trying to read
    // information from a food item that cannot be found.
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

    // Send the food ID, name, and nutritional values
    // back to the React frontend.
    //
    // The nullish coalescing operator (??) returns zero
    // if a nutrition field is null or undefined.
    //
    // This helps prevent missing nutrition fields from
    // being returned as null or undefined.
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

    // Display the complete error in the backend terminal.
    //
    // This helps identify Firestore or server problems
    // during development and troubleshooting.
    console.error("Error retrieving food nutrition:", error);

    // Return HTTP 500 with a generic error message.
    //
    // The frontend can use this response to notify
    // the user that nutrition information could not load.
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
// records count toward today's nutrition totals.

exports.getTodayNutrition = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE AUTHENTICATED USER
    // ------------------------------------------

    // Retrieve the Firebase user ID (UID) from the request.
    //
    // The authentication middleware verifies the user's
    // Firebase token and attaches the decoded user
    // information to req.user.
    //
    // req.user.uid identifies which user's nutrition
    // records should be calculated.
    const userId = req.user.uid;


    // ------------------------------------------
    // STEP 2: CALCULATE TODAY'S NUTRITION
    // ------------------------------------------

    // Call the nutrition service and pass the authenticated
    // user's ID.
    //
    // nutritionService.js is responsible for:
    // 1. Retrieving the user's consumption records.
    // 2. Determining which records belong to today.
    // 3. Calculating calories, protein, carbohydrates,
    //    and fat.
    //
    // The returned object contains the nutrition totals.
    const nutrition = await calculateTodayNutrition(userId);


    // ------------------------------------------
    // STEP 3: DEFINE THE DAILY CALORIE TARGET
    // ------------------------------------------

    // Set SpaceByte's current daily calorie target.
    //
    // This value is used by the dashboard to calculate
    // how close the user is to reaching the daily goal.
    const calorieTarget = 2800;


    // ------------------------------------------
    // STEP 4: CALCULATE CALORIE PROGRESS
    // ------------------------------------------

    // Calculate the percentage of the daily calorie
    // target that the user has consumed.
    //
    // Formula:
    // (Calories consumed / Daily calorie target) * 100
    //
    // Math.round() rounds the percentage to a whole number.
    //
    // Math.min(100, ...) prevents the displayed progress
    // percentage from exceeding 100%.
    //
    // IMPORTANT:
    // This only limits the progress percentage.
    // It does not limit or change the actual calorie total.
    const caloriePercentage = Math.min(
      100,
      Math.round(
        (nutrition.calories / calorieTarget) * 100
      )
    );


    // ------------------------------------------
    // STEP 5: RETURN TODAY'S NUTRITION SUMMARY
    // ------------------------------------------

    // Send the nutrition summary to the React frontend.
    //
    // RESPONSE FIELDS:
    //
    // userId:
    // Firebase ID of the authenticated user.
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
    // The daily calorie goal of 2800 calories.
    //
    // caloriePercentage:
    // Percentage of the daily calorie goal reached.
    //
    // HTTP 200 indicates that the request was successful.
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

    // Display the error in the backend terminal.
    //
    // This can help identify problems with:
    // - Firestore database requests.
    // - The nutrition service.
    // - Missing or incorrectly formatted data.
    // - Nutrition calculations.
    console.error("Error calculating nutrition:", error);

    // Return HTTP 500 to indicate that the server
    // could not complete the nutrition calculation.
    //
    // The frontend receives a generic error message.
    return res.status(500).json({
      error: "Unable to calculate nutrition"
    });

  }

};
