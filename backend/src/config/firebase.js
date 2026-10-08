// firebase.js

// Import the Firebase Admin SDK.
const admin = require("firebase-admin");

// Import your Firebase service account credentials.
const serviceAccount = require("../../serviceAccountKey.json");

// Initialize Firebase Admin.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Create Firestore database reference
const db = admin.firestore();

// Export Firebase Admin and Firestore
module.exports = {
  admin,
  db
};