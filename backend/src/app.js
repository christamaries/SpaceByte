// app.js

// Load environment variables from .env
require("dotenv").config();

// Import the Express framework
const express = require("express");

// Import CORS
// This allows frontend applications
// to communicate with the backend
const cors = require("cors");

// Import application routes
const inventoryRoutes =
  require("./routes/inventoryRoutes");

const consumptionRoutes =
  require("./routes/consumptionRoutes");

const userRoutes =
  require("./routes/userRoutes");

// Create Express application
const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Allow JSON request bodies
app.use(express.json());

// -------------------------------
//            ROUTES
// -------------------------------

// Inventory routes
// GET /inventory
app.use("/inventory", inventoryRoutes);

// Consumption routes
// POST /consumption
app.use("/consumption", consumptionRoutes);

// User routes
// GET /users/profile
// POST /users/profile
app.use("/users", userRoutes);

// -------------------------------
//      HEALTH CHECK ROUTE
// -------------------------------

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Food Inventory API is running"
  });
});

// -------------------------------
//        START SERVER
// -------------------------------

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});