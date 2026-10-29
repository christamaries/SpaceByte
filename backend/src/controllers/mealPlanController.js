

/*
===========================================================
 MEAL PLAN CONTROLLER

 PURPOSE:
 1. Retrieve the authenticated user's planned meals.
 2. Create new planned meals.
 3. Delete planned meals.
 4. Replace food in a planned meal.
 5. Mark a planned meal as eaten.
 6. Record consumed food for nutrition tracking.
 7. Prevent duplicate consumption logs for a meal.
 8. Protect meal plans and inventory data between users.

 FIREBASE COLLECTIONS:
 - mealPlans: Stores planned meals.
 - inventory: Stores available food items.
 - consumptionLogs: Stores food consumption history.

===========================================================
*/


// ==========================================
//         IMPORT FIREBASE CONFIGURATION
// ==========================================

// Import the initialized Firestore database and Firebase
// Admin SDK.
//
// db:
// Used to read, create, update, and delete Firestore data.
//
// admin:
// Used for server timestamps and other Firebase features.
const { db, admin } = require("../config/firebase");


// ==========================================
//          FIRESTORE COLLECTION NAMES
// ==========================================

// Collection containing users' planned meals.
const MEAL_COLLECTION = "mealPlans";

// Collection containing available inventory items.
const INVENTORY_COLLECTION = "inventory";

// Collection containing food consumption records.
const CONSUMPTION_COLLECTION = "consumptionLogs";


// ==========================================
//             GET ALL PLANNED MEALS
// ==========================================

// HTTP endpoint: GET /meal-plan
//
// PURPOSE:
// Retrieve the planned meals belonging to the
// currently authenticated user.
//
// SECURITY:
// The query filters results using the authenticated
// user's Firebase UID.
//
// EXPECTED RESPONSE:
// An array containing the user's planned meals.

exports.getMealPlan = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE AUTHENTICATED USER
    // ------------------------------------------

    // Authentication middleware must verify the user's
    // identity and attach the decoded token to req.user.
    const userId = req.user.uid;


    // ------------------------------------------
    // STEP 2: QUERY THE MEAL PLAN COLLECTION
    // ------------------------------------------

    // Retrieve only the meal documents belonging
    // to this user.
    const snapshot = await db
      .collection(MEAL_COLLECTION)
      .where("userId", "==", userId)
      .get();


    // ------------------------------------------
    // STEP 3: CONVERT DOCUMENTS INTO JAVASCRIPT OBJECTS
    // ------------------------------------------

    // snapshot.docs contains the matching Firestore
    // documents.
    //
    // doc.id provides the Firestore document ID.
    // doc.data() provides the saved meal information.
    //
    // Including the ID allows the frontend to identify
    // meals when deleting, swapping, or marking them eaten.
    const meals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));


    // ------------------------------------------
    // STEP 4: RETURN THE MEALS
    // ------------------------------------------

    // HTTP 200 means the request succeeded.
    return res.status(200).json(meals);

  } catch (error) {

    // Log the complete error for backend debugging.
    console.error("Error getting meal plan:", error);

    // Return a generic error message to the frontend.
    return res.status(500).json({
      error: "Unable to retrieve meal plan",
    });

  }

};


// ==========================================
//              CREATE A PLANNED MEAL
// ==========================================

// HTTP endpoint: POST /meal-plan
//
// PURPOSE:
// Create a planned meal using a food item from inventory.
//
// EXPECTED REQUEST BODY:
// {
//   "date": "2026-10-29",
//   "mealType": "lunch",
//   "foodId": "FIRESTORE_FOOD_DOCUMENT_ID",
//   "servings": 1
// }
//
// The date format above is an example. The frontend
// should use the date format expected by the application.

