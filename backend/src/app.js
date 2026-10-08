// app.js

// Load environment variables from the .env file.
require("dotenv").config();

// Import Express.
const express = require("express");

// Import CORS.
// This allows the frontend to communicate with the backend.
const cors = require("cors");

// Import existing routes.
const inventoryRoutes =
  require("./routes/inventoryRoutes");

const consumptionRoutes =
  require("./routes/consumptionRoutes");

const userRoutes =
  require("./routes/userRoutes");

// Import NEW routes.
const nutritionRoutes =
  require("./routes/nutritionRoutes");

const mealPlanRoutes =
  require("./routes/mealPlanRoutes");

const resupplyRoutes =
  require("./routes/resupplyRoutes");

const recommendationRoutes =
  require("./routes/recommendationRoutes");

//to go with all the dashboard just created
  const dashboardRoutes =
  require("./routes/dashboardRoutes");

// Create the Express application.
const app = express();

// Enable CORS.
app.use(cors());

// Allow the server to receive JSON request bodies.
app.use(express.json());


// ==========================================
//              API ROUTES
// ==========================================

// Inventory
// GET /inventory
app.use("/inventory", inventoryRoutes);

// Food consumption
// POST /consumption
app.use("/consumption", consumptionRoutes);

// User profiles
// GET /users/profile
// POST /users/profile
app.use("/users", userRoutes);

// Nutrition
// GET /nutrition/today
app.use("/nutrition", nutritionRoutes);

// Meal planning
// GET /meal-plan
// POST /meal-plan
// PUT /meal-plan/:id
// DELETE /meal-plan/:id
app.use("/meal-plan", mealPlanRoutes);

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

  res.status(200).json({
    message: "SpaceByte Food Management API is running",
    status: "online"
  });

});


// ==========================================
//              ERROR HANDLER
// ==========================================

// This catches errors that were not handled
// by one of the controllers.
app.use((err, req, res, next) => {

  console.error("Server error:", err);

  res.status(500).json({
    error: "Internal server error"
  });

});


// ==========================================
//              START SERVER
// ==========================================

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {

  console.log(
    `SpaceByte backend running on port ${PORT}`
  );

});