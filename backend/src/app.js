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


// Create the Express application.
const app = express();


// Allow Express to read JSON request bodies.
app.use(express.json());


// ---------------------------------------
//            USER ROUTES
// ---------------------------------------

// User profile and authentication-related routes.
app.use("/users", userRoutes);


// ---------------------------------------
//          INVENTORY ROUTES
// ---------------------------------------

// Inventory routes.
app.use("/inventory", inventoryRoutes);


// ---------------------------------------
//        CONSUMPTION ROUTES
// ---------------------------------------

// Food consumption routes.
app.use("/consumption", consumptionRoutes);


// ---------------------------------------
//            TEST ROUTE
// ---------------------------------------

// This route checks whether the backend
// is running correctly.
app.get("/", (req, res) => {

  res.json({
    message: "Food Inventory API is running"
  });

});


// ---------------------------------------
//            START SERVER
// ---------------------------------------

// Use the PORT environment variable if one exists.
// Otherwise use port 5001.
const PORT = process.env.PORT || 5001;


// Start the Express server.
app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});