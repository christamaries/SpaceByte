

/*
===========================================================
 SPACEBYTE - CREW DASHBOARD
 File: frontend/src/components/dashboard.jsx

 PURPOSE:
 Displays the main dashboard for the SpaceByte application.

 FEATURES:
 1. Reads GET /dashboard using the existing Firebase token helper.
 2. Displays inventory items and inventory alerts.
 3. Displays daily calorie and nutrient progress.
 4. Calculates estimated food supplies remaining.
 5. Allows users to search and filter inventory.
 6. Provides navigation to inventory, nutrition, and meals.
 7. Allows users to refresh dashboard information.

 DATA:
 - Firebase Authentication provides the user's login token.
 - apiRequest sends authenticated requests to the backend.
 - dashboard API returns inventory, alerts, nutrition,
   statistics, and mission information.

===========================================================
*/

// Import React hooks.
//
// useState: Stores dashboard information and user interface state.
// useEffect: Runs code when the component loads or dependencies change.
// useCallback: Keeps the load function from being recreated unnecessarily.
// useMemo: Avoids recalculating values unless their dependencies change.
import { useCallback, useEffect, useMemo, useState } from "react";

// Import the existing API helper used to communicate with the backend.
import { apiRequest } from "../api";

// Import shared crew information, nutrition targets, and food icons.
import { CREW, TARGETS, foodIcon } from "../spacebyteConfig";


// ===========================================================
// GREETING FUNCTION
// ===========================================================

// Determines which greeting should appear based on the current time.
function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}


// ===========================================================
// SAFE NUMBER FUNCTION
// ===========================================================

// Converts a value into a number.
//
// If the value is invalid, NaN, or not a usable number,
// return 0 instead of allowing calculation errors.
function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}


// ===========================================================
// DAYS UNTIL EXPIRATION FUNCTION
// ===========================================================

// Calculates how many days remain before a food item expires.
//
// Returns null when:
// - No expiration date exists.
// - The expiration date is invalid.
function daysUntil(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  // Set both dates to midnight so the calculation compares
  // calendar days rather than hours and minutes.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  // Divide the difference in milliseconds by the number
  // of milliseconds in one day.
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}


// ===========================================================
// INVENTORY STATUS FUNCTION
// ===========================================================

// Determines which status badge should appear beside a food item.
//
// Possible statuses:
// - EXPIRED: The expiration date has passed.
// - EXPIRING: The food expires within seven days.
// - LOW: The quantity is low.
// - OK: No warning is needed.
function statusFor(item) {
  // Use the backend's daysToExpiry value when available.
  // Otherwise, calculate the days using the expiration date.
  const days = item.daysToExpiry ?? daysUntil(item.expirationDate);

  if (item.status === "EXPIRED") {
    return { text: "Expired", className: "pink" };
  }

  if (item.status === "EXPIRING" || (days !== null && days >= 0 && days <= 7)) {
    return {
      text: days === null ? "Expiring" : `${days} day${days === 1 ? "" : "s"}`,
      className: "pink",
    };
  }

  if (item.status === "LOW") {
    return { text: "Low", className: "yellow" };
  }

  return { text: "OK", className: "green" };
}


// ===========================================================
// PROGRESS BAR COMPONENT
// ===========================================================

