

// ===========================================================
// SPACEBYTE - API HELPER
// File: frontend/src/services/api.js
//
// PURPOSE:
// 1. Connects the React frontend to the Express backend.
// 2. Sends HTTP requests to backend API endpoints.
// 3. Automatically attaches the Firebase ID token.
// 4. Handles JSON request and response data.
// 5. Returns useful error messages when requests fail.
//
// AUTHENTICATION:
// Firebase Authentication identifies the signed-in user.
// The Firebase ID token is sent to the backend using the
// Authorization header.
//
// BACKEND:
// Default address: http://localhost:5001
// ===========================================================


// -----------------------------------------------------------
// BACKEND ADDRESS
// -----------------------------------------------------------

// Read the backend URL from the frontend environment file.
//
// Example frontend .env setting:
// VITE_API_URL=http://localhost:5001
//
// If VITE_API_URL is not configured, use localhost:5001.
//
// This makes it possible to change the backend address
// without modifying this JavaScript file.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";


// -----------------------------------------------------------
// API REQUEST FUNCTION
// -----------------------------------------------------------

// Sends a request from the React frontend to the Express backend.
//
// PARAMETERS:
//
// path:
// The backend API endpoint being requested.
// Examples:
// "/users/profile"
// "/inventory"
// "/nutrition/today"
// "/dashboard"
//
// token:
// The Firebase ID token belonging to the signed-in user.
// The backend uses this token to verify authentication.
//
// options:
// Optional fetch settings, including:
// - method: GET, POST, PUT, PATCH, DELETE
// - body: Data being sent to the backend
// - headers: Additional HTTP headers
//
// The default options value is an empty object.
export async function apiRequest(path, token, options = {}) {

  // ---------------------------------------------------------
  // PREPARE REQUEST HEADERS
  // ---------------------------------------------------------

  // Copy any headers supplied by the component calling this
  // function so that the original options object is not changed.
  const headers = { ...(options.headers || {}) };


  // ---------------------------------------------------------
  // SET JSON CONTENT TYPE
  // ---------------------------------------------------------

  // When a request includes a body, tell the backend that
  // the information is being sent in JSON format.
  //
  // This allows Express middleware such as express.json()
  // to read the request body.
  //
  // Do not overwrite Content-Type if the caller already
  // supplied its own value.
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }


  // ---------------------------------------------------------
  // FIREBASE AUTHENTICATION
  // ---------------------------------------------------------

  // Attach the Firebase ID token to the request.
  //
  // The Bearer format allows the backend authentication
  // middleware to retrieve and verify the token.
  //
  // The backend receives this header:
  // Authorization: Bearer FIREBASE_ID_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }


  // ---------------------------------------------------------
  // SEND REQUEST TO EXPRESS BACKEND
  // ---------------------------------------------------------

  // Use fetch() to communicate with the backend.
  //
  // API_BASE_URL identifies the backend server.
  // path identifies the specific API route.
  //
  // The spread operator (...options) includes the request
  // method, body, and any other fetch settings supplied
  // by the React component.
  //
  // The prepared headers are added to the request.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });


  // ---------------------------------------------------------
  // READ BACKEND RESPONSE
  // ---------------------------------------------------------

  // Read the response as text first.
  //
  // This prevents an error if the backend returns something
  // other than JSON, such as a plain-text error message.
  const responseText = await response.text();

  // Start with an empty response value.
  let data = null;

  try {
    // Convert the response text into a JavaScript object
    // when the backend returns valid JSON.
    //
    // Example:
    // { "message": "Inventory loaded successfully" }
    data = responseText ? JSON.parse(responseText) : null;

  } catch {
    // If the response is not valid JSON, keep the original
    // response text instead of causing a JSON parsing error.
    data = responseText;
  }


  // ---------------------------------------------------------
  // HANDLE BACKEND ERRORS
  // ---------------------------------------------------------

  // response.ok is true for successful HTTP status codes.
  //
  // If the backend returns an unsuccessful status code,
  // create an error message and pass it back to the
  // React component that called apiRequest().
  if (!response.ok) {

    // Try to use the error message returned by the backend.
    //
    // Check "message" first, then "error".
    // If neither exists, display the HTTP status code.
    const errorMessage =
      data?.message ||
      data?.error ||
      `Backend request failed: ${response.status}`;

    // Throwing an error allows the calling component's
    // try/catch block to display or handle the problem.
    throw new Error(errorMessage);
  }


  // ---------------------------------------------------------
  // RETURN SUCCESSFUL RESPONSE
  // ---------------------------------------------------------

  // Return the backend response to the React component.
  //
  // Examples:
  // - Inventory items
  // - User profile information
  // - Nutrition totals
  // - Dashboard information
  // - Meal plan information
  return data;
}
