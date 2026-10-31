
/*
===========================================================
 SPACEBYTE - NUTRITION PAGE
 File: frontend/src/components/Nutrition.jsx
===========================================================

 PURPOSE:
 1. Load today's nutrition from the existing backend.
 2. Display calories, protein, carbohydrates, and fat.
 3. Show progress toward the daily calorie target.
 4. Preserve Firebase authentication.
 5. Display loading, error, and empty states.

 API:
 GET /nutrition/today

 HOW IT WORKS:
 The frontend requests nutrition information from the backend.
 The backend calculates totals using the user's recorded
 food consumption and returns the nutrition information.

 IMPORTANT:
 Inventory food is not automatically counted as consumed.
 Food must be recorded as eaten before it appears in the
 nutrition totals.

===========================================================
*/

// Import React hooks.
//
// useState: Stores nutrition data and page status.
// useEffect: Loads nutrition when the component appears.
// useCallback: Keeps the API loading function stable.
import { useCallback, useEffect, useState } from "react";

// Import the shared API helper used to communicate with
// the authenticated SpaceByte backend.
import { apiRequest } from "../api";

// Import the existing SpaceByte stylesheet.
// This file contains the CSS classes used by this page.
import "../spacebyte-ui.css";

// Default daily calorie target used when the backend
// does not return a valid calorie target.
const DEFAULT_TARGET = 2800;