exports.createMeal = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: READ USER AND REQUEST INFORMATION
    // ------------------------------------------

    // Get the UID of the authenticated user.
    const userId = req.user.uid;

    // Read the planned date, meal category, inventory
    // document ID, and number of servings.
    const { date, mealType, foodId, servings } = req.body;


    // ------------------------------------------
    // STEP 2: CHECK REQUIRED FIELDS
    // ------------------------------------------

    // A date, meal type, and inventory food ID must
    // be supplied to create a planned meal.
    if (!date || !mealType || !foodId) {
      return res.status(400).json({
        error: "date, mealType, and foodId are required",
      });
    }


    // ------------------------------------------
    // STEP 3: VALIDATE THE MEAL CATEGORY
    // ------------------------------------------

    // These are the supported meal categories.
    const validMealTypes = [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
    ];

    // Convert the supplied meal type to lowercase.
    // For example, "Lunch" becomes "lunch".
    const normalizedMealType =
      String(mealType).toLowerCase();

    // Reject categories that are not supported.
    if (!validMealTypes.includes(normalizedMealType)) {
      return res.status(400).json({
        error: "Invalid meal type",
      });
    }


    // ------------------------------------------
    // STEP 4: VALIDATE THE NUMBER OF SERVINGS
    // ------------------------------------------

    // If servings is omitted, default to one serving.
    // Otherwise, convert the supplied value to a number.
    const mealServings =
      servings === undefined ? 1 : Number(servings);

    // Servings must be a finite number greater than zero.
    if (!Number.isFinite(mealServings) || mealServings <= 0) {
      return res.status(400).json({
        error: "Servings must be a number greater than zero",
      });
    }


    // ------------------------------------------
    // STEP 5: FIND THE INVENTORY FOOD ITEM
    // ------------------------------------------

    // Retrieve the inventory document using its Firestore ID.
    const foodDoc = await db
      .collection(INVENTORY_COLLECTION)
      .doc(foodId)
      .get();

    // Stop if the requested food item does not exist.
    if (!foodDoc.exists) {
      return res.status(404).json({
        error: "Food item not found in inventory",
      });
    }

    // Convert the inventory document into a JavaScript object.
    const food = foodDoc.data();


    // ------------------------------------------
    // STEP 6: CHECK INVENTORY OWNERSHIP
    // ------------------------------------------

    // If the inventory record has a userId, ensure that
    // it belongs to the authenticated user.
    //
    // IMPORTANT:
    // This conditional does not reject records that have
    // no userId. If every food item must belong to a user,
    // require an exact userId match instead.
    if (food.userId && food.userId !== userId) {
      return res.status(403).json({
        error: "Access denied to this inventory item",
      });
    }


    // ------------------------------------------
    // STEP 7: BUILD THE PLANNED MEAL
    // ------------------------------------------

    // Create the data that will be saved in Firestore.
    const meal = {

      // Associate this meal with the authenticated user.
      userId,

      // Store the scheduled date.
      date,

      // Store the validated meal category.
      mealType: normalizedMealType,

      // Link the planned meal to its inventory item.
      foodId,

      // Save the food name for display in the frontend.
      foodName: food.name || "Unnamed food",

      // Save the requested number of servings.
      servings: mealServings,


      // ----------------------------------------
      // CALCULATE TOTAL NUTRITION FOR THE MEAL
      // ----------------------------------------

      // Multiply nutrition per serving by the number
      // of servings planned.
      //
      // Number(...) converts numeric strings to numbers.
      // || 0 provides a fallback when a value is missing
      // or evaluates to zero.
      calories: (Number(food.calories) || 0) * mealServings,
      protein: (Number(food.protein) || 0) * mealServings,
      carbs: (Number(food.carbs) || 0) * mealServings,
      fat: (Number(food.fat) || 0) * mealServings,


      // Record when the meal was created.
      // Firebase assigns the actual server timestamp.
      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),

    };


    // ------------------------------------------
    // STEP 8: SAVE THE PLANNED MEAL
    // ------------------------------------------

    // Add a new document to the mealPlans collection.
    // Firestore automatically generates the document ID.
    const docRef = await db
      .collection(MEAL_COLLECTION)
      .add(meal);


    // ------------------------------------------
    // STEP 9: RETURN THE CREATED MEAL
    // ------------------------------------------

    // HTTP 201 indicates successful resource creation.
    //
    // Return the new document ID and meal information
    // so the frontend can display the saved meal.
    return res.status(201).json({
      id: docRef.id,
      ...meal,
    });

  } catch (error) {

    // Log errors that occur while creating a planned meal.
    console.error("Error creating meal:", error);

    return res.status(500).json({
      error: "Unable to create meal",
    });

  }

};


// ==========================================
//           MARK A PLANNED MEAL AS EATEN
// ==========================================

// HTTP endpoint: POST /meal-plan/:id/eaten
//
// PURPOSE:
// Mark a planned meal as eaten and create a consumption
// log that can be used by the nutrition dashboard.
//
// DUPLICATE PREVENTION:
// A deterministic log ID is created from the meal ID.
// Repeated requests for the same meal use the same log ID.
//
// FIRESTORE TRANSACTION:
// The meal is checked and updated together with its
// consumption log to help prevent duplicate records.

