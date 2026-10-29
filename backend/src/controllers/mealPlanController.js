
/*
===========================================================
 SPACEBYTE - MEAL PLAN CONTROLLER
 File: backend/src/controllers/mealPlanController.js

 Features:
 1. Get the authenticated user's planned meals.
 2. Create planned meals.
 3. Delete planned meals.
 4. Swap food in a planned meal.
 5. Mark a planned meal as eaten.
 6. Prevent duplicate consumption logs for a meal.
===========================================================
*/

const { db, admin } = require("../config/firebase");

const MEAL_COLLECTION = "mealPlans";
const INVENTORY_COLLECTION = "inventory";
const CONSUMPTION_COLLECTION = "consumptionLogs";

// ---------------------------------------------------------
// GET /meal-plan
// ---------------------------------------------------------
exports.getMealPlan = async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await db
      .collection(MEAL_COLLECTION)
      .where("userId", "==", userId)
      .get();

    const meals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(meals);
  } catch (error) {
    console.error("Error getting meal plan:", error);

    return res.status(500).json({
      error: "Unable to retrieve meal plan",
    });
  }
};

// ---------------------------------------------------------
// POST /meal-plan
// ---------------------------------------------------------
exports.createMeal = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { date, mealType, foodId, servings } = req.body;

    if (!date || !mealType || !foodId) {
      return res.status(400).json({
        error: "date, mealType, and foodId are required",
      });
    }

    const validMealTypes = [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
    ];

    const normalizedMealType =
      String(mealType).toLowerCase();

    if (!validMealTypes.includes(normalizedMealType)) {
      return res.status(400).json({
        error: "Invalid meal type",
      });
    }

    const mealServings =
      servings === undefined ? 1 : Number(servings);

    if (!Number.isFinite(mealServings) || mealServings <= 0) {
      return res.status(400).json({
        error: "Servings must be a number greater than zero",
      });
    }

    const foodDoc = await db
      .collection(INVENTORY_COLLECTION)
      .doc(foodId)
      .get();

    if (!foodDoc.exists) {
      return res.status(404).json({
        error: "Food item not found in inventory",
      });
    }

    const food = foodDoc.data();

    // If inventory records include userId, enforce ownership.
    if (food.userId && food.userId !== userId) {
      return res.status(403).json({
        error: "Access denied to this inventory item",
      });
    }

    const meal = {
      userId,
      date,
      mealType: normalizedMealType,
      foodId,
      foodName: food.name || "Unnamed food",
      servings: mealServings,

      calories: (Number(food.calories) || 0) * mealServings,
      protein: (Number(food.protein) || 0) * mealServings,
      carbs: (Number(food.carbs) || 0) * mealServings,
      fat: (Number(food.fat) || 0) * mealServings,

      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db
      .collection(MEAL_COLLECTION)
      .add(meal);

    return res.status(201).json({
      id: docRef.id,
      ...meal,
    });
  } catch (error) {
    console.error("Error creating meal:", error);

    return res.status(500).json({
      error: "Unable to create meal",
    });
  }
};

