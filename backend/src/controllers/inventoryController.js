// inventoryController.js

// Import inventory service functions.
const {
  getInventory,
  getFoodStatus,
  getExpiringFood
} = require("../services/inventoryService");


// ==========================================
//            GET ALL FOOD
// ==========================================

// GET /inventory
exports.getAllFood = async (req, res) => {

  try {

    // Get all inventory items.
    const foods = await getInventory();

    // Add a calculated status to every item.
    const inventory = foods.map(food => ({

      ...food,

      // Examples:
      // OK
      // LOW
      // EXPIRING
      // EXPIRED
      status: getFoodStatus(food)

    }));

    // Return the inventory.
    res.status(200).json(inventory);

  } catch (error) {

    console.error(
      "Error getting inventory:",
      error
    );

    res.status(500).json({
      error: "Unable to retrieve inventory"
    });

  }

};


// ==========================================
//          GET EXPIRING FOOD
// ==========================================

// GET /inventory/expiring
exports.getExpiringFood = async (req, res) => {

  try {

    // Get the number of days from the query string.
    //
    // Example:
    // /inventory/expiring?days=7
    const days =
      Number(req.query.days) || 7;

    // Find food expiring within that period.
    const foods =
      await getExpiringFood(days);

    // Return the results.
    res.status(200).json({
      days,
      count: foods.length,
      items: foods
    });

  } catch (error) {

    console.error(
      "Error getting expiring food:",
      error
    );

    res.status(500).json({
      error: "Unable to retrieve expiration information"
    });

  }

};