exports.markMealEaten = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: GET USER AND MEAL IDENTIFIERS
    // ------------------------------------------

    // Identify the authenticated user.
    const userId = req.user.uid;

    // Read the meal document ID from the URL.
    // Example: /meal-plan/abc123/eaten
    const mealId = req.params.id;


    // ------------------------------------------
    // STEP 2: CREATE FIRESTORE DOCUMENT REFERENCES
    // ------------------------------------------

    // Reference the planned meal document.
    const mealRef = db
      .collection(MEAL_COLLECTION)
      .doc(mealId);

    // Create a stable consumption log reference.
    //
    // For a given meal ID, this produces the same log ID
    // on every request.
    const logRef = db
      .collection(CONSUMPTION_COLLECTION)
      .doc(`meal_${mealId}`);


    // ------------------------------------------
    // STEP 3: PROCESS THE OPERATION TRANSACTIONALLY
    // ------------------------------------------

    // Use a Firestore transaction to read the meal,
    // validate ownership, read the food item, and
    // create/update the associated records.
    const result = await db.runTransaction(async (transaction) => {

      // Read the planned meal inside the transaction.
      const mealDoc = await transaction.get(mealRef);

      // Return an error marker if the meal does not exist.
      if (!mealDoc.exists) {
        return { error: "MEAL_NOT_FOUND" };
      }

      // Read the saved meal information.
      const meal = mealDoc.data();


      // ----------------------------------------
      // VERIFY MEAL OWNERSHIP
      // ----------------------------------------

      // A user can only mark their own planned meal as eaten.
      if (meal.userId !== userId) {
        return { error: "ACCESS_DENIED" };
      }


      // ----------------------------------------
      // PREVENT DUPLICATE CONSUMPTION
      // ----------------------------------------

      // If consumedAt already exists, this meal has
      // already been marked as eaten.
      //
      // Return without creating another consumption log.
      if (meal.consumedAt) {
        return {
          alreadyEaten: true,
          mealId,
        };
      }


      // ----------------------------------------
      // RETRIEVE THE ASSOCIATED FOOD ITEM
      // ----------------------------------------

      // Use the food's inventory record as the source
      // of nutrition and food information.
      const foodRef = db
        .collection(INVENTORY_COLLECTION)
        .doc(meal.foodId);

      const foodDoc = await transaction.get(foodRef);

      // Stop if the inventory item no longer exists.
      if (!foodDoc.exists) {
        return { error: "FOOD_NOT_FOUND" };
      }

      const food = foodDoc.data();


      // ----------------------------------------
      // VERIFY INVENTORY OWNERSHIP
      // ----------------------------------------

      // If the food has a userId, verify that it belongs
      // to the authenticated user.
      if (food.userId && food.userId !== userId) {
        return { error: "ACCESS_DENIED" };
      }


      // ----------------------------------------
      // VALIDATE THE SERVING AMOUNT
      // ----------------------------------------

      // Read the planned number of servings.
      // Default to one if the stored value is missing
      // or is not truthy.
      const amount = Number(meal.servings) || 1;

      // Reject invalid serving amounts.
      if (!Number.isFinite(amount) || amount <= 0) {
        return { error: "INVALID_SERVINGS" };
      }


      // ----------------------------------------
      // CREATE THE CONSUMPTION TIMESTAMP
      // ----------------------------------------

      // Use a Firebase server timestamp rather than
      // the user's local computer clock.
      const consumedAt =
        admin.firestore.FieldValue.serverTimestamp();


      // ----------------------------------------
      // WRITE THE CONSUMPTION LOG
      // ----------------------------------------

      // Save the consumed food information in the
      // consumptionLogs collection.
      //
      // The amount field records servings consumed.
      // nutritionService.js must interpret this amount
      // consistently when calculating nutrition totals.
      transaction.set(logRef, {
        userId,
        foodId: meal.foodId,
        amount,
        consumedAt,
        mealPlanId: mealId,
        mealType: meal.mealType || "snack",
        foodName: food.name || meal.foodName || "Unnamed food",
      });


      // ----------------------------------------
      // UPDATE THE PLANNED MEAL
      // ----------------------------------------

      // Record that this planned meal has been consumed.
      //
      // The consumptionLogId links the meal to its
      // associated consumption log.
      transaction.update(mealRef, {
        consumedAt,
        consumptionLogId: logRef.id,
      });


      // Return information for the HTTP response.
      return {
        alreadyEaten: false,
        mealId,
        foodName: food.name || meal.foodName || "Unnamed food",
        amount,
      };

    });


    // ------------------------------------------
    // STEP 4: HANDLE TRANSACTION RESULTS
    // ------------------------------------------

    // Convert transaction error markers into suitable
    // HTTP responses.

    if (result.error === "MEAL_NOT_FOUND") {
      return res.status(404).json({
        error: "Meal not found",
      });
    }

    if (result.error === "ACCESS_DENIED") {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    if (result.error === "FOOD_NOT_FOUND") {
      return res.status(404).json({
        error: "Food item not found in inventory",
      });
    }

    if (result.error === "INVALID_SERVINGS") {
      return res.status(400).json({
        error: "Meal servings must be greater than zero",
      });
    }


    // ------------------------------------------
    // STEP 5: RETURN THE FINAL RESULT
    // ------------------------------------------

    // Return a different message depending on whether
    // the meal was newly marked as eaten or was already
    // consumed.
    return res.status(200).json({
      message: result.alreadyEaten
        ? "This meal was already marked as eaten"
        : "Meal marked as eaten successfully",
      ...result,
    });

  } catch (error) {

    // Log errors encountered while processing the meal.
    console.error("Error marking meal as eaten:", error);

    return res.status(500).json({
      error: "Unable to mark meal as eaten",
    });

  }

};


