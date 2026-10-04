// firebase.js

// Import Firebase Admin SDK
const admin = require("firebase-admin");

// Import Firebase service account
const serviceAccount =
  require("../../serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential:
    admin.credential.cert(serviceAccount)
});

// Create Firestore database reference
const db = admin.firestore();

// Export Firebase services
module.exports = {
  admin,
  db
};