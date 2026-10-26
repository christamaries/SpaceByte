

/*
 * SpaceByte Firebase Configuration
 *
 * This file connects the React frontend to Firebase.
 * Firebase Authentication handles login and signup.
 * Firestore allows the frontend to access the database
 * when appropriate security rules are configured.
 */

// Import Firebase functions.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// SpaceByte Firebase web app configuration.
const firebaseConfig = {
  apiKey: "AIzaSyBb9fPtHeEpOcMwPRH9eoy6vNwUoyUy-7s",
  authDomain: "spacebyte-2de10.firebaseapp.com",
  projectId: "spacebyte-2de10",
  storageBucket: "spacebyte-2de10.firebasestorage.app",
  messagingSenderId: "682125455364",
  appId: "1:682125455364:web:2b21480871b98c0e79c551"
};

// Initialize Firebase.
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication for login and signup.
export const auth = getAuth(app);

// Initialize Firestore for database operations.
export const db = getFirestore(app);

// Export the Firebase app.
export default app;