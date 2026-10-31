

// ===========================================================
// SPACEBYTE - FIREBASE CONFIGURATION
// File: backend/src/config/firebase.js
//
// PURPOSE:
// 1. Connect the backend to Firebase.
// 2. Load private Firebase service account credentials.
// 3. Initialize Firebase Admin.
// 4. Connect to Cloud Firestore.
// ===========================================================

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Find the Firebase service account file.
// Expected location: backend/serviceAccountKey.json
const serviceAccountPath = path.resolve(
  __dirname,
  "../../serviceAccountKey.json"
);

// Check whether the credential file exists.
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    "Firebase service account file is missing. " +
    "Place serviceAccountKey.json inside the backend folder."
  );
}

// Load the Firebase credentials.
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin only once.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Connect to Firestore.
const db = admin.firestore();

// Export Firebase Admin and Firestore.
module.exports = {
  admin,
  db
};
