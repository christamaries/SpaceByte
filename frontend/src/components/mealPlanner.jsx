
/*
===========================================================
 SPACEBYTE - WEEKLY MEAL PLANNER
===========================================================

 File:
 frontend/src/components/mealPlanner.jsx

 FEATURES:
 1. Displays a weekly meal calendar.
 2. Loads saved meals and inventory from the backend.
 3. Adds meals to a selected date and meal type.
 4. Deletes planned meals.
 5. Calculates average planned nutrition per day.
 6. Displays a ration check against daily nutrition targets.
 7. Suggests an alternative food when a planned food is low.
 8. Uses Firebase authentication tokens for API requests.

 IMPORTANT:
 Planned meals are not the same as consumed meals.
 This file does not record food as eaten until the user
 selects the "Mark as eaten" button.

===========================================================
*/

// React hooks used to manage component state and API loading.
import { useCallback, useEffect, useState } from "react";

// Shared API helper used to communicate with the backend.
import { apiRequest } from "../api";

// Shared SpaceByte configuration for crew settings,
// nutrition targets, and food icons.
import { CREW, TARGETS, foodIcon } from "../spacebyteConfig";

// Meal types displayed in the weekly calendar.
const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

// Labels displayed above each calendar day.
const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// Colors used to visually distinguish breakfast, lunch, and dinner.
const TYPE_COLORS = {
  breakfast: "#f9d56e",
  lunch: "#5ad1b0",
  dinner: "#6c63ff",
};

/*
 * Convert a JavaScript date into YYYY-MM-DD format.
 *
 * Local date methods are used instead of toISOString()
 * to avoid unexpected date changes caused by UTC conversion.
 */
function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * Find the Monday at the beginning of the supplied week.
 *
 * JavaScript getDay() returns:
 * Sunday = 0, Monday = 1, ..., Saturday = 6.
 *
 * The calculation moves the date backward to Monday.
 */
function mondayOf(date) {
  const monday = new Date(date);

  // Reset the time to midnight.
  monday.setHours(0, 0, 0, 0);

  // Move backward to the Monday of this week.
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return monday;
}

/*
 * Normalize a saved meal date into YYYY-MM-DD format.
 *
 * The backend may return a date as a string or as a
 * serialized Firestore Timestamp.
 */
function mealDate(meal) {
  // Return an empty string if the meal has no date.
  if (!meal?.date) return "";

  // Handle a date already returned as a string.
  if (typeof meal.date === "string") {
    return meal.date.slice(0, 10);
  }

  // Handle a Firestore Timestamp serialized as an object.
  if (typeof meal.date === "object" && meal.date._seconds) {
    return toISO(new Date(meal.date._seconds * 1000));
  }

  return "";
}