// ==========================================
//              DELETE A PLANNED MEAL
// ==========================================

// HTTP endpoint: DELETE /meal-plan/:id
//
// PURPOSE:
// Delete a planned meal belonging to the authenticated user.
//
// IMPORTANT:
// This function deletes the meal plan document only.
// It intentionally does not delete a consumption log,
// preserving nutrition history for meals already eaten.

exports.deleteMeal = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: IDENTIFY THE USER AND MEAL
    // ------------------------------------------

    const userId = req.user.uid;

    // Build a reference to the requested meal document.
    const mealRef = db
      .collection(MEAL_COLLECTION)
      .doc(req.params.id);


    // ------------------------------------------
    // STEP 2: CHECK WHETHER THE MEAL EXISTS
    // ------------------------------------------

    const mealDoc = await mealRef.get();

    // Return 404 if the requested meal cannot be found.
    if (!mealDoc.exists) {
      return res.status(404).json({
        error: "Meal not found",
      });
    }


    // ------------------------------------------
    // STEP 3: CHECK MEAL OWNERSHIP
    // ------------------------------------------

    // Prevent users from deleting someone else's meal.
    if (mealDoc.data().userId !== userId) {
      return res.status(403).json({
        error: "Access denied",
      });
    }


    // ------------------------------------------
    // STEP 4: DELETE THE PLANNED MEAL
    // ------------------------------------------

    // Delete only the mealPlans document.
    //
    // Any existing consumption log is retained so
    // nutrition history is not silently removed.
    await mealRef.delete();


    // ------------------------------------------
    // STEP 5: CONFIRM THE DELETION
    // ------------------------------------------

    return res.status(200).json({
      message: "Meal deleted successfully",
    });

  } catch (error) {

    // Log the error for troubleshooting.
    console.error("Error deleting meal:", error);

    return res.status(500).json({
      error: "Unable to delete meal",
    });

  }

};


// ==========================================
//             SWAP FOOD IN A PLANNED MEAL
// ==========================================

// PURPOSE:
// Replace the food associated with a planned meal.
//
// BEHAVIOR:
// 1. Validate the replacement food ID.
// 2. Confirm that the meal belongs to the user.
// 3. Prevent swapping meals that have been eaten.
// 4. Find the replacement food in inventory.
// 5. Recalculate the meal's nutrition values.
// 6. Save the updated meal.

