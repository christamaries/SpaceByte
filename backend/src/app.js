// app.js

// Import Express.
const express = require("express");

// Import your routes.
const inventoryRoutes =
  require("./routes/inventoryRoutes");

const consumptionRoutes =
  require("./routes/consumptionRoutes");

const userRoutes =
  require("./routes/userRoutes");

const nutritionRoutes = 
  require("./routes/nutritionRoutes");


//to go with all the dashboard just created
  const dashboardRoutes =
  require("./routes/dashboardRoutes");

// Create the Express application.
const app = express();


// Allow Express to read JSON request bodies.
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

//=======================================
//            TEST ROUTE
// =======================================

// This route checks whether the backend
// is running correctly.

// Resupply forecasting
// GET /resupply/forecast
app.use("/resupply", resupplyRoutes);

// Food recommendations
// GET /recommendations
app.use("/recommendations", recommendationRoutes);


// Dashboard
// GET /dashboard
app.use("/dashboard", dashboardRoutes);


// ==========================================
//              HEALTH CHECK
// ==========================================

// This route allows us to quickly check
// whether the backend is running.
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


// Start the Express server.
app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});