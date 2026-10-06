// seedFirestore.js

// ---------------------------------------------------------
// This file populates Firestore with sample data for:
// 1. Users
// 2. Inventory Items
// 3. Consumption Logs
// ---------------------------------------------------------


// ---------------------------------------------------------
// FIREBASE ADMIN SDK
// ---------------------------------------------------------

// Import the Firebase Admin SDK.
// This allows the backend to securely communicate
// with the Firestore database.
const admin = require("firebase-admin");


// ---------------------------------------------------------
// SERVICE ACCOUNT
// ---------------------------------------------------------

// Import the Firebase service account credentials.
//

const serviceAccount = require("../../serviceAccountKey.json");


// ---------------------------------------------------------
// INITIALIZE FIREBASE
// ---------------------------------------------------------

// Initialize Firebase Admin using the service account.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


// Create a reference to the Firestore database.
const db = admin.firestore();


// ---------------------------------------------------------
// MAIN SEED FUNCTION
// ---------------------------------------------------------

// This function creates sample data in Firestore.
async function seedDatabase() {
  try {

    console.log("Starting Firestore seed...");


    // =====================================================
    // USERS COLLECTION
    // =====================================================

    // Create a sample user document.
    //
    // Firestore collection:
    // users
    //
    // Document ID:
    // test-user-id

    await db.collection("users").doc("test-user-id").set({

      // Unique ID for the user.
      userId: "test-user-id",

      // User's name.
      firstName: "John",
      lastName: "Doe",

      // User's email address.
      email: "johndoe@example.com",

      // List of food allergies.
      allergies: ["Peanuts"],

      // Dietary restrictions for the user.
      dietaryRestrictions: ["Vegetarian"],

      // User's food preferences.
      preferences: ["Low Sugar"],

      // Environment where the food recommendations
      // will be used.
      //
      // This could later be changed to values such as:
      // "Earth", "Space Station", or "Mars".
      environment: "Earth",

      // Automatically records when the user
      // was created.
      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });


    console.log("User data seeded");


    // =====================================================
    // INVENTORY COLLECTION
    // =====================================================

    // Sample food inventory.
    //
    // Each object represents one food item.
    //
    // These fields can be used by SpaceByte to:
    // - Track food quantities
    // - Display nutritional information
    // - Detect low inventory
    // - Track expiration dates
    // - Identify dietary information

    const inventoryItems = [

      // ---------------------------------------------------
      // APPLE
      // ---------------------------------------------------

      {
        id: "apple",

        name: "Apple",

        // Current quantity available.
        quantity: 100,

        // Nutritional information.
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,

        // Inventory management.
        // The app can alert the user when the quantity
        // reaches or falls below this number.
        lowStockThreshold: 10,

        // Expiration date.
        expirationDate: "2026-10-10",

        // Dietary information.
        isVegetarian: true,
        isVegan: true,

        // Food allergy information.
        allergens: [],

        // Date the item was added to the database.
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // ---------------------------------------------------
      // BANANA
      // ---------------------------------------------------

      {
        id: "banana",

        name: "Banana",

        quantity: 75,

        // Nutritional information.
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,

        // Inventory management.
        lowStockThreshold: 10,

        // Expiration date.
        expirationDate: "2026-10-12",

        // Dietary information.
        isVegetarian: true,
        isVegan: true,

        // No common allergens.
        allergens: [],

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // ---------------------------------------------------
      // RICE
      // ---------------------------------------------------

      {
        id: "rice",

        name: "Rice",

        quantity: 200,

        // Nutritional information.
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,

        // Inventory management.
        lowStockThreshold: 20,

        // Expiration date.
        expirationDate: "2027-01-15",

        // Dietary information.
        isVegetarian: true,
        isVegan: true,

        // No common allergens.
        allergens: [],

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // ---------------------------------------------------
      // CHICKEN BREAST
      // ---------------------------------------------------

      {
        id: "chicken-breast",

        name: "Chicken Breast",

        quantity: 50,

        // Nutritional information.
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,

        // Inventory management.
        lowStockThreshold: 10,

        // Expiration date.
        expirationDate: "2026-10-08",

        // Chicken is not vegetarian or vegan.
        isVegetarian: false,
        isVegan: false,

        // No common allergens.
        allergens: [],

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // ===================================================
      // NASA-INSPIRED FOOD EXAMPLES
      // ===================================================

      // ---------------------------------------------------
      // SPACE GRANOLA
      // ---------------------------------------------------

      {
        id: "space-granola",

        name: "Space Granola",

        quantity: 40,

        // Nutritional information.
        calories: 220,
        protein: 8,
        carbs: 35,
        fat: 6,

        // Inventory management.
        lowStockThreshold: 5,

        // Expiration date.
        expirationDate: "2027-03-01",

        // Dietary information.
        isVegetarian: true,
        isVegan: true,

        // Possible allergens.
        allergens: ["Nuts"],

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // ---------------------------------------------------
      // FREEZE-DRIED STRAWBERRIES
      // ---------------------------------------------------

      {
        id: "freeze-dried-strawberries",

        name: "Freeze Dried Strawberries",

        quantity: 30,

        // Nutritional information.
        calories: 120,
        protein: 2,
        carbs: 28,
        fat: 0,

        // Inventory management.
        lowStockThreshold: 5,

        // Expiration date.
        expirationDate: "2027-05-01",

        // Dietary information.
        isVegetarian: true,
        isVegan: true,

        // No common allergens.
        allergens: [],

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // ---------------------------------------------------
      // PROTEIN PACK
      // ---------------------------------------------------

      {
        id: "protein-pack",

        name: "Protein Pack",

        quantity: 25,

        // Nutritional information.
        calories: 310,
        protein: 35,
        carbs: 5,
        fat: 12,

        // Inventory management.
        lowStockThreshold: 5,

        // Expiration date.
        expirationDate: "2027-02-15",

        // Dietary information.
        isVegetarian: true,
        isVegan: false,

        // Example allergen.
        allergens: ["Milk"],

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },
    ];


    // -----------------------------------------------------
    // ADD INVENTORY ITEMS TO FIRESTORE
    // -----------------------------------------------------

    // Loop through every food item in the inventory array.
    for (const item of inventoryItems) {

      // Create a Firestore document using the item's ID.
      await db.collection("inventory").doc(item.id).set({

        // Food name.
        name: item.name,

        // Current inventory quantity.
        quantity: item.quantity,

        // Nutritional information.
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,

        // Minimum quantity before the app
        // should display a low-stock warning.
        lowStockThreshold: item.lowStockThreshold,

        // Date the food expires.
        expirationDate: item.expirationDate,

        // Dietary information.
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,

        // List of possible allergens.
        allergens: item.allergens,

        // Automatically record when the item
        // was added to Firestore.
        createdAt: item.createdAt,
      });
    }


    console.log("Inventory data seeded");


    // =====================================================
    // CONSUMPTION LOGS COLLECTION
    // =====================================================

    // Consumption logs record when a user consumes food.
    //
    // This information can later be used to:
    // - Track food consumption
    // - Calculate nutritional totals
    // - Update inventory
    // - Generate reports
    // - Make food recommendations


    // -----------------------------------------------------
    // FIRST CONSUMPTION LOG
    // -----------------------------------------------------

    await db.collection("consumptionLogs").doc("log1").set({

      // User who consumed the food.
      userId: "test-user-id",

      // ID of the food that was consumed.
      foodId: "apple",

      // Amount consumed.
      amount: 2,

      // Automatically record the time of consumption.
      timestamp:
        admin.firestore.FieldValue.serverTimestamp(),
    });


    // -----------------------------------------------------
    // SECOND CONSUMPTION LOG
    // -----------------------------------------------------

    await db.collection("consumptionLogs").doc("log2").set({

      // User who consumed the food.
      userId: "test-user-id",

      // ID of the food that was consumed.
      foodId: "banana",

      // Amount consumed.
      amount: 1,

      // Automatically record the time of consumption.
      timestamp:
        admin.firestore.FieldValue.serverTimestamp(),
    });


    console.log("Consumption logs seeded");


    // =====================================================
    // SEED COMPLETE
    // =====================================================

    console.log("Firestore seeded successfully!");


    // Exit the Node.js process with a success code.
    process.exit(0);


  } catch (error) {

    // -----------------------------------------------------
    // ERROR HANDLING
    // -----------------------------------------------------

    // Display the error in the terminal if something
    // goes wrong while seeding Firestore.
    console.error(
      "Error seeding Firestore:",
      error
    );


    // Exit the Node.js process with an error code.
    process.exit(1);
  }
}


// ---------------------------------------------------------
// RUN THE SEED FUNCTION
// ---------------------------------------------------------

// Execute the database seeding function.
seedDatabase();
