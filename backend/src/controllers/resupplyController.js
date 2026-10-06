// resupplyController.js

// Import resupply calculation service.
const {
  calculateResupplyForecast
} = require("../services/resupplyService");


// ==========================================
// GET RESUPPLY FORECAST
// ==========================================

// GET /resupply/forecast
//
// Example:
//
// /resupply/forecast?days=30
//
// This estimates how much food should
// arrive on the next cargo flight.
exports.getResupplyForecast = async (req, res) => {

  try {

    // Read the number of days remaining
    // from the query string.
    const days =
      Number(req.query.days) || 30;


    // Prevent invalid values.
    if (days <= 0) {

      return res.status(400).json({
        error:
          "Days must be greater than zero"
      });

    }


    // Calculate the forecast.
    const forecast =
      await calculateResupplyForecast(days);


    // Only return items that actually
    // need resupply.
    const itemsNeedingResupply =
      forecast.filter(
        item =>
          item.recommendedResupply > 0
      );


    // Return the forecast.
    res.status(200).json({

      forecastPeriodDays: days,

      itemsNeedingResupply:
        itemsNeedingResupply.length,

      items: itemsNeedingResupply

    });

  } catch (error) {

    console.error(
      "Error calculating resupply:",
      error
    );

    res.status(500).json({
      error:
        "Unable to calculate resupply forecast"
    });

  }

};