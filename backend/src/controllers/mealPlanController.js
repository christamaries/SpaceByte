// mealPlanController.js

// Import Firestore.
const { db, admin } =
  require("../config/firebase");


// ==========================================
//            GET MEAL PLAN
// ==========================================

// GET /meal-plan
// Returns the authenticated user's meal plan.
exports.getMealPlan = async (req, res) => {

  try {

    // Get the logged-in user's ID.
    const userId = req.user.uid;

    // Get all meals belonging to this user.
    const snapshot =
      await db
        .collection("mealPlans")
        .where("userId", "==", userId)
        .get();

    // Convert Firestore documents
    // into JavaScript objects.
    const meals =
      snapshot.docs.map(doc => ({

        id: doc.id,

        ...doc.data()

      }));

    // Return the meal plan.
    res.status(200).json(meals);

  } catch (error) {

    console.error(
      "Error getting meal plan:",
      error
    );

    res.status(500).json({
      error: "Unable to retrieve meal plan"
    });

  }

};


// ==========================================
//            CREATE MEAL
// ==========================================

// POST /meal-plan
exports.createMeal = async (req, res) => {

  try {

    // Get authenticated user.
    const userId = req.user.uid;

    // Get meal information.
    const {
      date,
      mealType,
      foodId,
      servings
    } = req.body;


    // Validate required fields.
    if (
      !date ||
      !mealType ||
      !foodId
    ) {

      return res.status(400).json({
        error:
          "date, mealType, and foodId are required"
      });

    }


    // Make sure meal type is valid.
    const validMealTypes = [
      "breakfast",
      "lunch",
      "dinner",
      "snack"
    ];

    if (
      !validMealTypes.includes(
        mealType.toLowerCase()
      )
    ) {

      return res.status(400).json({
        error:
          "Invalid meal type"
      });

    }


    // Find the food in inventory.
    const foodDoc =
      await db
        .collection("inventory")
        .doc(foodId)
        .get();


    // Make sure the food exists.
    if (!foodDoc.exists) {

      return res.status(404).json({
        error:
          "Food item not found in inventory"
      });

    }


    const food = foodDoc.data();


    // Determine servings.
    const mealServings =
      Number(servings) || 1;


    // Calculate nutritional values
    // for the planned meal.
    const meal = {

      userId,

      date,

      mealType:
        mealType.toLowerCase(),

      foodId,

      foodName: food.name,

      servings: mealServings,

      calories:
        (Number(food.calories) || 0)
        * mealServings,

      protein:
        (Number(food.protein) || 0)
        * mealServings,

      carbs:
        (Number(food.carbs) || 0)
        * mealServings,

      fat:
        (Number(food.fat) || 0)
        * mealServings,

      createdAt:
        admin.firestore.FieldValue
          .serverTimestamp()

    };


    // Add the meal to Firestore.
    const docRef =
      await db
        .collection("mealPlans")
        .add(meal);


    // Return the newly created meal.
    res.status(201).json({

      id: docRef.id,

      ...meal

    });

  } catch (error) {

    console.error(
      "Error creating meal:",
      error
    );

    res.status(500).json({
      error: "Unable to create meal"
    });

  }

};


// ==========================================
//              DELETE MEAL
// ==========================================

// DELETE /meal-plan/:id
exports.deleteMeal = async (req, res) => {

  try {

    const userId = req.user.uid;

    const mealId = req.params.id;


    // Find the meal.
    const mealRef =
      db.collection("mealPlans")
        .doc(mealId);

    const mealDoc =
      await mealRef.get();


    if (!mealDoc.exists) {

      return res.status(404).json({
        error: "Meal not found"
      });

    }


    // Make sure users can only delete
    // their own meals.
    if (
      mealDoc.data().userId !== userId
    ) {

      return res.status(403).json({
        error: "Access denied"
      });

    }


    // Delete the meal.
    await mealRef.delete();


    res.status(200).json({
      message: "Meal deleted successfully"
    });

  } catch (error) {

    console.error(
      "Error deleting meal:",
      error
    );

    res.status(500).json({
      error: "Unable to delete meal"
    });

  }

};