exports.swapMeal = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: READ USER, MEAL, AND FOOD IDENTIFIERS
    // ------------------------------------------

    const userId = req.user.uid;
    const mealId = req.params.id;

    // Read the replacement food ID from the request body.
    const { foodId } = req.body;


    // ------------------------------------------
    // STEP 2: VALIDATE THE REPLACEMENT FOOD ID
    // ------------------------------------------

    // Require a nonempty string for the replacement ID.
    if (
      !foodId ||
      typeof foodId !== "string" ||
      !foodId.trim()
    ) {
      return res.status(400).json({
        error: "A replacement foodId is required",
      });
    }


    // ------------------------------------------
    // STEP 3: CREATE FIRESTORE REFERENCES
    // ------------------------------------------

    // Reference the planned meal to be updated.
    const mealRef = db
      .collection(MEAL_COLLECTION)
      .doc(mealId);

    // Reference the replacement inventory item.
    const foodRef = db
      .collection(INVENTORY_COLLECTION)
      .doc(foodId);


    // ------------------------------------------
    // STEP 4: VALIDATE AND UPDATE TRANSACTIONALLY
    // ------------------------------------------

    // Perform the reads and update within one transaction
    // so Firestore can retry if a conflicting write occurs.
    const result = await db.runTransaction(async (transaction) => {

      // Read the existing planned meal and replacement food.
      const mealDoc = await transaction.get(mealRef);
      const foodDoc = await transaction.get(foodRef);


      // ----------------------------------------
      // VERIFY THE MEAL EXISTS
      // ----------------------------------------

      if (!mealDoc.exists) {
        return { error: "MEAL_NOT_FOUND" };
      }

      const existingMeal = mealDoc.data();


      // ----------------------------------------
      // VERIFY MEAL OWNERSHIP
      // ----------------------------------------

      // Only the user who owns the planned meal can swap it.
      if (existingMeal.userId !== userId) {
        return { error: "ACCESS_DENIED" };
      }


      // ----------------------------------------
      // PREVENT SWAPPING A CONSUMED MEAL
      // ----------------------------------------

      // Once eaten, the meal should not be changed because
      // doing so could make the meal plan inconsistent
      // with the recorded consumption history.
      if (existingMeal.consumedAt) {
        return { error: "MEAL_ALREADY_EATEN" };
      }


      // ----------------------------------------
      // VERIFY THE REPLACEMENT FOOD EXISTS
      // ----------------------------------------

      if (!foodDoc.exists) {
        return { error: "FOOD_NOT_FOUND" };
      }

      const food = foodDoc.data();


      // ----------------------------------------
      // VERIFY REPLACEMENT FOOD OWNERSHIP
      // ----------------------------------------

      // If the replacement food has a userId, confirm
      // that it belongs to the authenticated user.
      if (food.userId && food.userId !== userId) {
        return { error: "ACCESS_DENIED" };
      }


      // ----------------------------------------
      // GET THE EXISTING SERVING AMOUNT
      // ----------------------------------------

      // Keep the original serving amount when swapping food.
      const servings = Number(existingMeal.servings) || 1;


      // ----------------------------------------
      // RECALCULATE MEAL NUTRITION
      // ----------------------------------------

      // Build the updated meal properties using the
      // replacement food's nutritional information.
      const updatedMeal = {

        // Save the replacement food document ID.
        foodId,

        // Update the displayed food name.
        foodName: food.name || "Unnamed food",

        // Recalculate nutrition for the existing servings.
        calories: (Number(food.calories) || 0) * servings,
        protein: (Number(food.protein) || 0) * servings,
        carbs: (Number(food.carbs) || 0) * servings,
        fat: (Number(food.fat) || 0) * servings,

        // Record when the planned meal was updated.
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),

      };


      // ----------------------------------------
      // SAVE THE UPDATED PLANNED MEAL
      // ----------------------------------------

      // Update the existing meal document rather than
      // creating a new planned meal.
      transaction.update(mealRef, updatedMeal);


      // Return the updated information for the response.
      return {
        id: mealId,
        ...existingMeal,
        ...updatedMeal,
      };

    });


    // ------------------------------------------
    // STEP 5: HANDLE TRANSACTION ERRORS
    // ------------------------------------------

    if (result.error === "MEAL_NOT_FOUND") {
      return res.status(404).json({
        error: "Meal not found",
      });
    }

    if (result.error === "ACCESS_DENIED") {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    if (result.error === "FOOD_NOT_FOUND") {
      return res.status(404).json({
        error: "Replacement food not found in inventory",
      });
    }

    if (result.error === "MEAL_ALREADY_EATEN") {
      return res.status(409).json({
        error: "A consumed meal cannot be swapped",
      });
    }


    // ------------------------------------------
    // STEP 6: RETURN THE UPDATED MEAL
    // ------------------------------------------

    // HTTP 200 means the meal was successfully updated.
    return res.status(200).json({
      message: "Meal swapped successfully",
      meal: result,
    });

  } catch (error) {

    // Log unexpected errors from the swap operation.
    console.error("Error swapping meal:", error);

    return res.status(500).json({
      error: "Unable to swap meal",
    });

  }

};
