
/*
===========================================================
 SPACEBYTE - FIREBASE CONFIGURATION
 File: frontend/src/firebase.js

 PURPOSE:
 This file connects the SpaceByte React frontend to Firebase.

 FIREBASE SERVICES:
 1. Firebase Authentication:
    Handles user registration, login, and authentication.

 2. Cloud Firestore:
    Provides access to the SpaceByte database when the
    appropriate Firestore security rules are configured.

 3. Firebase App:
    Initializes the Firebase application using the
    project's web configuration.
===========================================================
*/

// Import initializeApp to connect the frontend to Firebase.
import { initializeApp } from "firebase/app";

// Import getAuth to enable Firebase Authentication.
import { getAuth } from "firebase/auth";

// Import getFirestore to connect to the Cloud Firestore database.
import { getFirestore } from "firebase/firestore";

// -----------------------------------------------------------
// FIREBASE PROJECT CONFIGURATION
// -----------------------------------------------------------

// These settings identify the SpaceByte Firebase project.
// They are provided by Firebase when registering a web app.
//
// IMPORTANT:
// The Firebase web API key is not a substitute for security.
// Protect your application through Firebase Authentication,
// Firestore security rules, and appropriate API restrictions.

const firebaseConfig = {
  apiKey: "AIzaSyBb9fPtHeEpOcMwPRH9eoy6vNwUoyUy-7s",
  authDomain: "spacebyte-2de10.firebaseapp.com",
  projectId: "spacebyte-2de10",
  storageBucket: "spacebyte-2de10.firebasestorage.app",
  messagingSenderId: "682125455364",
  appId: "1:682125455364:web:2b21480871b98c0e79c551"
};

// -----------------------------------------------------------
// INITIALIZE FIREBASE
// -----------------------------------------------------------

// Initialize the Firebase application using the configuration
// settings above.
//
// The app object is used to connect other Firebase services.
const app = initializeApp(firebaseConfig);

// -----------------------------------------------------------
// INITIALIZE FIREBASE AUTHENTICATION
// -----------------------------------------------------------

// Connect Firebase Authentication to the SpaceByte application.
//
// This allows the frontend to:
// - Create user accounts.
// - Sign users in.
// - Sign users out.
// - Send email verification messages.
// - Handle password reset requests.
//
// Other frontend files can import auth from this file.

export const auth = getAuth(app);

// -----------------------------------------------------------
// INITIALIZE CLOUD FIRESTORE
// -----------------------------------------------------------

// Connect the frontend to the SpaceByte Cloud Firestore database.
//
// Firestore stores application data such as:
// - User profiles.
// - Food inventory.
// - Food consumption records.
// - Nutrition information.
// - Meal planning data.
//
// Database access must be protected by properly configured
// Firestore security rules.
//
// Other frontend files can import db from this file.

export const db = getFirestore(app);

// -----------------------------------------------------------
// EXPORT FIREBASE APPLICATION
// -----------------------------------------------------------

// Export the initialized Firebase application.
//
// This allows other files to access the Firebase app
// configuration when needed.

export default app;
