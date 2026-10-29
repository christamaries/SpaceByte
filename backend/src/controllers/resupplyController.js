
/*
===========================================================
 RESUPPLY CONTROLLER

 PURPOSE:
 1. Estimate how much food needs to be resupplied.
 2. Read the requested forecast period from the query string.
 3. Call the resupply calculation service.
 4. Filter out food items that do not need resupply.
 5. Return the forecast to the frontend.

 ROUTE:
 GET /resupply

 EXAMPLE:
 GET /resupply?days=30

 DEPENDENCIES:
 - resupplyService.js
===========================================================
*/


// Import the resupply calculation service.
// This service performs the calculations needed to determine
// which food items should be replenished.
const {
  calculateResupplyForecast
} = require("../services/resupplyService");


// ==========================================
//        GET RESUPPLY FORECAST
// ==========================================

// Handle requests for a food resupply forecast.
//
// The forecast estimates how much food should arrive on
// a future cargo flight based on the service's calculations.
//
// The number of forecast days can be supplied in the URL.
// Example: /resupply?days=30
exports.getResupplyForecast = async (req, res) => {

  try {

    // Read the "days" query parameter from the URL.
    //
    // Number() converts the query string into a number.
    // If the value is missing, zero, or not a valid number,
    // the expression defaults to 30 days.
    const days =
      Number(req.query.days) || 30;


    // Validate the forecast period.
    // A forecast cannot use zero or a negative number of days.
    //
    // Return immediately so the service is not called
    // with an invalid forecast period.
    if (days <= 0) {

      return res.status(400).json({
        error:
          "Days must be greater than zero"
      });

    }


    // Ask the resupply service to calculate the forecast.
    // The service receives the requested number of days.
    const forecast =
      await calculateResupplyForecast(days);


    // Keep only the food items that have a positive
    // recommended resupply amount.
    //
    // Items with recommendedResupply equal to zero or
    // less are excluded from the response.
    const itemsNeedingResupply =
      forecast.filter(
        item =>
          item.recommendedResupply > 0
      );


    // Return HTTP 200 (OK) with the forecast results.
    //
    // forecastPeriodDays:
    // The number of days covered by the forecast.
    //
    // itemsNeedingResupply:
    // The number of food items that need replenishment.
    //
    // items:
    // The filtered list of food items requiring resupply.
    res.status(200).json({

      forecastPeriodDays: days,

      itemsNeedingResupply:
        itemsNeedingResupply.length,

      items: itemsNeedingResupply

    });

  } catch (error) {

    // Log the detailed error in the backend terminal.
    // This helps diagnose issues in the resupply service.
    console.error(
      "Error calculating resupply:",
      error
    );


    // Return HTTP 500 if the forecast cannot be calculated.
    // The frontend receives a general message instead of
    // internal server details.
    res.status(500).json({
      error:
        "Unable to calculate resupply forecast"
    });

  }

};
