
/*
===========================================================
 SPACEBYTE - FIRESTORE DATABASE SEEDING
 File: backend/src/seedFirestore.js

 PURPOSE:
 This file inserts sample data into the Firebase Firestore
 database so the SpaceByte application has information
 to display and test.

 COLLECTIONS CREATED:
 1. Users
 2. Inventory
 3. Consumption Logs

 The sample data helps test inventory tracking,
 nutritional calculations, and food consumption.
===========================================================
*/


// =====================================================
//              FIREBASE ADMIN SDK
// =====================================================

// Import the Firebase Admin SDK.
// This package allows the backend application to
// communicate with and manage the Firebase database.
const admin = require("firebase-admin");


// =====================================================
//                SERVICE ACCOUNT
// =====================================================

// Import the Firebase service account credentials.
// These credentials authenticate the backend and allow
// it to access the Firestore database.
//
// IMPORTANT:
// Keep this file private and never upload it to GitHub.
const serviceAccount = require("../../serviceAccountKey.json");


// =====================================================
//              INITIALIZE FIREBASE
// =====================================================

// Initialize Firebase Admin using the service account.
// This establishes a secure connection between the
// SpaceByte backend and the Firebase project.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


// Create a reference to the Cloud Firestore database.
// The db variable will be used to create, read, and
// update documents in Firestore.
const db = admin.firestore();


// =====================================================
//                MAIN SEED FUNCTION
// =====================================================

