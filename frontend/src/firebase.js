
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration from your Firebase Console.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "spacebyte-2de10",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase for the SpaceByte frontend.
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication for login and signup.
export const auth = getAuth(app);

// Initialize Firestore for food inventory and other data.
export const db = getFirestore(app);

// Export the Firebase app.
export default app;