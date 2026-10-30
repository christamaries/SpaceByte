
// ================================================
// SPACEBYTE - BACKEND SERVER
// File: backend/src/app.js
//
// PURPOSE:
// 1. Create the Express backend application.
// 2. Configure middleware for frontend communication.
// 3. Register all SpaceByte API routes.
// 4. Provide a health-check endpoint.
// 5. Start the backend server on port 5001.
//
// FRONTEND:
// React + Vite (localhost:5173)
//
// BACKEND:
// Node.js + Express (localhost:5001)
//
// ================================================


// ================================================
//                 IMPORT DEPENDENCIES
// ================================================

// Import Express to create the backend server.
const express = require("express");

// Import CORS to allow the frontend to communicate
// with the backend from a different localhost port.
const cors = require("cors");


// ================================================
//                 IMPORT API ROUTES
// ================================================

// Import the inventory routes.
// These routes handle adding and retrieving food inventory.
const inventoryRoutes =
  require("./routes/inventoryRoutes");

// Import the food consumption routes.
// These routes handle recording food consumption.
const consumptionRoutes =
  require("./routes/consumptionRoutes");

// Import the user routes.
// These routes handle user profiles and dietary restrictions.
const userRoutes =
  require("./routes/userRoutes");

// Import the nutrition routes.
// These routes provide nutrition information and daily totals.
const nutritionRoutes =
  require("./routes/nutritionRoutes");

// Import the dashboard routes.
// These routes provide the information displayed on the dashboard.
const dashboardRoutes =
  require("./routes/dashboardRoutes");

// Import the resupply routes.
// These routes calculate estimated food replenishment needs.
const resupplyRoutes =
  require("./routes/resupplyRoutes");

// Import the food recommendation routes.
// These routes provide food suggestions based on user preferences.
const recommendationRoutes =
  require("./routes/recommendationRoutes");

// Import the meal plan routes.
// These routes manage meals and meal consumption.
const mealPlanRoutes =
  require("./routes/mealPlanRoutes");


// ================================================
//              CREATE EXPRESS APPLICATION
// ================================================

// Create the main Express application.
// All middleware, routes, and server settings are
// registered on this application.
const app = express();


// ================================================
//                    MIDDLEWARE
// ================================================

// CORS stands for Cross-Origin Resource Sharing.
//
// It allows the React frontend to send requests to
// the Express backend even though they use different ports.
//
// Vite normally runs on port 5173 during development.
// Port 5174 is also allowed for development if Vite
// automatically switches ports.
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
  })
);


// Allow Express to receive and parse JSON request bodies.
//
// This middleware makes submitted JSON data available
// through req.body in the route controllers.
app.use(express.json());


// ================================================
//                  USER ROUTES
// ================================================

// Register all user-related API endpoints.
//
// Base URL:
// http://localhost:5001/users
//
// Examples:
// GET  /users/profile
// POST /users/profile
// POST /users/logout
app.use("/users", userRoutes);


// ================================================
//                INVENTORY ROUTES
// ================================================

// Register all food inventory API endpoints.
//
// Base URL:
// http://localhost:5001/inventory
//
// These routes allow the frontend to retrieve and
// manage food stored in the SpaceByte inventory.
app.use("/inventory", inventoryRoutes);


// ================================================
//              CONSUMPTION ROUTES
// ================================================

// Register food consumption API endpoints.
//
// Base URL:
// http://localhost:5001/consumption
//
// These routes record food consumed by the user
// and provide the information used for nutrition tracking.
app.use("/consumption", consumptionRoutes);


// ================================================
//                 NUTRITION ROUTES
// ================================================

// Register nutrition API endpoints.
//
// Base URL:
// http://localhost:5001/nutrition
//
// These routes provide food nutrition details
// and calculate the user's daily nutrition totals.
app.use("/nutrition", nutritionRoutes);


// ================================================
//                 RESUPPLY ROUTES
// ================================================

// Register food resupply API endpoints.
//
// Base URL:
// http://localhost:5001/resupply
//
// These routes estimate how much food needs to be
// replenished based on inventory and consumption history.
app.use("/resupply", resupplyRoutes);


// ================================================
//             RECOMMENDATION ROUTES
// ================================================

// Register food recommendation API endpoints.
//
// Base URL:
// http://localhost:5001/recommendations
//
// These routes return available foods that match
// supported user dietary preferences and allergies.
app.use("/recommendations", recommendationRoutes);


// ================================================
//                 DASHBOARD ROUTES
// ================================================

// Register the main SpaceByte dashboard API endpoints.
//
// Base URL:
// http://localhost:5001/dashboard
//
// These routes retrieve information such as inventory,
// inventory alerts, and daily nutrition totals.
app.use("/dashboard", dashboardRoutes);


// ================================================
//                 MEAL PLAN ROUTES
// ================================================

// Register weekly meal planner API endpoints.
//
// Base URL:
// http://localhost:5001/meal-plan
//
// These routes allow users to create, retrieve, update,
// swap, and delete meals in their meal plan.
app.use("/meal-plan", mealPlanRoutes);


// ================================================
//                  HEALTH CHECK
// ================================================

// This endpoint checks whether the backend server
// is running and responding to requests.
//
// Visit:
// http://localhost:5001/
//
// Expected response:
// {
//   "message": "Food Inventory API is running"
// }
app.get("/", (req, res) => {

  // Return a JSON message confirming that
  // the backend API is responding.
  res.json({
    message: "Food Inventory API is running"
  });

});


// ================================================
//                  START SERVER
// ================================================

// Use the PORT environment variable if one exists.
// Otherwise, use port 5001 as the default backend port.
const PORT = process.env.PORT || 5001;


// Start the Express backend server.
//
// Once the server starts, display a confirmation
// message in the terminal with the active port.
app.listen(PORT, () => {

  console.log(`SpaceByte server running on port ${PORT}`);

});
