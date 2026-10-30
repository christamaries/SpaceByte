

/*
===========================================================
 SPACEBYTE - RESUPPLY CONTROLLER
 File: backend/src/controllers/resupplyController.js

 PURPOSE:
 1. Estimate how much food needs to be resupplied.
 2. Read the requested forecast period from the query string.
 3. Call the resupply calculation service.
 4. Filter out food items that do not need resupply.
 5. Return the forecast to the frontend.
 6. Handle errors during resupply calculations.

 ROUTE:
 GET /resupply

 EXAMPLE:
 GET /resupply?days=30

 DEPENDENCIES:
 - resupplyService.js

===========================================================
*/


// ==========================================
//         IMPORT RESUPPLY SERVICE
// ==========================================

// Import the calculateResupplyForecast function
// from resupplyService.js.
//
// This service contains the calculations used to estimate
// how much food should be replenished.
//
// The controller handles the HTTP request and response.
// The service handles the actual resupply calculations.
const {
  calculateResupplyForecast
} = require("../services/resupplyService");


// ==========================================
//        GET RESUPPLY FORECAST
// ==========================================

// HTTP endpoint: GET /resupply
//
// PURPOSE:
// Generate a forecast showing which food items need
// to be replenished.
//
// The forecast estimates how much food should arrive
// on a future cargo flight based on the service's
// calculations.
//
// The forecast period can be customized using the
// "days" query parameter.
//
// EXAMPLE:
// GET /resupply?days=30
//
// If no valid days value is provided, the controller
// uses the default forecast period of 30 days.

exports.getResupplyForecast = async (req, res) => {

  try {

    // ------------------------------------------
    // STEP 1: READ THE FORECAST PERIOD
    // ------------------------------------------

    // Retrieve the "days" query parameter from the URL.
    //
    // Query parameters are received as strings.
    // Number() converts the value into a JavaScript number.
    //
    // Example:
    // "30" becomes 30.
    //
    // The || 30 expression uses 30 as the default when
    // the converted value is zero, NaN, or otherwise falsy.
    const days =
      Number(req.query.days) || 30;


    // ------------------------------------------
    // STEP 2: VALIDATE THE FORECAST PERIOD
    // ------------------------------------------

    // Make sure the requested forecast period is positive.
    //
    // A value of zero or a negative number is not a
    // valid forecast period.
    //
    // HTTP 400 means the client sent an invalid request.
    //
    // return stops the controller so the resupply service
    // is not called with an invalid number of days.
    if (days <= 0) {

      return res.status(400).json({
        error:
          "Days must be greater than zero"
      });

    }


    // ------------------------------------------
    // STEP 3: CALCULATE THE RESUPPLY FORECAST
    // ------------------------------------------

    // Call the resupply service and pass the requested
    // number of forecast days.
    //
    // The service calculates the estimated resupply needs
    // for the selected forecast period.
    //
    // The result is stored in the forecast variable.
    const forecast =
      await calculateResupplyForecast(days);


    // ------------------------------------------
    // STEP 4: FILTER ITEMS NEEDING RESUPPLY
    // ------------------------------------------

    // Use the filter() method to create a new array
    // containing only food items that need replenishment.
    //
    // recommendedResupply represents the amount of food
    // recommended for resupply.
    //
    // Items with a value greater than zero are included.
    //
    // Items with a value of zero or less are excluded.
    //
    // The original forecast array is not modified.
    const itemsNeedingResupply =
      forecast.filter(
        item =>
          item.recommendedResupply > 0
      );


    // ------------------------------------------
    // STEP 5: RETURN THE RESUPPLY FORECAST
    // ------------------------------------------

    // Return HTTP 200 (OK) when the forecast is successful.
    //
    // RESPONSE FIELDS:
    //
    // forecastPeriodDays:
    // The number of days included in the forecast.
    //
    // itemsNeedingResupply:
    // The total number of food items that require resupply.
    //
    // items:
    // The filtered list of food items that need replenishment.
    //
    // The React frontend can use this information to display
    // the resupply forecast on the SpaceByte dashboard.
    res.status(200).json({

      forecastPeriodDays: days,

      itemsNeedingResupply:
        itemsNeedingResupply.length,

      items: itemsNeedingResupply

    });

  } catch (error) {

    // ------------------------------------------
    // STEP 6: HANDLE RESUPPLY CALCULATION ERRORS
    // ------------------------------------------

    // Display the detailed error in the backend terminal.
    //
    // This helps troubleshoot problems involving:
    // - Firestore database requests.
    // - The resupply service.
    // - Missing or invalid inventory information.
    // - Resupply calculations.
    console.error(
      "Error calculating resupply:",
      error
    );


    // Return HTTP 500 (Internal Server Error).
    //
    // This tells the frontend that the server could not
    // successfully calculate the resupply forecast.
    //
    // Internal error details are not exposed to the frontend.
    res.status(500).json({
      error:
        "Unable to calculate resupply forecast"
    });

  }

};