// This asynchronous function inserts sample data into
// the Firestore database.
//
// The async keyword allows us to use await when performing
// database operations that take time to complete.
async function seedDatabase() {
  try {

    // Display a message indicating that database
    // seeding has started.
    console.log("Starting Firestore seed...");


    // =====================================================
    //                USERS COLLECTION
    // =====================================================

    // Create a sample user document in the users collection.
    //
    // COLLECTION:
    // users
    //
    // DOCUMENT ID:
    // test-user-id
    //
    // The set() method creates the document if it does
    // not exist or replaces its existing contents.
    await db.collection("users").doc("test-user-id").set({

      // Unique identifier assigned to the user.
      userId: "test-user-id",

      // User's first and last name.
      firstName: "John",
      lastName: "Doe",

      // Email address associated with the account.
      email: "johndoe@example.com",

      // Array containing foods the user is allergic to.
      allergies: ["Peanuts"],

      // Array containing the user's dietary restrictions.
      dietaryRestrictions: ["Vegetarian"],

      // Array containing the user's food preferences.
      preferences: ["Low Sugar"],

      // Identifies the environment where food
      // recommendations and inventory are being used.
      //
      // Possible examples include:
      // Earth, International Space Station (ISS), or Moon.
      environment: "Earth",

      // Automatically records the date and time when
      // this document is created in Firestore.
      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });


    // Display confirmation that the user document
    // was successfully added to Firestore.
    console.log("User data seeded");


    // =====================================================
    //            INVENTORY COLLECTION
    // =====================================================

    // Create an array containing sample food inventory.
    //
    // Each object represents one food item and contains
    // information needed by the SpaceByte application.
    //
    // This information can be used to:
    // - Track available food quantities.
    // - Calculate nutritional information.
    // - Identify low-stock inventory.
    // - Monitor food expiration dates.
    // - Check dietary restrictions and allergens.
    const inventoryItems = [

      // =====================================================
      //                      APPLE
      // =====================================================

      {
        // Unique identifier for the food item.
        id: "apple",

        // Name displayed in the inventory.
        name: "Apple",

        // Current number of apples available.
        quantity: 100,

        // Nutritional information for the food item.
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,

        // Minimum quantity allowed before the application
        // should display a low-stock warning.
        lowStockThreshold: 10,

        // Date when the food item is expected to expire.
        expirationDate: "2026-10-10",

        // Identifies whether the food is vegetarian or vegan.
        isVegetarian: true,
        isVegan: true,

        // Empty array means no allergens are listed.
        allergens: [],

        // Automatically records when the item is created.
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // =====================================================
      //                    BANANA
      // =====================================================

      {
        id: "banana",

        name: "Banana",

        // Current inventory quantity.
        quantity: 75,

        // Nutritional information.
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,

        // Minimum quantity before a low-stock alert.
        lowStockThreshold: 10,

        // Food expiration date.
        expirationDate: "2026-10-12",

        // Dietary classifications.
        isVegetarian: true,
        isVegan: true,

        // No allergens are listed.
        allergens: [],

        // Automatically record the creation date.
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // =====================================================
      //                      RICE
      // =====================================================

      {
        id: "rice",

        name: "Rice",

        // Current quantity available.
        quantity: 200,

        // Nutritional information.
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,

        // Minimum inventory quantity.
        lowStockThreshold: 20,

        // Food expiration date.
        expirationDate: "2027-01-15",

        // Dietary classifications.
        isVegetarian: true,
        isVegan: true,

        // No allergens are listed.
        allergens: [],

        // Automatically record the creation date.
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // =====================================================
      //                  CHICKEN BREAST
      // =====================================================

      {
        id: "chicken-breast",

        name: "Chicken Breast",

        // Current quantity available.
        quantity: 50,

        // Nutritional information.
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,

        // Minimum quantity before a low-stock alert.
        lowStockThreshold: 10,

        // Food expiration date.
        expirationDate: "2026-10-08",

        // Chicken is not classified as vegetarian or vegan.
        isVegetarian: false,
        isVegan: false,

        // No allergens are listed.
        allergens: [],

        // Automatically record the creation date.
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // =====================================================
      //          NASA-INSPIRED FOOD EXAMPLES
      // =====================================================


      // =====================================================
      //                  SPACE GRANOLA
      // =====================================================

      {
        id: "space-granola",

        name: "Space Granola",

        // Current quantity available.
        quantity: 40,

        // Nutritional information.
        calories: 220,
        protein: 8,
        carbs: 35,
        fat: 6,

        // Minimum quantity before a low-stock alert.
        lowStockThreshold: 5,

        // Food expiration date.
        expirationDate: "2027-03-01",

        // Dietary classifications.
        isVegetarian: true,
        isVegan: true,

        // Contains nuts, which should be considered
        // when checking the user's food allergies.
        allergens: ["Nuts"],

        // Automatically record the creation date.
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // =====================================================
      //          FREEZE-DRIED STRAWBERRIES
      // =====================================================

      {
        id: "freeze-dried-strawberries",

        name: "Freeze Dried Strawberries",

        // Current quantity available.
        quantity: 30,

        // Nutritional information.
        calories: 120,
        protein: 2,
        carbs: 28,
        fat: 0,

        // Minimum quantity before a low-stock alert.
        lowStockThreshold: 5,

        // Food expiration date.
        expirationDate: "2027-05-01",

        // Dietary classifications.
        isVegetarian: true,
        isVegan: true,

        // No allergens are listed.
        allergens: [],

        // Automatically record the creation date.
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },


      // =====================================================
      //                    PROTEIN PACK
      // =====================================================

      {
        id: "protein-pack",

        name: "Protein Pack",

        // Current quantity available.
        quantity: 25,

        // Nutritional information.
        calories: 310,
        protein: 35,
        carbs: 5,
        fat: 12,

        // Minimum quantity before a low-stock alert.
        lowStockThreshold: 5,

        // Food expiration date.
        expirationDate: "2027-02-15",

        // Vegetarian but not vegan because it contains
        // an animal-derived ingredient.
        isVegetarian: true,
        isVegan: false,

        // Contains milk, which is a possible allergen.
        allergens: ["Milk"],

        // Automatically record the creation date.
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },
    ];


    // =====================================================
    //        ADD INVENTORY ITEMS TO FIRESTORE
    // =====================================================

    // Loop through the inventoryItems array.
    // Each item is processed individually and saved
    // as its own document in the inventory collection.
    for (const item of inventoryItems) {

      // Create a Firestore document using the food item's
      // unique ID as the document ID.
      //
      // Example:
      // inventory/apple
      // inventory/banana
      // inventory/rice
      //
      // The set() method saves the food item's information.
      await db.collection("inventory").doc(item.id).set({

        // Food name displayed in the application.
        name: item.name,

        // Current quantity available in inventory.
        quantity: item.quantity,

        // Nutritional information used for calculations.
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,

        // Minimum quantity used to determine low-stock alerts.
        lowStockThreshold: item.lowStockThreshold,

        // Expiration date used for expiration tracking.
        expirationDate: item.expirationDate,

        // Dietary classifications.
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,

        // List of possible food allergens.
        allergens: item.allergens,

        // Timestamp indicating when the item was added.
        createdAt: item.createdAt,
      });
    }


    // Display confirmation that all inventory items
    // have been added to the database.
    console.log("Inventory data seeded");


    // =====================================================
    //            CONSUMPTION LOGS COLLECTION
    // =====================================================

    // Consumption logs keep track of food consumed by users.
    //
    // This information can later help SpaceByte:
    // - Track how much food users consume.
    // - Calculate daily nutritional totals.
    // - Monitor remaining food inventory.
    // - Generate consumption reports.
    // - Provide personalized food recommendations.


    // =====================================================
    //              FIRST CONSUMPTION LOG
    // =====================================================

    // Create a consumption record for the first food item.
    //
    // COLLECTION:
    // consumptionLogs
    //
    // DOCUMENT ID:
    // log1
    await db.collection("consumptionLogs").doc("log1").set({

      // Identifies the user who consumed the food.
      userId: "test-user-id",

      // Identifies the food item that was consumed.
      // This ID connects the log to the apple inventory item.
      foodId: "apple",

      // Amount of food consumed.
      amount: 2,

      // Automatically records the date and time
      // when this consumption record is created.
      timestamp:
        admin.firestore.FieldValue.serverTimestamp(),
    });


    // =====================================================
    //              SECOND CONSUMPTION LOG
    // =====================================================

    // Create a consumption record for the second food item.
    //
    // COLLECTION:
    // consumptionLogs
    //
    // DOCUMENT ID:
    // log2
    await db.collection("consumptionLogs").doc("log2").set({

      // Identifies the user who consumed the food.
      userId: "test-user-id",

      // Identifies the food item that was consumed.
      // This ID connects the log to the banana inventory item.
      foodId: "banana",

      // Amount of food consumed.
      amount: 1,

      // Automatically records the consumption date and time.
      timestamp:
        admin.firestore.FieldValue.serverTimestamp(),
    });


    // Display confirmation that both consumption
    // records have been added successfully.
    console.log("Consumption logs seeded");


    // =====================================================
    //                  SEED COMPLETE
    // =====================================================

    // Display a success message after all sample data
    // has been written to Firestore.
    console.log("Firestore seeded successfully!");


    // Exit the Node.js process with status code 0.
    // A status code of 0 indicates successful execution.
    process.exit(0);


  } catch (error) {

    // =====================================================
    //                ERROR HANDLING
    // =====================================================

    // Catch and display any errors that occur while
    // connecting to Firestore or inserting sample data.
    console.error(
      "Error seeding Firestore:",
      error
    );


    // Exit the Node.js process with status code 1.
    // A status code of 1 indicates that an error occurred.
    process.exit(1);
  }
}


// =====================================================
//                RUN THE SEED FUNCTION
// =====================================================

// Call the seedDatabase() function to begin inserting
// the sample user, inventory items, and consumption logs.
seedDatabase();
