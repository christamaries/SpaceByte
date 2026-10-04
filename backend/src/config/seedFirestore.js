// seedFirestore.js

//Populates Firestore with sample data for:
// - Users
// - Inventory Items
// - Consumption Logs


// Firebase Admin SDK
const admin = require("firebase-admin");

// Service account credentials downloaded from Firebase Console
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore database reference
const db = admin.firestore();


 // Main function to seed database
 
async function seedDatabase() {
  try {
    console.log("Starting Firestore seed...");

    // -------------------------
    //    USERS COLLECTION
    // -------------------------
    // Creates a sample user document
     
    await db.collection("users").doc("test-user-id").set({
      userId: "test-user-id",
      firstName: "John",
      lastName: "Doe",
      email: "johndoe@example.com",

      // User-specific dietary information
      allergies: ["Peanuts"],
      dietaryRestrictions: ["Vegetarian"],
      preferences: ["Low Sugar"],

      // Environment where recommendations apply
      environment: "Earth",

      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("User data seeded");

    // -------------------------
    //   INVENTORY COLLECTION
    // -------------------------
    // Sample food inventory data
    
    const inventoryItems = [
      {
        id: "apple",
        name: "Apple",
        quantity: 100,
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
      },
      {
        id: "banana",
        name: "Banana",
        quantity: 75,
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
      },
      {
        id: "rice",
        name: "Rice",
        quantity: 200,
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
      },
      {
        id: "chicken-breast",
        name: "Chicken Breast",
        quantity: 50,
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
      },

      // NASA-inspired food examples
      {
        id: "space-granola",
        name: "Space Granola",
        quantity: 40,
        calories: 220,
        protein: 8,
        carbs: 35,
        fat: 6,
      },
      {
        id: "freeze-dried-strawberries",
        name: "Freeze Dried Strawberries",
        quantity: 30,
        calories: 120,
        protein: 2,
        carbs: 28,
        fat: 0,
      },
      {
        id: "protein-pack",
        name: "Protein Pack",
        quantity: 25,
        calories: 310,
        protein: 35,
        carbs: 5,
        fat: 12,
      },
    ];

    // Loop through each inventory item and create a Firestore document
    for (const item of inventoryItems) {
      await db.collection("inventory").doc(item.id).set({
        name: item.name,
        quantity: item.quantity,

        // Nutritional information
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log("Inventory data seeded");

    // -------------------------
    // CONSUMPTION LOGS
    // -------------------------
    // Sample records showing
    // foods consumed by a user
     
    await db.collection("consumptionLogs").doc("log1").set({
      userId: "test-user-id",
      foodId: "apple",
      amount: 2,
      timestamp:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("consumptionLogs").doc("log2").set({
      userId: "test-user-id",
      foodId: "banana",
      amount: 1,
      timestamp:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Consumption logs seeded");

    console.log("Firestore seeded successfully!");

    // Exit with success
    process.exit(0);

  } catch (error) {

    console.error(
      "Error seeding Firestore:",
      error
    );

    // Exit with failure
    process.exit(1);
  }
}

// Execute the seed function
seedDatabase();