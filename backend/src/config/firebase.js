// firebase.js

// Import the Firebase Admin SDK.
const admin = require("firebase-admin");

// Import your Firebase service account credentials.
//
// IMPORTANT:
// Do NOT upload this file to GitHub.
// Add it to .gitignore instead.
const serviceAccount = require("../../serviceAccountKey.json");

// Initialize Firebase Admin.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Create a connection to Firestore.
const db = admin.firestore();

// Export Firebase Admin and Firestore
// so other files can use them.
module.exports = {
  admin,
  db
};