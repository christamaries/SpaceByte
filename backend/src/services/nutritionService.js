
/*
===========================================================
 SPACEBYTE - NUTRITION SERVICE
 File: backend/src/services/nutritionService.js

 Calculates nutrition from today's consumption logs for
 the authenticated user.

 Supported log date fields:
   - consumedAt
   - timestamp

 Supported food fields:
   - calories, protein, carbs, fat
   - vitaminD, water

 IMPORTANT:
 Each food's nutrient values are assumed to be per serving,
 and log.amount is assumed to represent servings consumed.
===========================================================
*/

const { db } = require("../config/firebase");

/**
 * Convert a Firestore Timestamp, Date, or date string to Date.
 * Returns null if the supplied value is missing or invalid.
 */
function toDate(value) {
  if (!value) return null;

  // Firestore Timestamp.
  if (typeof value.toDate === "function") {
    const result = value.toDate();
    return Number.isNaN(result.getTime()) ? null : result;
  }

  // JavaScript Date.
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  // ISO date string or numeric timestamp.
  if (typeof value === "string" || typeof value === "number") {
    const result = new Date(value);
    return Number.isNaN(result.getTime()) ? null : result;
  }

  return null;
}

/**
 * Return the start of the current local day.
 *
 * This follows the server's local timezone. Configure the
 * backend timezone deliberately if your app needs a specific
 * crew timezone across deployments.
 */
function getStartOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Calculate today's logged nutrition for one user.
 *
 * @param {string} userId Firebase authenticated user ID
 */
async function getTodayNutrition(userId) {
  if (!userId) {
    throw new Error("A user ID is required to calculate nutrition.");
  }

  const snapshot = await db
    .collection("consumptionLogs")
    .where("userId", "==", userId)
    .get();

  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    vitaminD: 0,
    water: 0,
  };

  const startOfToday = getStartOfToday();

  // Cache food records to avoid fetching the same food
  // repeatedly when it appears in multiple consumption logs.
  const foodCache = new Map();

  for (const doc of snapshot.docs) {
    const log = doc.data();

    // IMPORTANT: use the field that actually contains a date.
    const dateValue = log.consumedAt ?? log.timestamp;
    const logDate = toDate(dateValue);

    // Ignore records without valid dates or from earlier days.
    if (!logDate || logDate < startOfToday) {
      continue;
    }

    if (!log.foodId) {
      continue;
    }

    let food = foodCache.get(log.foodId);

    if (food === undefined) {
      const foodDoc = await db
        .collection("inventory")
        .doc(log.foodId)
        .get();

      food = foodDoc.exists ? foodDoc.data() : null;
      foodCache.set(log.foodId, food);
    }

    // Skip logs whose associated inventory record no longer exists.
    if (!food) {
      continue;
    }

    const amount = Number(log.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    // Accumulate each nutrient using the per-serving food values.
    for (const key of Object.keys(totals)) {
      const nutrientAmount = Number(food[key] ?? 0);

      if (Number.isFinite(nutrientAmount)) {
        totals[key] += nutrientAmount * amount;
      }
    }
  }

  // Return consistent numeric values to the dashboard.
  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [
      key,
      Number(value.toFixed(2)),
    ])
  );
}

module.exports = {
  getTodayNutrition,
};