/*
===========================================================
 MEAL PLANNER COMPONENT
===========================================================
 The user prop represents the currently authenticated
 Firebase user.
*/
export default function MealPlanner({ user }) {
  // Saved planned meals returned by the backend.
  const [meals, setMeals] = useState([]);

  // Food items available for meal planning.
  const [inventory, setInventory] = useState([]);

  // Controls which week is displayed.
  // 0 = current week, -1 = previous week, 1 = next week.
  const [weekOffset, setWeekOffset] = useState(0);

  // Stores the date and meal type of the calendar cell
  // currently displaying the food-selection dropdown.
  const [adding, setAdding] = useState(null);

  // Stores API and validation error messages.
  const [error, setError] = useState("");

  // Tracks whether the initial meal-plan data is loading.
  const [loading, setLoading] = useState(true);

  // Prevents multiple meal submissions at the same time.
  const [saving, setSaving] = useState(false);

  // Stores the ID of the meal currently being deleted.
  const [deletingId, setDeletingId] = useState(null);

  // Stores the ID of the meal currently being replaced.
  const [swappingId, setSwappingId] = useState(null);

  // Stores the ID of the meal currently being marked as eaten.
  const [eatingId, setEatingId] = useState(null);

  /*
  =========================================================
   LOAD MEALS AND INVENTORY
  =========================================================

   GET /meal-plan:
   Retrieves the user's saved planned meals.

   GET /dashboard:
   Retrieves dashboard information, including inventory.

   Both requests use the Firebase ID token to identify
   the authenticated user.
  */
  const load = useCallback(async () => {
    // Do not request private data if nobody is signed in.
    if (!user) {
      setMeals([]);
      setInventory([]);
      setError("Please sign in to use the meal planner.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Obtain a fresh Firebase authentication token.
      const token = await user.getIdToken();

      // Load the meal plan and dashboard inventory together.
      // Promise.all waits for both API requests to finish.
      const [planResult, dashboardResult] = await Promise.all([
        apiRequest("/meal-plan", token),
        apiRequest("/dashboard", token),
      ]);

      // Make sure the backend returned an array of meals.
      // An unexpected response should be treated as an error.
      if (!Array.isArray(planResult)) {
        throw new Error(
          "The backend did not return a valid meal plan."
        );
      }

      // Extract inventory only when the dashboard response
      // contains an inventory array.
      const inventoryResult = Array.isArray(dashboardResult?.inventory)
        ? dashboardResult.inventory
        : [];

      // Save the retrieved data in React state.
      setMeals(planResult);
      setInventory(inventoryResult);

      // Inform the user if no inventory items were returned.
      if (inventoryResult.length === 0) {
        setError(
          "No inventory items were returned. Add food to inventory or check the dashboard API."
        );
      }
    } catch (err) {
      // Log the technical error for debugging.
      console.error("Meal planner loading error:", err);

      // Display a readable error message in the interface.
      setError(err?.message || "Unable to load the meal planner.");
    } finally {
      // Stop the loading indicator whether the request succeeds or fails.
      setLoading(false);
    }
  }, [user]);

  /*
   * Load the meal plan when the component first appears.
   *
   * The effect also runs again if the authenticated user changes.
   */
  useEffect(() => {
    load();
  }, [load]);

  /*
  =========================================================
   BUILD THE CALENDAR WEEK
  =========================================================
  */

  // Start with Monday of the current calendar week.
  const start = mondayOf(new Date());

  // Apply the selected previous-week or next-week offset.
  start.setDate(start.getDate() + weekOffset * 7);

  // Generate the seven calendar dates displayed on the page.
  const days = DAY_LABELS.map((label, index) => {
    const date = new Date(start);

    // Move forward one day for each calendar column.
    date.setDate(start.getDate() + index);

    return {
      label,
      iso: toISO(date),
      dayNum: date.getDate(),
    };
  });

  // Store today's date for highlighting the current calendar column.
  const todayISO = toISO(new Date());

  /*
   * Calculate the mission-week number.
   *
   * CREW.missionDay represents the current mission day.
   * weekOffset adjusts the displayed week.
   */
  const missionWeek = Math.max(
    1,
    Math.ceil(
      ((Number(CREW?.missionDay) || 1) + weekOffset * 7) / 7
    )
  );

  /*
  =========================================================
   GROUP MEALS BY DATE AND MEAL TYPE
  =========================================================

   Each meal is grouped using a combined date and meal-type key.

   Example:
   2026-10-28|breakfast

   This makes it easier to display the correct meal inside
   its corresponding calendar cell.
  */
  const grouped = {};

  for (const meal of meals) {
    // Normalize the meal date.
    const date = mealDate(meal);

    // Normalize the meal type to lowercase.
    const type = String(meal.mealType || "").toLowerCase();

    // Create a unique key for this date and meal type.
    const key = `${date}|${type}`;

    // Skip records that do not have a usable date or meal type.
    if (!date || !type) continue;

    // Create an empty array for this calendar cell if needed.
    if (!grouped[key]) {
      grouped[key] = [];
    }

    // Add the meal to its matching calendar cell.
    grouped[key].push(meal);
  }

  // Keep only meals that belong to the currently displayed week.
  const weekMeals = meals.filter((meal) =>
    days.some((day) => day.iso === mealDate(meal))
  );

  /*
  =========================================================
   ADD A PLANNED MEAL
  =========================================================

   Saves an inventory food item to the selected calendar date.

   IMPORTANT:
   Adding a planned meal does not record food as consumed.
  */
  async function addMeal(foodId) {
    // Stop if required information is missing or a save is running.
    if (!foodId || !adding || !user || saving) return;

    setSaving(true);
    setError("");

    try {
      // Get the authenticated user's Firebase token.
      const token = await user.getIdToken();

      // Send the selected food and calendar information to the backend.
      await apiRequest("/meal-plan", token, {
        method: "POST",
        body: JSON.stringify({
          date: adding.date,
          mealType: adding.mealType,
          foodId,
          servings: 1,
        }),
      });

      // Close the food picker after the meal is saved.
      setAdding(null);

      // Reload the calendar so the new meal appears.
      await load();
    } catch (err) {
      console.error("Unable to save planned meal:", err);

      setError(err?.message || "Could not save this meal.");
    } finally {
      // Allow the user to submit another meal.
      setSaving(false);
    }
  }

  /*
  =========================================================
   DELETE A PLANNED MEAL
  =========================================================

   Removes a saved meal from the weekly meal plan.
   This function does not delete the food from inventory.
  */
  async function deleteMeal(id) {
    // Prevent deletion if the ID or authenticated user is missing.
    // Also prevent another deletion while one is running.
    if (!id || !user || deletingId) return;

    setDeletingId(id);
    setError("");

    try {
      const token = await user.getIdToken();

      // Send a DELETE request for the selected meal.
      // encodeURIComponent protects the ID in the URL.
      await apiRequest(
        `/meal-plan/${encodeURIComponent(id)}`,
        token,
        { method: "DELETE" }
      );

      // Refresh the calendar after deletion.
      await load();
    } catch (err) {
      console.error("Unable to delete planned meal:", err);

      setError(err?.message || "Could not delete this meal.");
    } finally {
      // Clear the deletion indicator.
      setDeletingId(null);
    }
  }

  /*
  ===========================================================
   MARK A PLANNED MEAL AS EATEN
  ===========================================================

   1. Sends the meal ID to the authenticated backend.
   2. The backend creates a consumption log.
   3. Reloads the meal plan and dashboard.
   4. Prevents duplicate clicks while the request is running.

   This action changes a planned meal into a recorded
   consumption event.
  ===========================================================
  */
  async function markMealEaten(meal) {
    // Stop if the meal ID, user, or required information is missing.
    if (!meal?.id || !user || eatingId) return;

    // Do not record a meal that has already been eaten.
    if (meal.consumedAt) return;

    // Show which meal is currently being recorded.
    setEatingId(meal.id);
    setError("");

    try {
      // Get the Firebase authentication token.
      const token = await user.getIdToken();

      // Tell the backend to record this planned meal as consumed.
      await apiRequest(
        `/meal-plan/${encodeURIComponent(meal.id)}/eaten`,
        token,
        {
          method: "POST",
        }
      );

      // Refresh saved meals and dashboard data.
      await load();
    } catch (err) {
      console.error("Unable to record eaten meal:", err);

      setError(
        err?.message || "Could not mark this meal as eaten."
      );
    } finally {
      // Clear the eating indicator after the request finishes.
      setEatingId(null);
    }
  }

  /*
  ===========================================================
   SWAP A PLANNED MEAL
  ===========================================================

   Replaces an existing planned meal with another food
   item selected from available inventory.

   The backend receives the replacement food ID.
  ===========================================================
  */
  async function swapMeal(meal, replacementFood) {
    // Make sure both records and the authenticated user exist.
    // Prevent another swap while one is already running.
    if (!meal?.id || !replacementFood?.id || !user || swappingId) {
      return;
    }

    // Track the meal currently being replaced.
    setSwappingId(meal.id);
    setError("");

    try {
      const token = await user.getIdToken();

      // Send a PATCH request to replace the planned food.
      await apiRequest(
        `/meal-plan/${encodeURIComponent(meal.id)}/swap`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            foodId: String(replacementFood.id),
          }),
        }
      );

      // Reload the saved meal so the calendar and nutrition
      // calculations use the updated Firestore record.
      await load();
    } catch (err) {
      console.error("Unable to swap planned meal:", err);

      setError(err?.message || "Could not swap this meal.");
    } finally {
      // Clear the swap indicator.
      setSwappingId(null);
    }
  }

  /*
  =========================================================
   RATION CHECK: NUTRITION LOOKUP
  =========================================================

   A planned meal may already contain saved nutrition values.

   If those values are missing, the matching inventory item
   is used to calculate the meal's nutrition.

   This supports older planned meals that may not contain
   nutrition values in their saved Firestore records.
  */
  function getMealNutrition(meal, key) {
    // First check whether the planned meal already has
    // a saved nutrition value for the requested field.
    const savedValue = Number(meal?.[key]);

    // Use the saved value when it is a valid positive number.
    if (Number.isFinite(savedValue) && savedValue > 0) {
      return savedValue;
    }

    /*
     * Find the matching inventory record.
     *
     * Both IDs are converted to strings because API responses
     * may represent document IDs differently.
     */
    const food = inventory.find(
      (item) => String(item.id) === String(meal?.foodId)
    );

    // Without a matching inventory item, nutrition is unknown.
    if (!food) return 0;

    // Read the requested nutrition value from inventory.
    const foodValue = Number(food[key]);

    // Use the meal's serving count.
    // Default to one serving if the value is missing or zero.
    const servings = Number(meal?.servings) || 1;

    // Multiply nutrition per serving by the number of servings.
    // Invalid or non-positive values are treated as zero.
    return Number.isFinite(foodValue) && foodValue > 0
      ? foodValue * servings
      : 0;
  }

  /*
  =========================================================
   CALCULATE AVERAGE DAILY NUTRITION
  =========================================================

   Adds the nutrition values for all planned meals during
   the displayed week and divides each total by seven.

   This gives the average planned nutrition per calendar day.
  */
  const sumPerDay = (key) =>
    weekMeals.reduce(
      (total, meal) => total + getMealNutrition(meal, key),
      0
    ) / 7;

  /*
  =========================================================
   DAILY RATION TARGETS
  =========================================================

   Each nutrition category compares the average planned
   daily amount with its configured daily target.

   Defaults:
   Calories: 2,800 kcal
   Protein: 120 g
   Carbohydrates: 350 g
   Fat: 90 g
  */
  const ration = [
    {
      label: "Calories",
      value: sumPerDay("calories"),
      target: Number(TARGETS?.calories) || 2800,
      color: "#5ad1b0",
    },
    {
      label: "Protein",
      value: sumPerDay("protein"),
      target: Number(TARGETS?.protein) || 120,
      color: "#6c63ff",
    },
    {
      label: "Carbs",
      value: sumPerDay("carbs"),
      target: Number(TARGETS?.carbs) || 350,
      color: "#f9d56e",
    },
    {
      label: "Fat",
      value: sumPerDay("fat"),
      target: Number(TARGETS?.fat) || 90,
      color: "#ee5fa7",
    },
  ].map((item) => ({
    ...item,

    // Calculate how much of the daily target is planned.
    // A value of 100 means the target is fully met.
    pct:
      item.target > 0
        ? Math.round((item.value / item.target) * 100)
        : 0,
  }));

  /*
  =========================================================
   SUGGESTED FOOD SWAP
  =========================================================

   Finds a planned meal whose inventory food is LOW or EXPIRED.

   Then searches inventory for an alternative food item that:
   - Has an ID and name.
   - Has a valid quantity greater than zero.
   - Is not LOW or EXPIRED.
   - Is not the same food as the meal being replaced.
  */

  // Create an object that allows inventory records
  // to be found quickly using their IDs.
  const byId = Object.fromEntries(
    inventory.map((food) => [String(food.id), food])
  );

  // Find the first planned meal that uses low-stock
  // or expired inventory.
  const lowMeal = weekMeals
    .filter((meal) =>
      ["LOW", "EXPIRED"].includes(
        String(
          byId[String(meal.foodId)]?.status || ""
        ).toUpperCase()
      )
    )

    // Sort matching meals by date so the earliest meal
    // in the displayed week is considered first.
    .sort((a, b) => mealDate(a).localeCompare(mealDate(b)))[0];

  /*
   * Find an available replacement food.
   *
   * Foods with LOW or EXPIRED status are excluded.
   * Foods marked EXPIRING can still be suggested.
   */
  const alternative = inventory
    .filter((food) => {
      // Normalize the inventory status.
      const status = String(food.status || "OK").toUpperCase();

      // Convert quantity to a number for validation.
      const quantity = Number(food.quantity);

      // Require a valid food ID, name, and positive quantity.
      if (
        food.id == null ||
        !food.name ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return false;
      }

      // Exclude low-stock and expired inventory.
      // Food expiring soon can still be suggested.
      if (status === "LOW" || status === "EXPIRED") {
        return false;
      }

      // Do not suggest the food already being replaced.
      if (
        lowMeal &&
        String(food.id) === String(lowMeal.foodId)
      ) {
        return false;
      }

      return true;
    })

    // Prefer the food with the largest available quantity.
    .sort(
      (a, b) => Number(b.quantity) - Number(a.quantity)
    )[0];

  /*
   * TEMPORARY DEBUGGING
   *
   * This console output helps identify why a suggested
   * replacement may not be appearing.
   *
   * It displays:
   * - Number of inventory items.
   * - Inventory IDs, names, quantities, and statuses.
   * - The planned meal identified as low or expired.
   * - The selected replacement food.
   *
   * Remove this debugging output after resolving the
   * suggested-swap issue.
   */
  console.log("SpaceByte suggested-swap debug:", {
    inventoryCount: inventory.length,
    inventory: inventory.map((food) => ({
      id: food.id,
      name: food.name,
      quantity: food.quantity,
      status: food.status,
    })),
    lowMeal: lowMeal
      ? {
          id: lowMeal.id,
          foodId: lowMeal.foodId,
          foodName: lowMeal.foodName,
        }
      : null,
    alternative: alternative || null,
  });

  // Default message when there are no low-stock planned meals.
  let swapText = "Everything planned this week is well stocked.";

  // Display a specific replacement suggestion when possible.
  if (lowMeal && alternative) {
    // Find the day containing the low-stock planned meal.
    const dayIndex = days.findIndex(
      (day) => day.iso === mealDate(lowMeal)
    );

    // Convert the calendar label into a readable day name.
    const dayName =
      dayIndex >= 0
        ? DAY_LABELS[dayIndex][0] +
          DAY_LABELS[dayIndex].slice(1).toLowerCase()
        : "that day";

    // Build the replacement suggestion.
    swapText = `${
      lowMeal.foodName || "Planned food"
    } is running low. Try ${alternative.name} on ${dayName}.`;
  } else if (lowMeal) {
    // Explain why a replacement cannot currently be suggested.
    swapText =
      "A planned food is running low. Add available food to inventory to see a suggested swap.";
  }

  /*
  =========================================================
   LOADING SCREEN
  =========================================================

   Displayed while the meal plan and dashboard inventory
   are being retrieved from the backend.
  */
  if (loading) {
    return (
      <div className="sb-planner">
        <p className="sb-muted" role="status">
          Loading meal plan…
        </p>
      </div>
    );
  }

  /*
  =========================================================
   MEAL PLANNER PAGE
  =========================================================
  */
  return (
    <div className="sb-planner">
      <div className="sb-planner-main">
        {/* Page heading and mission-week information */}
        <div className="sb-planner-top">
          <div className="sb-week-title">
            <h2>Week {missionWeek}</h2>

            <span className="sb-muted">
              Crew of {CREW?.size ?? 1} ·{" "}
              {(Number(TARGETS?.calories) || 2800).toLocaleString()} kcal
              target
            </span>
          </div>

          {/* Existing calendar view buttons */}
          <div className="sb-pills">
            <button type="button" className="sb-pill active">
              Week
            </button>

            <button
              type="button"
              className="sb-pill"
              disabled
              title="Coming soon"
            >
              Month
            </button>

            <button
              type="button"
              className="sb-pill"
              disabled
              title="Coming soon"
            >
              Mission
            </button>
          </div>
        </div>

        {/* Buttons for moving between calendar weeks */}
        <div className="sb-week-nav">
          <button
            type="button"
            className="sb-link"
            onClick={() => {
              // Close the food picker when changing weeks.
              setAdding(null);

              // Display the previous week.
              setWeekOffset((offset) => offset - 1);
            }}
          >
            ← Previous
          </button>

          <button
            type="button"
            className="sb-link"
            onClick={() => {
              // Close the food picker and return to this week.
              setAdding(null);
              setWeekOffset(0);
            }}
          >
            This week
          </button>

          <button
            type="button"
            className="sb-link"
            onClick={() => {
              // Close the food picker and display the next week.
              setAdding(null);
              setWeekOffset((offset) => offset + 1);
            }}
          >
            Next →
          </button>
        </div>

        {/* Display API and validation errors */}
        {error && (
          <p className="sb-error" role="alert">
            {error}
          </p>
        )}

        {/* Weekly calendar grid */}
        <div className="sb-grid">
          {/* Empty corner above the meal-type labels */}
          <div />

          {/* Generate the seven day headings */}
          {days.map((day) => (
            <div
              key={day.iso}
              className={`sb-day-head ${
                day.iso === todayISO ? "today" : ""
              }`}
            >
              {day.label}
              <small>{day.dayNum}</small>
            </div>
          ))}

          {/* Generate one calendar row for each meal type */}
          {MEAL_TYPES.map((type) => (
            <FragmentRow key={type}>
              {/* Meal-type label at the beginning of each row */}
              <div
                className="sb-row-label"
                style={{ color: TYPE_COLORS[type] }}
              >
                {type.toUpperCase()}
              </div>

              {/* Generate the seven calendar cells for this meal type */}
              {days.map((day) => {
                // Identify the current date and meal-type combination.
                const key = `${day.iso}|${type}`;

                // Retrieve meals assigned to this calendar cell.
                const list = grouped[key] || [];

                // Check whether this cell currently has the food picker open.
                const isAdding =
                  adding?.date === day.iso &&
                  adding?.mealType === type;

                // The first saved meal is displayed in the cell.
                const first = list[0];

                return (
                  <div
                    key={`${day.iso}-${type}`}
                    className={`sb-cell ${
                      day.iso === todayISO ? "today" : ""
                    } ${list.length === 0 ? "empty" : ""}`}
                    onClick={() => {
                      // Clicking an empty cell opens its food picker.
                      if (
                        list.length === 0 &&
                        !isAdding &&
                        !saving
                      ) {
                        setError("");

                        // Remember which date and meal type are being edited.
                        setAdding({
                          date: day.iso,
                          mealType: type,
                        });
                      }
                    }}
                  >
                    {/* =========================================
                        FOOD SELECTION DROPDOWN
                        ========================================= */}
                    {isAdding ? (
                      <div
                        className="sb-meal-picker"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <select
                          autoFocus
                          value=""
                          disabled={saving || inventory.length === 0}
                          aria-label={`Choose food for ${type} on ${day.iso}`}
                          onChange={(event) => {
                            // Get the selected inventory document ID.
                            const foodId = event.target.value;

                            // Save the selected food if an ID was provided.
                            if (foodId) {
                              addMeal(foodId);
                            }
                          }}
                        >
                          <option value="" disabled>
                            {saving ? "Saving…" : "Pick food…"}
                          </option>

                          {/* Display available inventory items as options */}
                          {inventory.map((food) => {
                            // Convert the inventory document ID to a string.
                            const foodId =
                              food.id == null ? "" : String(food.id);

                            // Determine whether the food has any stock.
                            const outOfStock =
                              Number(food.quantity) <= 0;

                            return (
                              <option
                                key={foodId || food.name}
                                value={foodId}
                                disabled={
                                  !foodId ||
                                  !food.name ||
                                  outOfStock
                                }
                              >
                                {food.name || "Unnamed food"}
                                {outOfStock ? " — Out of stock" : ""}
                              </option>
                            );
                          })}
                        </select>

                        {/* Close the food picker without saving */}
                        <button
                          type="button"
                          className="sb-link"
                          disabled={saving}
                          onClick={() => setAdding(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : first ? (
                      /*
                       * =======================================
                       * DISPLAY A SAVED PLANNED MEAL
                       * =======================================
                       */
                      <>
                        {/* Food icon based on the saved food name */}
                        <span
                          className="sb-cell-icon"
                          style={{ color: TYPE_COLORS[type] }}
                          aria-hidden="true"
                        >
                          {foodIcon(first.foodName || "")}
                        </span>

                        {/* Display the planned food name */}
                        <span>
                          {first.foodName || "Planned food"}
                        </span>

                        {/* =====================================
                            EATEN STATUS
                            =====================================

                            If consumedAt exists, the meal has
                            already been recorded as eaten.

                            Otherwise, display a button that
                            sends the meal to the backend.
                        */}
                        {first.consumedAt ? (
                          <small
                            className="sb-muted"
                            role="status"
                            title="This meal has been recorded as eaten."
                          >
                            ✓ Eaten
                          </small>
                        ) : (
                          <button
                            type="button"
                            className="sb-link"
                            disabled={eatingId !== null}
                            onClick={(event) => {
                              // Prevent the calendar cell click handler from running.
                              event.stopPropagation();

                              // Record this meal as consumed.
                              markMealEaten(first);
                            }}
                          >
                            {eatingId === first.id
                              ? "Recording…"
                              : "Mark as eaten"}
                          </button>
                        )}

                        {/* Show how many additional meals share this cell */}
                        {list.length > 1 && (
                          <small className="sb-more">
                            +{list.length - 1} more
                          </small>
                        )}

                        {/* Delete the first displayed planned meal */}
                        <button
                          type="button"
                          className="sb-x"
                          aria-label={`Remove ${first.foodName || "planned meal"}`}
                          title="Delete planned meal"
                          disabled={deletingId === first.id}
                          onClick={(event) => {
                            // Prevent the calendar cell click handler from running.
                            event.stopPropagation();

                            // Delete the selected planned meal.
                            deleteMeal(first.id);
                          }}
                        >
                          {deletingId === first.id ? "…" : "×"}
                        </button>
                      </>
                    ) : (
                      /*
                       * =======================================
                       * EMPTY CALENDAR CELL
                       * =======================================
                       *
                       * Clicking the plus button opens the
                       * inventory food picker.
                       */
                      <button
                        type="button"
                        className="sb-plus"
                        aria-label={`Add ${type} for ${day.iso}`}
                        onClick={(event) => {
                          // Prevent the parent cell click handler from running.
                          event.stopPropagation();

                          setError("");

                          // Open the food picker for this date and meal type.
                          setAdding({
                            date: day.iso,
                            mealType: type,
                          });
                        }}
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })}
            </FragmentRow>
          ))}
        </div>

        {/* Explain what to do if inventory is empty */}
        {inventory.length === 0 && (
          <p className="sb-muted">
            Add food to your inventory before planning meals.
          </p>
        )}
      </div>

      {/* =====================================================
          RATION CHECK PANEL
          =====================================================

          Displays average planned daily nutrition compared
          with the configured nutrition targets.
      */}
      <aside className="sb-panel sb-ration">
        <h3>Ration check</h3>

        <p className="sb-muted">
          Average planned nutrition per day for the displayed week.
        </p>

        {/* Display each nutrition category */}
        {ration.map((item) => (
          <div key={item.label} className="sb-ration-row">
            <div>
              {/* Nutrition category name */}
              <span>{item.label}</span>

              {/* Percentage of the daily target */}
              <b style={{ color: item.color }}>
                {item.pct}%
              </b>
            </div>

            {/* Progress bar comparing the planned amount with the target */}
            <div
              className="sb-bar"
              role="progressbar"
              aria-label={`${item.label} compared with target`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.max(
                0,
                Math.min(100, item.pct)
              )}
            >
              <i
                style={{
                  // Keep the visible progress bar between 0% and 100%.
                  width: `${Math.max(
                    0,
                    Math.min(100, item.pct)
                  )}%`,
                  background: item.color,
                }}
              />
            </div>

            {/* Display the planned amount and daily target */}
            <small className="sb-muted">
              {Math.round(item.value).toLocaleString()} /{" "}
              {item.target.toLocaleString()}
              {item.label === "Calories" ? " kcal" : " g"}
            </small>
          </div>
        ))}

        {/* ================================================
            SUGGESTED FOOD REPLACEMENT
            ================================================

            Displays a suggested alternative when a planned
            meal uses low-stock or expired inventory.
        */}
        <div className="sb-swap">
          <strong>⇄ Suggested swap</strong>

          {/* Display the replacement suggestion */}
          <p>{swapText}</p>

          {/* Only show the replacement button when both
              a low-stock meal and an alternative exist. */}
          {lowMeal && alternative && (
            <button
              type="button"
              className="sb-pill active sb-swap-button"
              disabled={
                swappingId !== null ||
                deletingId !== null ||
                saving
              }
              onClick={() => swapMeal(lowMeal, alternative)}
            >
              {swappingId === lowMeal.id
                ? "Swapping..."
                : `Replace with ${alternative.name}`}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

/*
===========================================================
 FRAGMENT ROW HELPER
===========================================================

 This helper returns its children without adding another
 HTML element to the calendar.

 It allows the meal-type label and seven day cells to remain
 direct children of the calendar grid, preserving the
 existing CSS Grid layout.
*/
function FragmentRow({ children }) {
  return <>{children}</>;
}
