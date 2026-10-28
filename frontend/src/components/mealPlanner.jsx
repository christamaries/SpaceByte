

/*
===========================================================
 SPACEBYTE - WEEKLY MEAL PLANNER
===========================================================

 File:
 frontend/src/components/mealPlanner.jsx

 Features:
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
 This file does not record food as eaten.
===========================================================
*/

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";
import { CREW, TARGETS, foodIcon } from "../spacebyteConfig";

// Meal types displayed in the calendar.
const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

// Calendar column labels.
const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// Colors used for meal types.
const TYPE_COLORS = {
  breakfast: "#f9d56e",
  lunch: "#5ad1b0",
  dinner: "#6c63ff",
};

/*
 * Convert a date to YYYY-MM-DD using local time.
 * This avoids unexpected date changes caused by UTC conversion.
 */
function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * Get the Monday at the beginning of a week.
 */
function mondayOf(date) {
  const monday = new Date(date);

  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return monday;
}

/*
 * Normalize a saved meal date to YYYY-MM-DD.
 */
function mealDate(meal) {
  if (!meal?.date) return "";

  if (typeof meal.date === "string") {
    return meal.date.slice(0, 10);
  }

  // Handle a Firestore Timestamp serialized as an object.
  if (typeof meal.date === "object" && meal.date._seconds) {
    return toISO(new Date(meal.date._seconds * 1000));
  }

  return "";
}