// Displays an individual nutrient progress bar.
//
// PROPS:
// label: Name of the nutrient.
// value: Amount consumed.
// target: Daily nutrient goal.
// color: Color used to display the progress bar.
function ProgressBar({ label, value, target, color }) {
  // Convert the current amount and target into safe numbers.
  const amount = safeNumber(value);
  const goal = safeNumber(target);

  // Calculate the percentage of the nutrient target completed.
  const percent = goal > 0 ? Math.round((amount / goal) * 100) : 0;

  return (
    <div className="sb-nutrient-row">
      <div className="sb-nutrient-label">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>

      {/* Visual progress bar for the nutrient. */}
      <div
        className="sb-bar"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, percent)}
      >
        <i
          style={{
            width: `${Math.max(0, Math.min(100, percent))}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}


// ===========================================================
// MAIN DASHBOARD COMPONENT
// ===========================================================

// Receives:
// user: Currently authenticated Firebase user.
// activeScreen: Currently selected application screen.
// onNavigate: Function used to navigate to another screen.
export default function Dashboard({ user, activeScreen = "overview", onNavigate }) {

  // Stores the dashboard information returned by the backend.
  const [data, setData] = useState(null);

  // Stores an error message if the dashboard cannot load.
  const [error, setError] = useState("");

  // Tracks whether the dashboard is currently loading.
  const [loading, setLoading] = useState(true);

  // Stores the user's inventory search text.
  const [search, setSearch] = useState("");

  // Determines whether all matching inventory items are displayed.
  const [showAll, setShowAll] = useState(false);

  // Stores the time when dashboard information was last loaded.
  const [lastUpdated, setLastUpdated] = useState(null);


  // =========================================================
  // LOAD DASHBOARD DATA
  // =========================================================

  // Retrieves dashboard information from the backend.
  //
  // useCallback prevents unnecessary recreation of this function
  // unless the authenticated user changes.
  const load = useCallback(async () => {

    // Do not request dashboard data if nobody is signed in.
    if (!user) {
      setError("Please sign in to view your dashboard.");
      setLoading(false);
      return;
    }

    try {
      // Display the loading state while the request is running.
      setLoading(true);

      // Get the Firebase authentication token for the current user.
      const token = await user.getIdToken();

      // Send an authenticated GET request to the dashboard endpoint.
      const result = await apiRequest("/dashboard", token);

      // Make sure the backend returned the expected inventory array.
      // This prevents the dashboard from trying to display invalid data.
      if (!result || !Array.isArray(result.inventory)) {
        throw new Error("The dashboard API returned an unexpected response.");
      }

      // Save the backend response so the dashboard can display it.
      setData(result);

      // Clear any previous error after a successful request.
      setError("");

      // Record the successful refresh time.
      setLastUpdated(new Date());

    } catch (err) {

      // Save the error message so it can be displayed to the user.
      setError(err?.message || "An unknown error occurred.");

    } finally {

      // Stop displaying the loading state whether the request
      // succeeds or fails.
      setLoading(false);
    }

  }, [user]);


  // =========================================================
  // LOAD DATA WHEN THE DASHBOARD OPENS
  // =========================================================

  // Automatically load dashboard information when the component
  // first appears or when the load function changes.
  useEffect(() => {
    load();
  }, [load]);


  // =========================================================
  // EXTRACT BACKEND RESPONSE DATA
  // =========================================================

  // Extract the different sections returned by the dashboard API.
  //
  // The ?? operator provides an empty default when a section
  // is missing or null.
  const inventory = data?.inventory ?? [];
  const alerts = data?.alerts ?? {};
  const nutrition = data?.nutrition ?? {};
  const stats = data?.stats ?? {};
  const mission = data?.mission ?? {};


  // Extract the individual inventory alert categories.
  const expiringItems = alerts.expiringSoon ?? [];
  const expiredItems = alerts.expired ?? [];
  const lowStockItems = alerts.lowStock ?? [];


  // =========================================================
  // CALCULATE TOTAL CALORIES AVAILABLE IN INVENTORY
  // =========================================================

  // useMemo recalculates this value only when inventory changes.
  //
  // The calculation:
  // 1. Excludes expired food.
  // 2. Gets the quantity of each food item.
  // 3. Gets the calories per unit.
  // 4. Multiplies quantity by calories per unit.
  // 5. Adds the calories together.
  const totalKcal = useMemo(() => {
    return inventory
      .filter((item) => item.status !== "EXPIRED")
      .reduce((total, item) => {

        // Support both quantity and qty field names.
        const quantity = safeNumber(item.quantity ?? item.qty);

        // Support the different calorie field names used by
        // the dashboard data.
        const calories = safeNumber(
          item.caloriesPerUnit ?? item.kcalPerUnit ?? item.calories
        );

        return total + quantity * calories;
      }, 0);
  }, [inventory]);


  // =========================================================
  // CALCULATE ESTIMATED FOOD SUPPLY DAYS
  // =========================================================

  // Use the backend's foodDays value when available.
  //
  // Otherwise, estimate how many days the available calories
  // could support based on the crew's daily calorie target.
  const foodDays =
    stats.foodDays ??
    Math.floor(
      totalKcal /
        Math.max(
          1,
          safeNumber(stats.kcalTarget) ||
            safeNumber(TARGETS.calories) * safeNumber(CREW.size)
        )
    );


  // =========================================================
  // CALCULATE DAILY CALORIE PROGRESS
  // =========================================================

  // Get the calories consumed today.
  // If the nutrition response does not contain calories,
  // use the statistics value as a fallback.
  const calories = safeNumber(nutrition.calories ?? stats.kcalToday);

  // Determine the crew's daily calorie target.
  //
  // Supports either crewCalorieTarget or calorieTarget
  // from the backend response.
  //
  // If neither exists, calculate the target using the
  // calories per person multiplied by crew size.
  const calorieTarget =
    safeNumber(
      nutrition.crewCalorieTarget ??
        nutrition.calorieTarget ??
        stats.kcalTarget
    ) ||
    safeNumber(TARGETS.calories) * safeNumber(CREW.size);


  // Calculate the percentage of the daily calorie target completed.
  // Math.min prevents the displayed percentage from exceeding 100%.
  const caloriePercent =
    calorieTarget > 0
      ? Math.min(100, Math.round((calories / calorieTarget) * 100))
      : 0;


  // =========================================================
  // CALCULATE WATER PROGRESS
  // =========================================================

  // Use the backend's water percentage when available.
  //
  // Otherwise, look for the water nutrient percentage
  // inside the nutrition.nutrients array.
  const waterPercent = safeNumber(
    stats.waterPercent ??
      nutrition.nutrients?.find((item) => item.key === "water")?.percent
  );


  // =========================================================
  // CALCULATE INVENTORY EXPIRATION COUNT
  // =========================================================

  // Use the backend's expiringCount value when available.
  //
  // Otherwise, add the number of expiring and expired items.
  const expiringCount =
    stats.expiringCount ?? expiringItems.length + expiredItems.length;


  // =========================================================
  // FILTER INVENTORY SEARCH RESULTS
  // =========================================================

  // useMemo recalculates the filtered inventory when the
  // inventory data or search text changes.
  const filteredInventory = useMemo(() => {

    // Remove extra spaces and convert the search text to lowercase.
    const query = search.trim().toLowerCase();

    // If the search field is empty, display the complete inventory.
    if (!query) return inventory;

    // Search by food name, category, or inventory status.
    return inventory.filter((item) =>
      [item.name, item.category, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );

  }, [inventory, search]);


  // =========================================================
  // DETERMINE HOW MANY INVENTORY ITEMS TO DISPLAY
  // =========================================================

  // Display all matching inventory items when showAll is true.
  //
  // Otherwise, display only the first six matching items.
  const visibleInventory = showAll
    ? filteredInventory
    : filteredInventory.slice(0, 6);


  // =========================================================
  // GET THE USER'S FIRST NAME
  // =========================================================

  // Use the Firebase user's display name.
  // If no display name exists, display Commander.
  const firstName = (user?.displayName || "Commander").split(" ")[0];


  // =========================================================
  // NUTRIENT PROGRESS INFORMATION
  // =========================================================

  // Create the nutrient information used by the ProgressBar component.
  //
  // Each nutrient includes:
  // - label: Name displayed on the dashboard.
  // - value: Amount consumed today.
  // - target: Daily nutrition goal.
  // - color: Progress bar color.
  const nutrients = [
    {
      label: "Protein",
      value: nutrition.protein,
      target: TARGETS.protein,
      color: "#7868ff",
    },
    {
      label: "Carbs",
      value: nutrition.carbs,
      target: TARGETS.carbs,
      color: "#ffd166",
    },
    {
      label: "Vitamin D",
      value: nutrition.vitaminD,
      target: TARGETS.vitaminD,
      color: "#f66ca8",
    },
    {
      label: "Water",
      value: nutrition.water,
      target: TARGETS.water,
      color: "#83cfff",
    },
  ];


  // =========================================================
  // DETERMINE WHICH DASHBOARD SECTION SHOULD BE FOCUSED
  // =========================================================

  // When the user selects Inventory or Nutrition from the
  // application navigation, the dashboard can scroll to
  // the corresponding section.
  const focusSection =
    activeScreen === "inventory"
      ? "inventory"
      : activeScreen === "nutrition"
        ? "nutrition"
        : null;


  // =========================================================
  // AUTOMATICALLY SCROLL TO THE SELECTED SECTION
  // =========================================================

  // Wait until the dashboard has updated, then scroll to
  // the selected inventory or nutrition section.
  useEffect(() => {
    if (focusSection) {
      document.getElementById(`sb-${focusSection}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [focusSection, loading]);


  // =========================================================
  // LOADING SCREEN
  // =========================================================

  // If the dashboard is loading and no previous data exists,
  // display a loading message.
  if (loading && !data) {
    return <p className="sb-muted">Loading your crew dashboard…</p>;
  }


  // =========================================================
  // ERROR SCREEN
  // =========================================================

  // If the first dashboard request fails and no previous
  // dashboard data exists, display an error message.
  //
  // The Try again button allows the user to retry the request.
  if (error && !data) {
    return (
      <section className="sb-error-panel">
        <h2>Unable to load your dashboard</h2>
        <p>{error}</p>
        <button type="button" className="sb-primary-button" onClick={load}>
          Try again
        </button>
      </section>
    );
  }


  // =========================================================
  // DASHBOARD USER INTERFACE
  // =========================================================

  return (
    <div className="sb-dashboard">

      {/* =====================================================
          DASHBOARD HEADER
          Displays the greeting, mission information,
          inventory search, notifications, and crew members.
      ===================================================== */}

      <header className="sb-header">
        <div>
          <p className="sb-eyebrow">MISSION CONTROL</p>

          {/* Personalized greeting using the user's first name. */}
          <h1>{greeting()}, {firstName}</h1>

          {/* Mission details from the backend or shared configuration. */}
          <p className="sb-muted">
            Mission day {mission.day ?? CREW.missionDay} · Crew of{" "}
            {mission.crewSize ?? CREW.size} · {mission.location ?? "ISS"}
          </p>
        </div>

        <div className="sb-header-actions">

          {/* Inventory search field. */}
          <label className="sb-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search food, meals, crew"
              aria-label="Search inventory"
              value={search}
              onChange={(event) => {
                // Update the search text as the user types.
                setSearch(event.target.value);

                // Show all matching inventory search results.
                setShowAll(true);
              }}
            />
          </label>

          {/* Notification button for inventory expiration alerts. */}
          <button
            className="sb-notification"
            type="button"
            aria-label={`${expiringCount} expiring items`}
            title={`${expiringCount} items expiring soon`}
            onClick={() => {

              // Clear the search so all inventory items can be viewed.
              setSearch("");

              // Display the complete inventory list.
              setShowAll(true);

              // Navigate to the inventory screen.
              onNavigate?.("inventory");
            }}
          >
            ♧

            {/* Display a notification dot when alerts exist. */}
            {expiringCount > 0 && <span className="sb-notification-dot" />}
          </button>

          {/* Display crew member initials and colors. */}
          <div className="sb-avatars" aria-label="Crew members">
            {(CREW.members ?? []).map((member) => (
              <span
                key={member.initials}
                className="sb-avatar"
                style={{ background: member.color }}
                title={member.name ?? member.initials}
              >
                {member.initials}
              </span>
            ))}
          </div>
        </div>
      </header>


      {/* =====================================================
          DASHBOARD REFRESH WARNING
          If refreshing fails after data was already loaded,
          keep showing the last successfully loaded dashboard.
      ===================================================== */}

      {error && (
        <p className="sb-inline-warning">
          Refresh failed. Showing the last successfully loaded data. {error}
        </p>
      )}


      {/* =====================================================
          DASHBOARD STAT CARDS

          Displays four important mission statistics:

          1. Food on Board: Estimated food supply days.
          2. Kcal Today: Calories consumed versus target.
          3. Water Today: Water consumption progress.
          4. Expiring Within 7 Days: Inventory alerts.

          Uses the existing dashboard calculations and CSS classes.
      ===================================================== */}

      <div className="sb-stats">

        {/* ===================================================
            1. FOOD ON BOARD — CALENDAR ICON

            Displays the estimated number of days that the
            available food supply can support the crew.
        =================================================== */}

        <div className="sb-stat">
          <span
            className="sb-stat-icon mint"
            role="img"
            aria-label="Calendar"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Calendar outline and date separators. */}
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
          </span>

          <div>
            <small>FOOD ON BOARD</small>
            <strong>
              {foodDays} <em>days</em>
            </strong>
          </div>
        </div>


        {/* ===================================================
            2. KCAL TODAY — FIRE ICON

            Displays calories consumed today and the crew's
            daily calorie target.
        =================================================== */}

        <div className="sb-stat">
          <span
            className="sb-stat-icon blue"
            role="img"
            aria-label="Fire"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Fire icon. */}
              <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-9-.5 3-2 4-3 5-1-3-3-5-3-5s1 5-2 8a7 7 0 0 0 5 8Z" />
              <path d="M12 22a3 3 0 0 0 3-3c0-2-2-3-3-5-1 2-3 3-3 5a3 3 0 0 0 3 3Z" />
            </svg>
          </span>

          <div>
            <small>KCAL TODAY</small>
            <strong>
              {Math.round(calories).toLocaleString()}
              <em>/ {Math.round(calorieTarget).toLocaleString()}</em>
            </strong>

            {/* Visual indicator of daily calorie progress. */}
            <div
              className="sb-stat-track"
              role="progressbar"
              aria-label="Daily calorie target"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={caloriePercent}
            >
              <i style={{ width: `${caloriePercent}%` }} />
            </div>
          </div>
        </div>


        {/* ===================================================
            3. WATER TODAY — WATER DROPLET ICON

            Displays the percentage of the daily water target
            that has been consumed.
        =================================================== */}

        <div className="sb-stat">
          <span
            className="sb-stat-icon yellow"
            role="img"
            aria-label="Water droplet"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Water droplet icon. */}
              <path d="M12 3s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12Z" />
              <path d="M9 16a3 3 0 0 0 3 3" />
            </svg>
          </span>

          <div>
            <small>WATER TODAY</small>
            <strong>
              {Math.round(waterPercent)}
              <em>% of target</em>
            </strong>

            {/* Water progress bar. */}
            <div
              className="sb-stat-track"
              role="progressbar"
              aria-label="Daily water target"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.max(
                0,
                Math.min(100, Math.round(waterPercent))
              )}
            >
              <i
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, waterPercent)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>


        {/* ===================================================
            4. EXPIRING WITHIN 7 DAYS — BELL ICON

            Displays the number of inventory items that
            are expiring soon or have already expired.
        =================================================== */}

        <div className="sb-stat">
          <span
            className="sb-stat-icon pink"
            role="img"
            aria-label="Notification bell"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Notification bell icon. */}
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </span>

          <div>
            <small>EXPIRING ≤ 7 DAYS</small>
            <strong>
              {expiringCount} <em>items</em>
            </strong>

            {/* Clicking this button opens the inventory screen. */}
            <button
              type="button"
              className="sb-link"
              onClick={() => {
                setSearch("");
                setShowAll(true);
                onNavigate?.("inventory");
              }}
            >
              View inventory alerts
            </button>
          </div>
        </div>
      </div>


      {/* =====================================================
          MAIN DASHBOARD PANELS

          Contains:
          1. Galley inventory table.
          2. Today's nutrition information.
      ===================================================== */}

      <div className="sb-panels sb-main-panels">

        {/* ===================================================
            GALLEY INVENTORY PANEL

            Displays inventory items returned by GET /dashboard.
        =================================================== */}

        <section className="sb-panel" id="sb-inventory">
          <div className="sb-panel-head">
            <h2>Galley inventory</h2>

            {/* Toggle between showing six items and all items. */}
            <button
              type="button"
              className="sb-link"
              onClick={() => {
                setShowAll((current) => !current);
                onNavigate?.("inventory");
              }}
            >
              {showAll ? "Show less" : "View all"}
            </button>
          </div>

          {/* Allows the inventory table to scroll when necessary. */}
          <div className="sb-table-scroll">
            <table className="sb-inventory-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th className="sb-align-right">Qty</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {/* Loop through the inventory items to create table rows. */}
                {visibleInventory.map((item) => {

                  // Determine the status badge for the current food item.
                  const badge = statusFor(item);

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="sb-food-name">

                          {/* Display the icon associated with the food name. */}
                          <span className="sb-food-icon">
                            {foodIcon(item.name)}
                          </span>

                          {item.name}
                        </span>
                      </td>

                      {/* Display the food category. */}
                      <td>{item.category || "Uncategorized"}</td>

                      {/* Display the available quantity. */}
                      <td className="sb-align-right">
                        {item.quantity ?? item.qty ?? 0}
                      </td>

                      {/* Display the calculated inventory status. */}
                      <td>
                        <span className={`sb-badge ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}


                {/* Display a message when no inventory items match. */}
                {visibleInventory.length === 0 && (
                  <tr>
                    <td colSpan="4" className="sb-empty">
                      {search
                        ? "No inventory items match your search."
                        : "No food items found. Add inventory to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


          {/* Inventory count and last successful update time. */}
          <div className="sb-inventory-footer">
            {filteredInventory.length} item
            {filteredInventory.length === 1 ? "" : "s"}

            {lastUpdated && (
              <span> · Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
        </section>


        {/* ===================================================
            TODAY'S NUTRITION PANEL

            Displays calorie progress and individual nutrient
            progress bars.
        =================================================== */}

        <section className="sb-panel" id="sb-nutrition">
          <div className="sb-panel-head">
            <h2>Today's nutrition</h2>

            {/* Navigate to the nutrition screen for more information. */}
            <button
              type="button"
              className="sb-link"
              onClick={() => onNavigate?.("nutrition")}
            >
              Details
            </button>
          </div>

          <div className="sb-nutrition">

            {/* Circular calorie progress indicator. */}
            <div
              className="sb-donut-wrap"
              role="img"
              aria-label={`${caloriePercent}% of daily calorie target`}
              style={{
                "--sb-progress": `${caloriePercent * 3.6}deg`,
              }}
            >
              <div className="sb-donut-center">
                <strong>{caloriePercent}%</strong>
                <span>of target</span>
              </div>
            </div>


            {/* Display the protein, carbohydrate, vitamin D,
                and water progress bars. */}
            <div className="sb-bars">
              {nutrients.map((nutrient) => (
                <ProgressBar
                  key={nutrient.label}
                  {...nutrient}
                />
              ))}
            </div>
          </div>

          {/* Explains where the displayed nutrient data comes from. */}
          <p className="sb-muted sb-nutrition-footnote">
            Nutrient progress is based on today's recorded intake.
          </p>
        </section>
      </div>


      {/* =====================================================
          LOWER DASHBOARD PANELS

          Contains:
          1. Inventory alerts.
          2. Daily mission nutrition summary.
      ===================================================== */}

      <div className="sb-lower-panels">

        {/* ===================================================
            INVENTORY ALERTS PANEL

            Displays expired, expiring, and low-stock food items.
        =================================================== */}

        <section className="sb-panel">
          <div className="sb-panel-head">
            <h2>Inventory alerts</h2>

            {/* Total number of inventory alerts. */}
            <span className="sb-alert-count">
              {lowStockItems.length + expiringItems.length + expiredItems.length}
            </span>
          </div>


          {/* Combine all three alert categories into one list.
              Display expired items first, then expiring items,
              followed by low-stock items. */}
          {[
            ...expiredItems.map((item) => ({ ...item, alert: "Expired" })),
            ...expiringItems.map((item) => ({ ...item, alert: "Expiring soon" })),
            ...lowStockItems.map((item) => ({ ...item, alert: "Low stock" })),
          ].slice(0, 5).map((item) => (

            // Display up to five inventory alerts.
            <div className="sb-alert-row" key={`${item.id}-${item.alert}`}>
              <span className="sb-alert-dot" />
              <span>{item.name}</span>
              <small>{item.alert}</small>
            </div>
          ))}


          {/* Display a message when no inventory alerts exist. */}
          {lowStockItems.length + expiringItems.length + expiredItems.length === 0 && (
            <p className="sb-muted">No inventory alerts right now.</p>
          )}
        </section>


        {/* ===================================================
            DAILY MISSION SUMMARY PANEL

            Displays the total calories recorded today,
            remaining calories, and meal planner navigation.
        =================================================== */}

        <section className="sb-panel">
          <div className="sb-panel-head">
            <h2>Daily mission summary</h2>
          </div>

          {/* Display the total calories recorded today. */}
          <p className="sb-summary-number">
            {Math.round(calories).toLocaleString()}
            <span> kcal logged today</span>
          </p>

          {/* Display progress toward the crew's calorie target. */}
          <div className="sb-summary-track">
            <i style={{ width: `${caloriePercent}%` }} />
          </div>

          {/* Calculate how many calories remain to reach the target. */}
          <p className="sb-muted">
            {Math.max(0, Math.round(calorieTarget - calories)).toLocaleString()}
            {" "}kcal remaining to the crew target.
          </p>

          {/* Navigate to the meal planner screen. */}
          <button
            type="button"
            className="sb-primary-button"
            onClick={() => onNavigate?.("meals")}
          >
            Open meal planner
          </button>
        </section>
      </div>


      {/* =====================================================
          DASHBOARD FOOTER

          Displays the application name and refresh button.
      ===================================================== */}

      <div className="sb-dashboard-footer">
        <span>SpaceByte · Crew Galley</span>

        {/* Reload dashboard information from the backend. */}
        <button type="button" className="sb-link" onClick={load}>
          ↻ Refresh dashboard
        </button>
      </div>
    </div>
  );
}