/*
===========================================================
 FORMAT NUMBER
===========================================================

 Converts a value into a readable number.

 Examples:
 1200     becomes 1,200
 1200.5   becomes 1,200.5
 undefined becomes 0

 This keeps nutrition values consistent throughout the page.
*/
function formatNumber(value) {
  // Convert the supplied value into a JavaScript number.
  const number = Number(value);

  // Return zero if the value is invalid or not a number.
  if (!Number.isFinite(number)) {
    return "0";
  }

  // Format the number with commas and a maximum of
  // one decimal place.
  return number.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

/*
===========================================================
 NUTRITION CARD COMPONENT
===========================================================

 Displays one nutrient category.

 PROPS:
 label:       Name of the nutrient.
 value:       Amount consumed.
 unit:        Measurement unit, such as grams.
 icon:        Decorative symbol.
 description: Short explanation of the nutrient.

 This component is reused for protein, carbohydrates,
 and fat to avoid repeating the same HTML structure.
*/
function NutritionCard({ label, value, unit, icon, description }) {
  return (
    <article className="sb-nutrition-card">

      {/* Display the nutrient icon and its name */}
      <div className="sb-nutrition-card-top">
        <span className="sb-nutrition-icon" aria-hidden="true">
          {icon}
        </span>

        <span className="sb-nutrition-card-label">
          {label}
        </span>
      </div>

      {/* Display the nutrient amount and measurement unit */}
      <div className="sb-nutrition-value">
        {formatNumber(value)}
        <span>{unit}</span>
      </div>

      {/* Display a short description of the nutrient */}
      <p className="sb-nutrition-description">
        {description}
      </p>
    </article>
  );
}

/*
===========================================================
 NUTRITION PAGE COMPONENT
===========================================================

 The user prop contains the currently authenticated
 Firebase user.

 The component uses this user to obtain an authentication
 token before requesting private nutrition information.
*/
export default function Nutrition({ user }) {

  // Stores the nutrition information returned by the backend.
  // null means that nutrition data has not been loaded yet.
  const [nutrition, setNutrition] = useState(null);

  // Controls the initial loading screen.
  const [loading, setLoading] = useState(true);

  // Tracks whether the user is manually refreshing the data.
  const [refreshing, setRefreshing] = useState(false);

  // Stores API errors that should be displayed to the user.
  const [error, setError] = useState("");

  /*
  =========================================================
   LOAD TODAY'S NUTRITION
  =========================================================

   This function:
   1. Checks whether a user is signed in.
   2. Gets a Firebase authentication token.
   3. Requests today's nutrition from the backend.
   4. Saves the returned nutrition values in React state.
   5. Handles errors and loading indicators.

   isRefresh:
   false = initial page load.
   true  = user manually refreshes the page.
  */
  const loadNutrition = useCallback(async (isRefresh = false) => {

    // Do not request private nutrition information
    // when the user is not authenticated.
    if (!user) {
      setNutrition(null);
      setError("Please sign in to view your nutrition.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Display the appropriate loading indicator.
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    // Clear any previous error before making the request.
    setError("");

    try {
      /*
       * Obtain a fresh Firebase ID token.
       *
       * The backend uses this token to identify the
       * authenticated user and protect private API routes.
       */
      const token = await user.getIdToken();

      /*
       * Request today's nutrition information.
       *
       * API endpoint:
       * GET /nutrition/today
       *
       * The shared apiRequest helper attaches the token
       * to the request.
       */
      const result = await apiRequest(
        "/nutrition/today",
        token
      );

      /*
       * Save the backend response in React state.
       *
       * Number() converts returned values into numbers.
       * The fallback values prevent missing fields from
       * causing calculation or display errors.
       */
      setNutrition({
        calories: Number(result?.calories) || 0,
        protein: Number(result?.protein) || 0,
        carbs: Number(result?.carbs) || 0,
        fat: Number(result?.fat) || 0,

        // Use the backend calorie target when it is valid.
        // Otherwise, use the default 2,800 calorie target.
        calorieTarget:
          Number(result?.calorieTarget) > 0
            ? Number(result.calorieTarget)
            : DEFAULT_TARGET,

        // Store the calorie percentage returned by the backend.
        caloriePercentage:
          Number(result?.caloriePercentage) || 0,
      });

    } catch (err) {
      // Log the original error to help with debugging.
      console.error("Unable to load nutrition:", err);

      // Display a readable error message on the page.
      setError(
        err?.message ||
          "Unable to load nutrition. Please try again."
      );

    } finally {
      // Stop both loading indicators when the request finishes.
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  /*
   * Load nutrition when the component first appears.
   *
   * The effect runs again if the authenticated user changes.
   */
  useEffect(() => {
    loadNutrition();
  }, [loadNutrition]);

  /*
  =========================================================
   CALCULATE CALORIE PROGRESS
  =========================================================
  */

  // Current calories consumed today.
  const calories = nutrition?.calories ?? 0;

  // Daily calorie target returned by the backend.
  // Use the default target if nutrition has not loaded.
  const target = nutrition?.calorieTarget ?? DEFAULT_TARGET;

  // Calculate calories remaining.
  //
  // Math.max prevents the remaining amount from becoming
  // negative after the user reaches the daily target.
  const remaining = Math.max(0, target - calories);

  // Calculate the percentage of the daily calorie target met.
  //
  // Math.min prevents the progress bar from exceeding 100%.
  const percentage =
    target > 0
      ? Math.min(100, Math.round((calories / target) * 100))
      : 0;

  /*
  =========================================================
   INITIAL LOADING SCREEN
  =========================================================

   Displayed while the backend is retrieving nutrition data.
  */
  if (loading) {
    return (
      <section className="sb-nutrition-page">

        {/* Page heading displayed during loading */}
        <div className="sb-nutrition-header">
          <div>
            <p className="sb-nutrition-eyebrow">
              CREW WELLNESS
            </p>

            <h1>Nutrition</h1>

            <p>Loading your nutrition summary...</p>
          </div>
        </div>

        {/* Loading message and animated spinner */}
        <div className="sb-nutrition-message" role="status">
          <span className="sb-nutrition-spinner" />
          Loading today's nutrition data...
        </div>
      </section>
    );
  }

  /*
  =========================================================
   NUTRITION PAGE DISPLAY
  =========================================================

   Once loading finishes, display the nutrition dashboard.
  */
  return (
    <section className="sb-nutrition-page">

      {/* ================================================
          PAGE HEADER
          ================================================ */}
      <header className="sb-nutrition-header">
        <div>
          <p className="sb-nutrition-eyebrow">
            CREW WELLNESS
          </p>

          <h1>Nutrition</h1>

          <p>
            Track your daily fuel and monitor your nutritional
            intake.
          </p>
        </div>

        {/* Refresh button retrieves the latest nutrition data */}
        <button
          type="button"
          className="sb-nutrition-refresh"
          onClick={() => loadNutrition(true)}
          disabled={refreshing}
        >
          <span aria-hidden="true">↻</span>

          {/* Change the button label while refreshing */}
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* ================================================
          ERROR MESSAGE
          ================================================

          Displayed when the backend request fails.
          The user can try loading the nutrition information again.
      */}
      {error && (
        <div className="sb-nutrition-error" role="alert">
          <strong>Nutrition data unavailable</strong>

          <p>{error}</p>

          {/* Retry the nutrition API request */}
          <button
            type="button"
            onClick={() => loadNutrition(true)}
            disabled={refreshing}
          >
            Try again
          </button>
        </div>
      )}

      {/* ================================================
          NUTRITION DASHBOARD
          ================================================

          Display the nutrition information only when:
          - No API error exists.
          - Nutrition data has been loaded.
      */}
      {!error && nutrition && (
        <>

          {/* ============================================
              DAILY CALORIE SUMMARY
              ============================================ */}
          <div className="sb-nutrition-hero">

            <div className="sb-nutrition-hero-copy">
              <p className="sb-nutrition-eyebrow">
                TODAY'S CALORIE INTAKE
              </p>

              {/* Display the total calories consumed today */}
              <div className="sb-nutrition-calorie-total">
                {formatNumber(calories)}
                <span>kcal</span>
              </div>

              {/* Display calories remaining or a completed-goal message */}
              <p>
                {remaining > 0
                  ? `${formatNumber(remaining)} kcal remaining to your daily target`
                  : "You've reached your daily calorie target."}
              </p>
            </div>

            {/* ========================================
                CALORIE PROGRESS BAR
                ========================================

                Compares calories consumed against
                the configured daily calorie target.
            */}
            <div
              className="sb-nutrition-progress"
              role="progressbar"
              aria-label="Daily calorie goal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentage}
            >
              {/* Background track for the progress bar */}
              <div className="sb-nutrition-progress-track">

                {/* Filled portion represents calorie progress */}
                <div
                  className="sb-nutrition-progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Display percentage and calorie goal */}
              <div className="sb-nutrition-progress-labels">
                <span>{percentage}% of goal</span>

                <span>
                  {formatNumber(target)} kcal goal
                </span>
              </div>
            </div>
          </div>

          {/* ============================================
              NUTRIENT BREAKDOWN HEADING
              ============================================ */}
          <div className="sb-nutrition-section-heading">
            <div>
              <h2>Nutrient breakdown</h2>

              <p>
                Totals from your recorded food consumption.
              </p>
            </div>
          </div>

          {/* ============================================
              NUTRITION CARDS
              ============================================

              Each card displays one nutrient total.
              NutritionCard is reused to keep the interface
              consistent and avoid repeating HTML.
          */}
          <div className="sb-nutrition-grid">

            {/* Protein total */}
            <NutritionCard
              label="Protein"
              value={nutrition.protein}
              unit="g"
              icon="✦"
              description="Supports muscle maintenance"
            />

            {/* Carbohydrate total */}
            <NutritionCard
              label="Carbohydrates"
              value={nutrition.carbs}
              unit="g"
              icon="◈"
              description="A source of daily energy"
            />

            {/* Fat total */}
            <NutritionCard
              label="Fat"
              value={nutrition.fat}
              unit="g"
              icon="◎"
              description="Helps support normal body functions"
            />
          </div>

          {/* ============================================
              NUTRITION INFORMATION NOTE
              ============================================

              Explains where the nutrition totals come from
              and why inventory items may not appear here.
          */}
          <div className="sb-nutrition-note">
            <span aria-hidden="true">ⓘ</span>

            <p>
              Nutrition totals are calculated from foods recorded
              as consumed. Inventory items that have not been
              logged as eaten are not included. Nutrient totals
              depend on the serving values stored for each food.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