export default function MealPlanner({ user }) {
  // Saved planned meals returned by the backend.
  const [meals, setMeals] = useState([]);

  // Food items available for planning.
  const [inventory, setInventory] = useState([]);

  // Current calendar week offset.
  const [weekOffset, setWeekOffset] = useState(0);

  // Identifies the calendar cell currently showing a food picker.
  const [adding, setAdding] = useState(null);

  // Displays errors from the API.
  const [error, setError] = useState("");

  // Shows the loading screen while API requests are running.
  const [loading, setLoading] = useState(true);

  // Prevents duplicate meal submissions.
  const [saving, setSaving] = useState(false);

  // Identifies the meal currently being deleted.
  const [deletingId, setDeletingId] = useState(null);

  /*
   * LOAD MEALS AND INVENTORY
   *
   * GET /meal-plan returns saved meals.
   * GET /dashboard returns dashboard data, including inventory.
   */
  const load = useCallback(async () => {
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
      // Obtain a fresh Firebase ID token.
      const token = await user.getIdToken();

      // Request the saved plan and dashboard inventory.
      const [planResult, dashboardResult] = await Promise.all([
        apiRequest("/meal-plan", token),
        apiRequest("/dashboard", token),
      ]);

      // Do not silently accept an invalid meal-plan response.
      if (!Array.isArray(planResult)) {
        throw new Error(
          "The backend did not return a valid meal plan."
        );
      }

      // Extract inventory only if the response contains an array.
      const inventoryResult = Array.isArray(dashboardResult?.inventory)
        ? dashboardResult.inventory
        : [];

      setMeals(planResult);
      setInventory(inventoryResult);

      // Show a helpful message if there is no food to plan.
      if (inventoryResult.length === 0) {
        setError(
          "No inventory items were returned. Add food to inventory or check the dashboard API."
        );
      }
    } catch (err) {
      console.error("Meal planner loading error:", err);
      setError(err?.message || "Unable to load the meal planner.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load data on first render and whenever the user changes.
  useEffect(() => {
    load();
  }, [load]);

  /*
   * BUILD THE CALENDAR WEEK
   */
  const start = mondayOf(new Date());

  start.setDate(start.getDate() + weekOffset * 7);

  const days = DAY_LABELS.map((label, index) => {
    const date = new Date(start);

    date.setDate(start.getDate() + index);

    return {
      label,
      iso: toISO(date),
      dayNum: date.getDate(),
    };
  });

  const todayISO = toISO(new Date());

  // Calculate the displayed mission-week number.
  const missionWeek = Math.max(
    1,
    Math.ceil(
      ((Number(CREW?.missionDay) || 1) + weekOffset * 7) / 7
    )
  );

  /*
   * GROUP MEALS BY DATE AND MEAL TYPE
   *
   * Example key:
   * 2026-10-28|breakfast
   */
  const grouped = {};

  for (const meal of meals) {
    const date = mealDate(meal);
    const type = String(meal.mealType || "").toLowerCase();
    const key = `${date}|${type}`;

    if (!date || !type) continue;

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(meal);
  }

  // Keep meals belonging to the displayed week.
  const weekMeals = meals.filter((meal) =>
    days.some((day) => day.iso === mealDate(meal))
  );

  /*
   * ADD A PLANNED MEAL
   *
   * Saves the selected inventory item for the chosen date.
   * This does not mark the food as consumed.
   */
  async function addMeal(foodId) {
    if (!foodId || !adding || !user || saving) return;

    setSaving(true);
    setError("");

    try {
      const token = await user.getIdToken();

      await apiRequest("/meal-plan", token, {
        method: "POST",
        body: JSON.stringify({
          date: adding.date,
          mealType: adding.mealType,
          foodId,
          servings: 1,
        }),
      });

      // Close the picker after the save succeeds.
      setAdding(null);

      // Reload the saved meals from the backend.
      await load();
    } catch (err) {
      console.error("Unable to save planned meal:", err);
      setError(err?.message || "Could not save this meal.");
    } finally {
      setSaving(false);
    }
  }

  /*
   * DELETE A PLANNED MEAL
   */
  async function deleteMeal(id) {
    if (!id || !user || deletingId) return;

    setDeletingId(id);
    setError("");

    try {
      const token = await user.getIdToken();

      await apiRequest(
        `/meal-plan/${encodeURIComponent(id)}`,
        token,
        { method: "DELETE" }
      );

      // Refresh the calendar after deleting the meal.
      await load();
    } catch (err) {
      console.error("Unable to delete planned meal:", err);
      setError(err?.message || "Could not delete this meal.");
    } finally {
      setDeletingId(null);
    }
  }

  /*
   * =========================================================
   * RATION CHECK: NUTRITION LOOKUP
   * =========================================================
   *
   * A planned meal may already contain saved nutrition values.
   * If it does not, look up the matching inventory item.
   *
   * This allows older planned meals to use inventory nutrition
   * without requiring the user to delete and recreate them.
   */
  function getMealNutrition(meal, key) {
    // Use the nutrition value stored on the planned meal first.
    const savedValue = Number(meal?.[key]);

    if (Number.isFinite(savedValue) && savedValue > 0) {
      return savedValue;
    }

    /*
     * Find the matching inventory record.
     *
     * Both IDs are converted to strings because API responses
     * may represent IDs differently.
     */
    const food = inventory.find(
      (item) => String(item.id) === String(meal?.foodId)
    );

    // Without a matching inventory item, nutrition is unknown.
    if (!food) return 0;

    // Get the nutrition amount stored on the inventory item.
    const foodValue = Number(food[key]);

    // Account for the number of servings in the planned meal.
    const servings = Number(meal?.servings) || 1;

    // Ignore missing, invalid, or non-positive nutrition values.
    return Number.isFinite(foodValue) && foodValue > 0
      ? foodValue * servings
      : 0;
  }

  /*
   * Calculate average planned nutrition per day.
   *
   * First add up the nutrition for every meal in the displayed
   * week, then divide by seven calendar days.
   */
  const sumPerDay = (key) =>
    weekMeals.reduce(
      (total, meal) => total + getMealNutrition(meal, key),
      0
    ) / 7;

  /*
   * Set the daily nutrition targets.
   * These defaults match the targets currently displayed in
   * your Ration Check: 2,800 calories, 120 g protein,
   * 350 g carbohydrates, and 90 g fat.
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
    pct:
      item.target > 0
        ? Math.round((item.value / item.target) * 100)
        : 0,
  }));

  /*
   * SUGGESTED SWAP
   *
   * Suggest an alternative when a planned food is marked LOW
   * or EXPIRED in inventory.
   */
  const byId = Object.fromEntries(
    inventory.map((food) => [String(food.id), food])
  );

  const lowMeal = weekMeals
    .filter((meal) =>
      ["LOW", "EXPIRED"].includes(
        String(
          byId[String(meal.foodId)]?.status || ""
        ).toUpperCase()
      )
    )
    .sort((a, b) => mealDate(a).localeCompare(mealDate(b)))[0];

  const alternative = inventory
    .filter((food) => {
      const status = String(food.status || "OK").toUpperCase();

      return (
        status === "OK" &&
        Number(food.calories) > 0 &&
        Number(food.quantity) > 0
      );
    })
    .sort((a, b) => Number(b.quantity) - Number(a.quantity))[0];

  let swapText = "Everything planned this week is well stocked.";

  if (lowMeal && alternative) {
    const dayIndex = days.findIndex(
      (day) => day.iso === mealDate(lowMeal)
    );

    const dayName =
      dayIndex >= 0
        ? DAY_LABELS[dayIndex][0] +
          DAY_LABELS[dayIndex].slice(1).toLowerCase()
        : "that day";

    swapText = `${
      lowMeal.foodName || "Planned food"
    } is running low. Try ${alternative.name} on ${dayName}.`;
  } else if (lowMeal) {
    swapText =
      "A planned food is running low. Add available food to inventory to see a suggested swap.";
  }

  /*
   * LOADING SCREEN
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
   * =========================================================
   * MEAL PLANNER PAGE
   * =========================================================
   */
  return (
    <div className="sb-planner">
      <div className="sb-planner-main">
        {/* Page heading */}
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

        {/* Calendar navigation */}
        <div className="sb-week-nav">
          <button
            type="button"
            className="sb-link"
            onClick={() => {
              setAdding(null);
              setWeekOffset((offset) => offset - 1);
            }}
          >
            ← Previous
          </button>

          <button
            type="button"
            className="sb-link"
            onClick={() => {
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
              setAdding(null);
              setWeekOffset((offset) => offset + 1);
            }}
          >
            Next →
          </button>
        </div>

        {/* Display errors returned by the backend */}
        {error && (
          <p className="sb-error" role="alert">
            {error}
          </p>
        )}

        {/* Weekly meal calendar */}
        <div className="sb-grid">
          {/* Empty corner above the meal-type labels */}
          <div />

          {/* Day headings */}
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

          {/* Render breakfast, lunch, and dinner */}
          {MEAL_TYPES.map((type) => (
            <FragmentRow key={type}>
              <div
                className="sb-row-label"
                style={{ color: TYPE_COLORS[type] }}
              >
                {type.toUpperCase()}
              </div>

              {days.map((day) => {
                const key = `${day.iso}|${type}`;
                const list = grouped[key] || [];

                const isAdding =
                  adding?.date === day.iso &&
                  adding?.mealType === type;

                // The first meal is displayed in the calendar cell.
                const first = list[0];

                return (
                  <div
                    key={`${day.iso}-${type}`}
                    className={`sb-cell ${
                      day.iso === todayISO ? "today" : ""
                    } ${list.length === 0 ? "empty" : ""}`}
                    onClick={() => {
                      // Empty cells can open the food picker.
                      if (
                        list.length === 0 &&
                        !isAdding &&
                        !saving
                      ) {
                        setError("");
                        setAdding({
                          date: day.iso,
                          mealType: type,
                        });
                      }
                    }}
                  >
                    {/* Food selection dropdown */}
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
                            const foodId = event.target.value;

                            if (foodId) {
                              addMeal(foodId);
                            }
                          }}
                        >
                          <option value="" disabled>
                            {saving ? "Saving…" : "Pick food…"}
                          </option>

                          {inventory.map((food) => {
                            // The inventory item must have a document ID.
                            const foodId =
                              food.id == null ? "" : String(food.id);

                            // Prevent selection of empty-stock items.
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
                      /* Display the saved planned meal */
                      <>
                        <span
                          className="sb-cell-icon"
                          style={{ color: TYPE_COLORS[type] }}
                          aria-hidden="true"
                        >
                          {foodIcon(first.foodName || "")}
                        </span>

                        <span>
                          {first.foodName || "Planned food"}
                        </span>

                        {/* Indicate when multiple meals share a cell */}
                        {list.length > 1 && (
                          <small className="sb-more">
                            +{list.length - 1} more
                          </small>
                        )}

                        {/* Delete the first displayed meal */}
                        <button
                          type="button"
                          className="sb-x"
                          aria-label={`Remove ${first.foodName || "planned meal"}`}
                          title="Delete planned meal"
                          disabled={deletingId === first.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteMeal(first.id);
                          }}
                        >
                          {deletingId === first.id ? "…" : "×"}
                        </button>
                      </>
                    ) : (
                      /* Add button for an empty cell */
                      <button
                        type="button"
                        className="sb-plus"
                        aria-label={`Add ${type} for ${day.iso}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setError("");
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

        {/* Empty-inventory guidance */}
        {inventory.length === 0 && (
          <p className="sb-muted">
            Add food to your inventory before planning meals.
          </p>
        )}
      </div>

      {/* =====================================================
          RATION CHECK PANEL
          ===================================================== */}
      <aside className="sb-panel sb-ration">
        <h3>Ration check</h3>

        <p className="sb-muted">
          Average planned nutrition per day for the displayed week.
        </p>

        {/* Display each nutrition total and target */}
        {ration.map((item) => (
          <div key={item.label} className="sb-ration-row">
            <div>
              <span>{item.label}</span>

              <b style={{ color: item.color }}>
                {item.pct}%
              </b>
            </div>

            {/* Progress bar comparing the daily average with target */}
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
                  width: `${Math.max(
                    0,
                    Math.min(100, item.pct)
                  )}%`,
                  background: item.color,
                }}
              />
            </div>

            {/* Current average versus daily target */}
            <small className="sb-muted">
              {Math.round(item.value).toLocaleString()} /{" "}
              {item.target.toLocaleString()}
              {item.label === "Calories" ? " kcal" : " g"}
            </small>
          </div>
        ))}

        {/* Suggested food replacement */}
        <div className="sb-swap">
          <strong>⇄ Suggested swap</strong>
          <p>{swapText}</p>
        </div>
      </aside>
    </div>
  );
}

/*
 * Keep each meal row's cells as direct children of the calendar grid.
 * This preserves the existing CSS Grid layout.
 */
function FragmentRow({ children }) {
  return <>{children}</>;
}
