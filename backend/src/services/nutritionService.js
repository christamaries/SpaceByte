

/*
===========================================================
 NUTRITION SERVICE

 PURPOSE:
 1. Calculate today's nutrition totals for one user.
 2. Read that user's consumption logs from Firestore.
 3. Match consumption logs to their inventory food records.
 4. Calculate calories, protein, carbs, fat, vitamin D,
    and water consumed today.
 5. Return consistent numeric totals for the dashboard.

 SUPPORTED LOG DATE FIELDS:
 - consumedAt
 - timestamp

 SUPPORTED FOOD FIELDS:
 - calories
 - protein
 - carbs
 - fat
 - vitaminD
 - water

 IMPORTANT ASSUMPTIONS:
 - Nutrient values are stored per serving.
 - log.amount represents servings consumed.
 - Consumption logs contain userId and foodId.
 - The backend server's local timezone determines today.

===========================================================
*/


// Import the Firestore database connection.
const { db } = require("../config/firebase");


// ==========================================
//          CONVERT VALUE TO DATE
// ==========================================

/**
 * Convert a supported date value into a JavaScript Date.
 *
 * Supported inputs:
 * - Firestore Timestamp
 * - JavaScript Date
 * - Date string
 * - Numeric timestamp accepted by JavaScript Date
 *
 * Returns null if the value is missing or invalid.
 */
function toDate(value) {

  // Missing values cannot be converted into valid dates.
  if (!value) return null;


  // Handle a Firestore Timestamp.
  // Firestore Timestamp objects provide a toDate() method.
  if (typeof value.toDate === "function") {

    const result = value.toDate();

    // Reject invalid Date objects.
    return Number.isNaN(result.getTime()) ? null : result;
  }


  // Handle a JavaScript Date object directly.
  if (value instanceof Date) {

    // Reject invalid Date objects.
    return Number.isNaN(value.getTime()) ? null : value;
  }


  // Handle strings and numeric timestamps.
  if (typeof value === "string" || typeof value === "number") {

    // Attempt to parse the supplied value.
    const result = new Date(value);

    // Return null if parsing failed.
    return Number.isNaN(result.getTime()) ? null : result;
  }


  // Unsupported value types are treated as invalid dates.
  return null;
}


// ==========================================
//          GET START OF TODAY
// ==========================================

/**
 * Return midnight at the beginning of the current day.
 *
 * This uses the backend server's local timezone.
 * Configure the server timezone deliberately if SpaceByte
 * requires a consistent timezone across deployments.
 */
function getStartOfToday() {

  // Start with the current date and time.
  const start = new Date();

  // Reset the time to 12:00 AM.
  start.setHours(0, 0, 0, 0);

  return start;
}


// ==========================================
//          CALCULATE TODAY'S NUTRITION
// ==========================================

/**
 * Calculate today's logged nutrition for one user.
 *
 * @param {string} userId - Firebase authenticated user ID
 *
 * Returns an object containing today's nutrient totals.
 */
async function getTodayNutrition(userId) {

  // Require a user ID so nutrition can be calculated
  // for a specific authenticated user.
  if (!userId) {
    throw new Error("A user ID is required to calculate nutrition.");
  }


  // Retrieve only consumption logs belonging to this user.
  //
  // IMPORTANT:
  // Each log must contain a userId field matching the
  // authenticated user's Firebase UID.
  const snapshot = await db
    .collection("consumptionLogs")
    .where("userId", "==", userId)
    .get();


  // Initialize all supported nutrient totals to zero.
  // These values increase as today's valid logs are processed.
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    vitaminD: 0,
    water: 0,
  };


  // Establish the start of today using the server timezone.
  const startOfToday = getStartOfToday();


  // Establish the start of tomorrow.
  // This allows the calculation to exclude future-dated logs.
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);


  // Cache inventory food records to avoid repeatedly fetching
  // the same food when it appears in multiple consumption logs.
  const foodCache = new Map();


  // Process each consumption log belonging to this user.
  for (const doc of snapshot.docs) {

    // Read the saved consumption log fields.
    const log = doc.data();


    // Support either of the two date fields.
    // Prefer consumedAt when both are available.
    const dateValue = log.consumedAt ?? log.timestamp;


    // Convert the stored date into a JavaScript Date.
    const logDate = toDate(dateValue);


    // Skip logs that have no valid date.
    if (!logDate) {
      continue;
    }


    // Skip logs from earlier days.
    if (logDate < startOfToday) {
      continue;
    }


    // Skip logs dated tomorrow or later.
    if (logDate >= startOfTomorrow) {
      continue;
    }


    // This service currently requires a foodId so it can
    // find the corresponding inventory record.
    //
    // Logs without foodId are skipped. See the important
    // compatibility note following this code.
    if (!log.foodId) {
      continue;
    }


    // Look for the food in the cache first.
    let food = foodCache.get(log.foodId);


    // If the food has not been cached, retrieve it from
    // the inventory collection using its document ID.
    if (food === undefined) {

      const foodDoc = await db
        .collection("inventory")
        .doc(log.foodId)
        .get();


      // Store the food data if the document exists.
      // Store null if it no longer exists.
      food = foodDoc.exists ? foodDoc.data() : null;


      // Cache the result to avoid another Firestore read
      // if a later log references the same food item.
      foodCache.set(log.foodId, food);
    }


    // Skip logs whose inventory food record no longer exists.
    if (!food) {
      continue;
    }


    // Convert the consumed amount into a number of servings.
    const amount = Number(log.amount);


    // Ignore missing, invalid, zero, or negative amounts.
    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }


    // ----------------------------------------
    // Calculate nutrient totals
    // ----------------------------------------

    // Process each nutrient tracked by the totals object.
    for (const key of Object.keys(totals)) {

      // Read the food's nutrient value per serving.
      // Use zero if the food record has no value for this
      // particular nutrient.
      const nutrientAmount = Number(food[key] ?? 0);


      // Only add valid numeric nutrient values.
      if (Number.isFinite(nutrientAmount)) {

        // Multiply the per-serving nutrient value by
        // the number of servings consumed.
        totals[key] += nutrientAmount * amount;
      }
    }
  }


  // Round each total to two decimal places and ensure
  // the returned values are numbers rather than strings.
  //
  // Example:
  // 123.456 becomes 123.46.
  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [
      key,
      Number(value.toFixed(2)),
    ])
  );
}


// ==========================================
//              EXPORT SERVICE
// ==========================================

// Allow other backend files to calculate today's nutrition.
module.exports = {
  getTodayNutrition,
};
