// app.js

// Import Express to create the backend server.
const express = require("express");

// Import CORS to allow the frontend to communicate
// with the backend from a different localhost port.
const cors = require("cors");

// Import the inventory routes.
const inventoryRoutes =
  require("./routes/inventoryRoutes");

// Import the food consumption routes.
const consumptionRoutes =
  require("./routes/consumptionRoutes");

// Import the user routes for profiles and authentication.
const userRoutes =
  require("./routes/userRoutes");

// Import the nutrition routes.
const nutritionRoutes = 
  require("./routes/nutritionRoutes");

// Import the dashboard routes.
const dashboardRoutes =
  require("./routes/dashboardRoutes");

// Import resupply routes.
const resupplyRoutes = 
  require("./routes/resupplyRoutes");

// Import food recommendation routes.
const recommendationRoutes =
  require("./routes/recommendationRoutes");

// Import meal plan routes.
const mealPlanRoutes =
  require("./routes/mealPlanRoutes");

// Create the Express application.
const app = express();


// ================================================
//                MIDDLEWARE
// ================================================

// Allow requests from the React + Vite frontend.
// Vite normally runs on port 5173 during development.
app.use(
  cors({
    origin: [ 
    "http://localhost:5173",
    "http://localhost:5174",
     ],
  })
);

// Allow Express to receive and parse JSON request bodies.
// This is needed when the frontend sends JSON data.
app.use(express.json());



// =======================================
//            USER ROUTES
// =======================================

// User profile and authentication-related routes.
app.use("/users", userRoutes);


// =======================================
//          INVENTORY ROUTES
//=======================================

// Inventory routes.
app.use("/inventory", inventoryRoutes);


// =======================================
//        CONSUMPTION ROUTES
// =======================================

// Food consumption routes.
app.use("/consumption", consumptionRoutes);

// =======================================
//            NUTRITION ROUTE
// =======================================

// Nutrition routes.
app.use("/nutrition", nutritionRoutes);

// ================================================
//                RESUPPLY ROUTES
// ================================================

// Routes for forecasting food resupply.
app.use("/resupply", resupplyRoutes);


// ================================================
//             RECOMMENDATION ROUTES
// ================================================

// Routes for food recommendations.
app.use("/recommendations", recommendationRoutes);


// ================================================
//                DASHBOARD ROUTES
// ================================================

// Routes for the SpaceByte dashboard.
app.use("/dashboard", dashboardRoutes);

// ================================================
//                MEAL PLAN ROUTES
// ================================================

// Routes for the weekly meal planner.
app.use("/meal-plan", mealPlanRoutes);



// ==========================================
//              HEALTH CHECK
// ==========================================

// Visit http://localhost:5001/ to verify that
// the backend server is responding.
app.get("/", (req, res) => {

  res.json({
    message: "Food Inventory API is running"
  });

});


// =======================================
//            START SERVER
// =======================================
// Use the PORT environment variable if one exists.
// Otherwise use port 5001.
const PORT = process.env.PORT || 5001;


// Start the backend server and display its port.
app.listen(PORT, () => {

  console.log(`SpaceByte server running on port ${PORT}`);

});