// ---------------------------------------------------------
// POST /meal-plan/:id/eaten
//
// Mark a planned meal as eaten.
//
// A deterministic log ID prevents repeated requests from
// counting the same planned meal multiple times.
// ---------------------------------------------------------
exports.markMealEaten = async (req, res) => {
  try {
    const userId = req.user.uid;
    const mealId = req.params.id;

    const mealRef = db
      .collection(MEAL_COLLECTION)
      .doc(mealId);

    // Each planned meal gets one stable consumption log.
    const logRef = db
      .collection(CONSUMPTION_COLLECTION)
      .doc(`meal_${mealId}`);

    const result = await db.runTransaction(async (transaction) => {
      const mealDoc = await transaction.get(mealRef);

      if (!mealDoc.exists) {
        return { error: "MEAL_NOT_FOUND" };
      }

      const meal = mealDoc.data();

      if (meal.userId !== userId) {
        return { error: "ACCESS_DENIED" };
      }

      // Do not allow the same planned meal to be consumed twice.
      if (meal.consumedAt) {
        return {
          alreadyEaten: true,
          mealId,
        };
      }

      // Use the inventory item as the nutrition source.
      const foodRef = db
        .collection(INVENTORY_COLLECTION)
        .doc(meal.foodId);

      const foodDoc = await transaction.get(foodRef);

      if (!foodDoc.exists) {
        return { error: "FOOD_NOT_FOUND" };
      }

      const food = foodDoc.data();

      if (food.userId && food.userId !== userId) {
        return { error: "ACCESS_DENIED" };
      }

      const amount = Number(meal.servings) || 1;

      if (!Number.isFinite(amount) || amount <= 0) {
        return { error: "INVALID_SERVINGS" };
      }

      // This field format matches nutritionService.js.
      const consumedAt =
        admin.firestore.FieldValue.serverTimestamp();

      transaction.set(logRef, {
        userId,
        foodId: meal.foodId,
        amount,
        consumedAt,
        mealPlanId: mealId,
        mealType: meal.mealType || "snack",
        foodName: food.name || meal.foodName || "Unnamed food",
      });

      // Store consumption status on the planned meal.
      transaction.update(mealRef, {
        consumedAt,
        consumptionLogId: logRef.id,
      });

      return {
        alreadyEaten: false,
        mealId,
        foodName: food.name || meal.foodName || "Unnamed food",
        amount,
      };
    });

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

    return res.status(200).json({
      message: result.alreadyEaten
        ? "This meal was already marked as eaten"
        : "Meal marked as eaten successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error marking meal as eaten:", error);

    return res.status(500).json({
      error: "Unable to mark meal as eaten",
    });
  }
};

// ---------------------------------------------------------
// DELETE /meal-plan/:id
// ---------------------------------------------------------
exports.deleteMeal = async (req, res) => {
  try {
    const userId = req.user.uid;
    const mealRef = db
      .collection(MEAL_COLLECTION)
      .doc(req.params.id);

    const mealDoc = await mealRef.get();

    if (!mealDoc.exists) {
      return res.status(404).json({
        error: "Meal not found",
      });
    }

    if (mealDoc.data().userId !== userId) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    // If the meal was already eaten, keep its consumption
    // record so nutrition history is not silently removed.
    await mealRef.delete();

    return res.status(200).json({
      message: "Meal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting meal:", error);

    return res.status(500).json({
      error: "Unable to delete meal",
    });
  }
};

// ---------------------------------------------------------
// PATCH /meal-plan/:id/swap
// ---------------------------------------------------------
exports.swapMeal = async (req, res) => {
  try {
    const userId = req.user.uid;
    const mealId = req.params.id;
    const { foodId } = req.body;

    if (
      !foodId ||
      typeof foodId !== "string" ||
      !foodId.trim()
    ) {
      return res.status(400).json({
        error: "A replacement foodId is required",
      });
    }

    const mealRef = db
      .collection(MEAL_COLLECTION)
      .doc(mealId);

    const foodRef = db
      .collection(INVENTORY_COLLECTION)
      .doc(foodId);

    const result = await db.runTransaction(async (transaction) => {
      const mealDoc = await transaction.get(mealRef);
      const foodDoc = await transaction.get(foodRef);

      if (!mealDoc.exists) {
        return { error: "MEAL_NOT_FOUND" };
      }

      const existingMeal = mealDoc.data();

      if (existingMeal.userId !== userId) {
        return { error: "ACCESS_DENIED" };
      }

      // Do not change a meal after it has been consumed.
      if (existingMeal.consumedAt) {
        return { error: "MEAL_ALREADY_EATEN" };
      }

      if (!foodDoc.exists) {
        return { error: "FOOD_NOT_FOUND" };
      }

      const food = foodDoc.data();

      if (food.userId && food.userId !== userId) {
        return { error: "ACCESS_DENIED" };
      }

      const servings = Number(existingMeal.servings) || 1;

      const updatedMeal = {
        foodId,
        foodName: food.name || "Unnamed food",
        calories: (Number(food.calories) || 0) * servings,
        protein: (Number(food.protein) || 0) * servings,
        carbs: (Number(food.carbs) || 0) * servings,
        fat: (Number(food.fat) || 0) * servings,
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.update(mealRef, updatedMeal);

      return {
        id: mealId,
        ...existingMeal,
        ...updatedMeal,
      };
    });

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

    return res.status(200).json({
      message: "Meal swapped successfully",
      meal: result,
    });
  } catch (error) {
    console.error("Error swapping meal:", error);

    return res.status(500).json({
      error: "Unable to swap meal",
    });
  }
};
