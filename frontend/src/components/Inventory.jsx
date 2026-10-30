
/*
===========================================================
 SPACEBYTE - COMBINED INVENTORY PAGE
 File: frontend/src/components/Inventory.jsx

 FEATURES:
 1. Add food items to Firestore through the backend.
 2. Use existing Firebase authentication.
 3. Load saved inventory items.
 4. Capture weight and weight units.
 5. Capture shelf life in days.
 6. Capture expiration dates and item types.
 7. Capture nutrition information per serving.
 8. Search, filter, and sort inventory.
 9. Calculate inventory totals and expiration alerts.
10. Display backend inventory statuses.
===========================================================
*/

// Import React hooks:
// useState manages component data.
// useEffect runs code when the component loads or dependencies change.
// useCallback preserves a function between renders.
// useMemo avoids recalculating values unnecessarily.
import { useCallback, useEffect, useMemo, useState } from "react";

// Import icons used throughout the inventory page.
import {
  PackagePlus,
  Package,
  RefreshCw,
  Search,
  AlertTriangle,
  Scale,
  CalendarDays,
} from "lucide-react";

// Import the existing API helper used to communicate
// with the SpaceByte backend.
import { apiRequest } from "../api";

// Import the shared SpaceByte interface styles.
import "../spacebyte-ui.css";

// ==========================================
//              INITIAL FORM
// ==========================================

// These are the default values displayed when the
// inventory form first loads or is reset.
//
// Keeping these values in one object makes it easier
// to clear the form after successfully adding an item.
const EMPTY_FORM = {
  name: "",
  quantity: "1",
  weight: "",
  weightUnit: "g",
  shelfLife: "",
  expirationDate: "",
  type: "Perishable",

  // Nutrition information is entered per serving.
  calories: "",
  protein: "",
  carbs: "",
  fat: "",

  // Inventory is marked LOW when its quantity
  // reaches or falls below this threshold.
  lowStockThreshold: "10",
};

// Available categories for inventory items.
// These values populate the item-type dropdown.
const ITEM_TYPES = [
  "Perishable",
  "Non-Perishable",
  "Freeze-Dried",
  "Dry Goods",
  "Dehydrated",
  "Thermostabilized",
  "Frozen",
  "Other",
];

// Defines the nutrition fields displayed in the form.
// The name connects each field to the corresponding
// property in the form state.
// The label and unit are used for display.
const NUTRITION_FIELDS = [
  { name: "calories", label: "Calories", unit: "kcal" },
  { name: "protein", label: "Protein", unit: "g" },
  { name: "carbs", label: "Carbohydrates", unit: "g" },
  { name: "fat", label: "Fat", unit: "g" },
];

// ==========================================
//                DATE HELPERS
// ==========================================

// Calculate the number of days remaining before
// an inventory item's expiration date.
//
// Returns:
// - null when no expiration date is provided.
// - A positive number when the item has not expired.
// - Zero when the item expires today.
// - A negative number when the item has expired.
function getDaysRemaining(expirationDate) {
  if (!expirationDate) return null;

  // Set today's time to midnight so the calculation
  // compares calendar dates rather than hours and minutes.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Add midnight to the expiration date to avoid
  // unexpected time differences during comparison.
  const expiration = new Date(`${expirationDate}T00:00:00`);

  // Return null if the expiration date is invalid.
  if (Number.isNaN(expiration.getTime())) {
    return null;
  }

  // Convert the difference between the two dates
  // from milliseconds into days.
  return Math.ceil(
    (expiration.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

// Determine the expiration label and colors
// displayed beside each inventory item.
//
// Items are categorized as:
// - No expiration date
// - Expired
// - Expiring Soon (within 30 days)
// - Fresh
function getExpirationStatus(expirationDate) {
  const days = getDaysRemaining(expirationDate);

  if (days === null) {
    return {
      label: "No expiration date",
      color: "text-slate-400",
      background: "bg-slate-500/10",
    };
  }

  if (days < 0) {
    return {
      label: "Expired",
      color: "text-red-400",
      background: "bg-red-500/10",
    };
  }

  if (days <= 30) {
    return {
      label: "Expiring Soon",
      color: "text-yellow-400",
      background: "bg-yellow-500/10",
    };
  }

  return {
    label: "Fresh",
    color: "text-green-400",
    background: "bg-green-500/10",
  };
}

// Convert a saved date into a readable date
// for display in the inventory list.
//
// If no date exists, display a dash.
// If the date cannot be parsed, return the original value.
function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

// ==========================================
//             WEIGHT CALCULATIONS
// ==========================================

// Convert supported weight units into kilograms.
//
// Supported units:
// - Grams (g)
// - Kilograms (kg)
// - Pounds (lb or lbs)
// - Ounces (oz)
//
// The function accepts a weight value stored as text,
// such as "250 g" or "2 kg".
//
// Unknown formats are excluded from the total rather
// than producing an inaccurate calculation.
function weightToKg(weight) {
  if (!weight) return null;

  // Extract the numeric amount and optional unit.
  const match = String(weight)
    .trim()
    .match(/^([\d.]+)\s*(g|kg|lb|lbs|oz)?$/i);

  // Return null if the weight format is not supported.
  if (!match) return null;

  const amount = Number(match[1]);

  // Use kilograms when no unit is included.
  const unit = (match[2] || "kg").toLowerCase();

  if (!Number.isFinite(amount)) return null;

  // Convert each supported unit into kilograms.
  const conversions = {
    g: amount / 1000,
    kg: amount,
    lb: amount * 0.45359237,
    lbs: amount * 0.45359237,
    oz: amount * 0.0283495231,
  };

  // Return the converted weight.
  // Return null if the unit is not recognized.
  return conversions[unit] ?? null;
}

// ==========================================
//             STATUS STYLING
// ==========================================

// Assign a color style based on the inventory status
// returned by the backend.
//
// LOW      = Orange
// EXPIRED  = Red
// EXPIRING = Yellow
// OK       = Green
function getStatusStyle(status) {
  switch (String(status || "OK").toUpperCase()) {
    case "LOW":
      return "text-orange-400 bg-orange-500/10";

    case "EXPIRED":
      return "text-red-400 bg-red-500/10";

    case "EXPIRING":
      return "text-yellow-400 bg-yellow-500/10";

    default:
      return "text-green-400 bg-green-500/10";
  }
}

// ==========================================
//              MAIN COMPONENT
// ==========================================

// Main inventory page.
//
// The user prop provides the currently authenticated
// Firebase user. Its ID token is used to authorize
// requests to the backend.
export default function Inventory({ user }) {

  // Stores inventory records retrieved from the backend.
  const [items, setItems] = useState([]);

  // Stores the values entered into the add-item form.
  const [form, setForm] = useState(EMPTY_FORM);

  // Tracks whether inventory is loading or an item is saving.
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Stores error and success messages for the user.
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Stores the current search, filter, and sorting choices.
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("soonest");

  // ==========================================
  //          LOAD INVENTORY FROM BACKEND
  // ==========================================

  // Retrieve inventory records from the backend.
  //
  // useCallback prevents this function from being
  // recreated unnecessarily during component renders.
  const loadInventory = useCallback(async () => {

    // Do not request inventory if nobody is signed in.
    if (!user) {
      setItems([]);
      setLoading(false);
      setError("Please sign in to view your inventory.");
      return;
    }

    // Show the loading state and clear previous errors.
    setLoading(true);
    setError("");

    try {
      // Retrieve the current Firebase authentication token.
      const token = await user.getIdToken();

      // Send an authenticated GET request to the
      // backend inventory endpoint.
      const result = await apiRequest("/inventory", token);

      // Make sure the backend returned an array
      // of inventory records before updating the page.
      if (!Array.isArray(result)) {
        throw new Error(
          "The backend returned an unexpected inventory response."
        );
      }

      // Save the returned inventory records in React state.
      setItems(result);
    } catch (err) {
      // Log the technical error for debugging.
      console.error("Inventory loading error:", err);

      // Display an understandable error message.
      setError(
        err.message || "Unable to load inventory items."
      );
    } finally {
      // Stop displaying the loading state whether
      // the request succeeds or fails.
      setLoading(false);
    }
  }, [user]);

  // Load inventory when the component first appears.
  // Run again if the loadInventory function changes.
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // ==========================================
  //              UPDATE FORM
  // ==========================================

  // Handle changes to the form inputs.
  //
  // Each input has a name attribute that matches
  // a property in the form state.
  function handleChange(event) {
    const { name, value } = event.target;

    // Update only the field that the user changed.
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ==========================================
  //            VALIDATE FORM DATA
  // ==========================================

  // Check the form values before sending them
  // to the backend.
  //
  // Returns an error message if a value is invalid.
  // Returns an empty string when validation succeeds.
  function validateForm() {

    // Item names cannot be empty.
    if (!form.name.trim()) {
      return "Please enter an item name.";
    }

    // Quantity must be a valid number that is zero or greater.
    if (
      form.quantity.trim() === "" ||
      !Number.isFinite(Number(form.quantity)) ||
      Number(form.quantity) < 0
    ) {
      return "Please enter a valid quantity of zero or greater.";
    }

    // If weight is provided, it must be a valid
    // positive number.
    if (
      form.weight.trim() !== "" &&
      (!Number.isFinite(Number(form.weight)) ||
        Number(form.weight) <= 0)
    ) {
      return "Please enter a valid item weight.";
    }

    // Shelf life must be a valid number of days
    // that is zero or greater.
    if (
      form.shelfLife.trim() !== "" &&
      (!Number.isFinite(Number(form.shelfLife)) ||
        Number(form.shelfLife) < 0)
    ) {
      return "Shelf life must be zero or greater.";
    }

    // The low-stock threshold must be zero or greater.
    if (
      form.lowStockThreshold.trim() !== "" &&
      (!Number.isFinite(Number(form.lowStockThreshold)) ||
        Number(form.lowStockThreshold) < 0)
    ) {
      return "Low-stock threshold must be zero or greater.";
    }

    // Validate each nutrition field.
    // Optional nutrition values are allowed to be blank.
    // If entered, they must be valid nonnegative numbers.
    for (const field of NUTRITION_FIELDS) {
      const value = form[field.name];

      if (
        value.trim() !== "" &&
        (!Number.isFinite(Number(value)) ||
          Number(value) < 0)
      ) {
        return `Please enter a valid ${field.label.toLowerCase()} value.`;
      }
    }

    // No validation errors were found.
    return "";
  }

  // ==========================================
  //            ADD INVENTORY ITEM
  // ==========================================

  // Handle submission of the Add Inventory Item form.
  async function handleSubmit(event) {

    // Prevent the browser from refreshing the page.
    event.preventDefault();

    // Clear previous messages before processing.
    setError("");
    setNotice("");

    // Require the user to be authenticated.
    if (!user) {
      setError("Please sign in before adding inventory.");
      return;
    }

    // Validate the form before sending any information.
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    // Display the saving state on the submit button.
    setSaving(true);

    try {
      // Retrieve the Firebase ID token.
      const token = await user.getIdToken();

      // The backend expects weight as a text value
      // and shelfLife as a number of days.
      //
      // Combine the entered weight and selected unit
      // into one value, such as "250 g".
      const weightValue = form.weight.trim()
        ? `${form.weight.trim()} ${form.weightUnit}`
        : "";

      // Prepare the inventory information for the backend.
      //
      // Convert numeric form values from strings into numbers.
      // Use null for an optional shelf-life or expiration date.
      // Use zero for blank nutrition values.
      const payload = {
        name: form.name.trim(),

        quantity: Number(form.quantity),

        weight: weightValue,

        shelfLife:
          form.shelfLife.trim() === ""
            ? null
            : Number(form.shelfLife),

        expirationDate: form.expirationDate || null,

        type: form.type,

        calories:
          form.calories.trim() === ""
            ? 0
            : Number(form.calories),

        protein:
          form.protein.trim() === ""
            ? 0
            : Number(form.protein),

        carbs:
          form.carbs.trim() === ""
            ? 0
            : Number(form.carbs),

        fat:
          form.fat.trim() === ""
            ? 0
            : Number(form.fat),

        lowStockThreshold:
          form.lowStockThreshold.trim() === ""
            ? 10
            : Number(form.lowStockThreshold),
      };

      // Send an authenticated POST request to create
      // the inventory item in the backend.
      const response = await apiRequest("/inventory", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Confirm that the backend returned the expected
      // response containing the newly created item.
      if (!response || !response.item) {
        throw new Error(
          "The item may have been saved, but the server returned an unexpected response."
        );
      }

      // Reset the form to its original default values.
      setForm({ ...EMPTY_FORM });

      // Display a success message.
      setNotice(
        `${payload.name} was successfully added to inventory.`
      );

      // Reload inventory so the newly saved item
      // appears in the inventory list and summary cards.
      await loadInventory();
    } catch (err) {
      // Log the technical error for debugging.
      console.error("Inventory save error:", err);

      // Display the error to the user.
      setError(
        err.message || "Unable to save this inventory item."
      );
    } finally {
      // Stop displaying the saving state.
      setSaving(false);
    }
  }

  // ==========================================
  //          SEARCH, FILTER, AND SORT
  // ==========================================

  // Create a displayed inventory list based on
  // the current search, filter, and sorting selections.
  //
  // useMemo recalculates this list only when one of
  // its dependencies changes.
  const filteredItems = useMemo(() => {
    return [...items]

      // Search by item name without considering uppercase
      // or lowercase letters.
      .filter((item) =>
        String(item.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )

      // Show all item types or only the selected type.
      .filter((item) =>
        filterType === "All" ||
        item.type === filterType
      )

      // Show all statuses or only the selected status.
      .filter((item) =>
        filterStatus === "All" ||
        String(item.status || "OK").toUpperCase() ===
          filterStatus
      )

      // Sort the filtered inventory records.
      .sort((a, b) => {

        // Display the nearest expiration dates first.
        // Items without dates are placed at the end.
        if (sortOrder === "soonest") {
          const dateA = a.expirationDate
            ? new Date(a.expirationDate).getTime()
            : Infinity;

          const dateB = b.expirationDate
            ? new Date(b.expirationDate).getTime()
            : Infinity;

          return dateA - dateB;
        }

        // Display the latest expiration dates first.
        // Items without dates are placed at the end.
        if (sortOrder === "latest") {
          const dateA = a.expirationDate
            ? new Date(a.expirationDate).getTime()
            : -Infinity;

          const dateB = b.expirationDate
            ? new Date(b.expirationDate).getTime()
            : -Infinity;

          return dateB - dateA;
        }

        // Sort item names alphabetically.
        if (sortOrder === "name") {
          return String(a.name || "").localeCompare(
            String(b.name || "")
          );
        }

        // Keep the existing order if no sort option matches.
        return 0;
      });
  }, [
    items,
    searchTerm,
    filterType,
    filterStatus,
    sortOrder,
  ]);

  // ==========================================
  //             INVENTORY TOTALS
  // ==========================================

  // Calculate the total number of packages
  // across all inventory records.
  const totalPackages = items.reduce(
    (total, item) =>
      total + (Number(item.quantity) || 0),
    0
  );

  // Calculate the combined weight of all inventory.
  //
  // Each item's weight is converted to kilograms.
  // The converted weight is multiplied by the number
  // of packages for that inventory record.
  const totalWeightKg = items.reduce(
    (total, item) => {
      const weight = weightToKg(item.weight);

      // Ignore weights that cannot be converted.
      if (weight === null) return total;

      return total + weight * (Number(item.quantity) || 0);
    },
    0
  );

  // Count inventory records with expiration dates
  // between today and the next 30 days.
  const expiringSoonCount = items.filter((item) => {
    const days = getDaysRemaining(item.expirationDate);

    return days !== null && days >= 0 && days <= 30;
  }).length;

  // Count inventory records that have already expired.
  const expiredCount = items.filter(
    (item) =>
      getDaysRemaining(item.expirationDate) !== null &&
      getDaysRemaining(item.expirationDate) < 0
  ).length;

  // Count inventory records marked LOW by the backend.
  const lowStockCount = items.filter(
    (item) =>
      String(item.status || "").toUpperCase() === "LOW"
  ).length;

  // ==========================================
  //                  PAGE UI
  // ==========================================

  // Render the complete SpaceByte inventory page.
  return (
    <main className="min-h-screen bg-[#070b1c] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* PAGE HEADER */}

        {/* Displays the page title and refresh button. */}
        <header className="mb-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              SPACEBYTE • CREW GALLEY
            </p>

            <h1 className="text-4xl font-bold">
              Food Inventory
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Manage mission food supplies, monitor
              expiration dates, and track nutrition.
            </p>
          </div>

          {/* Reloads inventory from the backend. */}
          <button
            type="button"
            onClick={loadInventory}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm text-cyan-400 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            {loading ? "Refreshing..." : "Refresh Inventory"}
          </button>
        </header>

        {/* ERROR AND SUCCESS MESSAGES */}

        {/* Display an error if inventory cannot load
            or an item cannot be saved. */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
          >
            {error}
          </div>
        )}

        {/* Display a confirmation after an item is saved. */}
        {notice && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-300"
          >
            {notice}
          </div>
        )}

        {/* INVENTORY SUMMARY CARDS */}

        {/* These cards summarize the complete inventory.
            They use the totals calculated above. */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          {/* Number of inventory records. */}
          <div className="rounded-2xl border border-slate-700 bg-[#0b1424] p-5">
            <Package className="mb-3 text-cyan-400" size={25} />
            <p className="text-sm text-slate-400">
              Inventory Records
            </p>
            <p className="mt-2 text-3xl font-bold">
              {items.length}
            </p>
          </div>

          {/* Total number of packages across all records. */}
          <div className="rounded-2xl border border-slate-700 bg-[#0b1424] p-5">
            <PackagePlus className="mb-3 text-cyan-400" size={25} />
            <p className="text-sm text-slate-400">
              Total Packages
            </p>
            <p className="mt-2 text-3xl font-bold">
              {totalPackages}
            </p>
          </div>

          {/* Combined inventory weight in kilograms. */}
          <div className="rounded-2xl border border-slate-700 bg-[#0b1424] p-5">
            <Scale className="mb-3 text-cyan-400" size={25} />
            <p className="text-sm text-slate-400">
              Total Weight
            </p>
            <p className="mt-2 text-3xl font-bold">
              {totalWeightKg.toFixed(2)}
              <span className="ml-1 text-base text-slate-400">
                kg
              </span>
            </p>
          </div>

          {/* Number of records expiring within 30 days. */}
          <div className="rounded-2xl border border-slate-700 bg-[#0b1424] p-5">
            <AlertTriangle className="mb-3 text-yellow-400" size={25} />
            <p className="text-sm text-slate-400">
              Expiring Within 30 Days
            </p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {expiringSoonCount}
            </p>
          </div>

          {/* Number of expired records and low-stock records. */}
          <div className="rounded-2xl border border-slate-700 bg-[#0b1424] p-5">
            <CalendarDays className="mb-3 text-red-400" size={25} />
            <p className="text-sm text-slate-400">
              Expired Items
            </p>
            <p className="mt-2 text-3xl font-bold text-red-400">
              {expiredCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Low-stock items: {lowStockCount}
            </p>
          </div>

        </section>

        {/* ADD INVENTORY FORM */}

        {/* This section allows the user to enter a new
            food or supply item and save it to the backend. */}
        <section className="mb-8 rounded-2xl border border-slate-700 bg-[#0b1424] p-6 shadow-xl">

          <div className="mb-6 flex items-center gap-3">
            <PackagePlus className="text-cyan-400" size={28} />

            <div>
              <h2 className="text-2xl font-semibold">
                Add New Inventory Item
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Enter the food or supply information below.
              </p>
            </div>
          </div>

          {/* Submitting this form calls handleSubmit. */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* BASIC FOOD INFORMATION */}

            <div>
              <h3 className="mb-4 text-lg font-semibold text-cyan-300">
                Food Information
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

                {/* Food or supply name. */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Item Name *
                  </span>

                  <input
                    name="name"
                    type="text"
                    maxLength={120}
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Freeze-Dried Strawberries"
                    className={inputStyle}
                  />
                </label>

                {/* Number of packages or units available. */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Quantity *
                  </span>

                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="Number of packages"
                    className={inputStyle}
                  />
                </label>

                {/* Select the category for the item. */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Item Type *
                  </span>

                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Enter the weight for one package or item.
                    The dropdown determines the weight unit. */}
                <div>
                  <span className="mb-2 block text-sm text-slate-300">
                    Weight per Item
                  </span>

                  <div className="grid grid-cols-[1fr_110px] gap-3">
                    <input
                      name="weight"
                      type="number"
                      min="0.01"
                      step="any"
                      value={form.weight}
                      onChange={handleChange}
                      placeholder="250"
                      className={inputStyle}
                    />

                    <select
                      name="weightUnit"
                      value={form.weightUnit}
                      onChange={handleChange}
                      aria-label="Weight unit"
                      className={inputStyle}
                    >
                      <option value="g">Grams</option>
                      <option value="kg">Kilograms</option>
                      <option value="lb">Pounds</option>
                      <option value="oz">Ounces</option>
                    </select>
                  </div>
                </div>

                {/* Enter the expected shelf life in days. */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Shelf Life (Days)
                  </span>

                  <input
                    name="shelfLife"
                    type="number"
                    min="0"
                    step="1"
                    value={form.shelfLife}
                    onChange={handleChange}
                    placeholder="180"
                    className={inputStyle}
                  />
                </label>

                {/* Enter the item's expiration date. */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Expiration Date
                  </span>

                  <input
                    name="expirationDate"
                    type="date"
                    value={form.expirationDate}
                    onChange={handleChange}
                    className={`${inputStyle} scheme-dark`}
                  />
                </label>

                {/* Set the quantity at which the backend
                    should identify the item as low stock. */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Low-Stock Alert Threshold
                  </span>

                  <input
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    step="1"
                    value={form.lowStockThreshold}
                    onChange={handleChange}
                    className={inputStyle}
                  />

                  <span className="mt-1 block text-xs text-slate-500">
                    Inventory is marked LOW when quantity is at or below this number.
                  </span>
                </label>

              </div>
            </div>

            {/* NUTRITION INFORMATION */}

            {/* Nutrition values are entered per serving.
                These values are sent to the backend with
                the inventory item. */}
            <div className="border-t border-slate-700 pt-6">
              <h3 className="mb-2 text-lg font-semibold text-cyan-300">
                Nutrition Information
              </h3>

              <p className="mb-4 text-sm text-slate-400">
                Enter nutrition values per serving from the
                product label. These fields are optional.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                {/* Generate the nutrition inputs from
                    the NUTRITION_FIELDS configuration. */}
                {NUTRITION_FIELDS.map((field) => (
                  <label
                    key={field.name}
                    className="block"
                  >
                    <span className="mb-2 block text-sm text-slate-300">
                      {field.label} ({field.unit})
                    </span>

                    <input
                      name={field.name}
                      type="number"
                      min="0"
                      step="any"
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder="Enter value"
                      className={inputStyle}
                    />
                  </label>
                ))}

              </div>
            </div>

            {/* SUBMIT */}

            {/* Save the completed form.
                The button is disabled while the request
                is being processed to prevent duplicate submissions. */}
            <div className="border-t border-slate-700 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <PackagePlus size={20} />
                {saving ? "Saving Inventory Item..." : "Add to Inventory"}
              </button>
            </div>

          </form>
        </section>

        {/* INVENTORY LIST */}

        {/* Displays the saved inventory records and
            provides tools for searching, filtering,
            and sorting the list. */}
        <section className="rounded-2xl border border-slate-700 bg-[#0b1424] p-6 shadow-xl">

          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              Inventory Overview
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Search and organize your saved mission supplies.
            </p>
          </div>

          {/* SEARCH */}

          {/* Search inventory records by item name. */}
          <div className="mb-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search inventory..."
                aria-label="Search inventory"
                className={`${inputStyle} pl-10`}
              />
            </div>
          </div>

          {/* FILTERS */}

          {/* These dropdowns control which inventory
              records are displayed and how they are sorted. */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

            {/* Filter by food or supply category. */}
            <select
              value={filterType}
              onChange={(event) =>
                setFilterType(event.target.value)
              }
              aria-label="Filter by item type"
              className={inputStyle}
            >
              <option value="All">All Item Types</option>

              {ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Filter by the status returned by the backend. */}
            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value)
              }
              aria-label="Filter by inventory status"
              className={inputStyle}
            >
              <option value="All">All Statuses</option>
              <option value="OK">OK</option>
              <option value="LOW">Low Stock</option>
              <option value="EXPIRING">Expiring</option>
              <option value="EXPIRED">Expired</option>
            </select>

            {/* Sort records by expiration date or item name. */}
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value)
              }
              aria-label="Sort inventory"
              className={inputStyle}
            >
              <option value="soonest">
                Expiration: Soonest First
              </option>

              <option value="latest">
                Expiration: Latest First
              </option>

              <option value="name">
                Name: A–Z
              </option>
            </select>

          </div>

          {/* INVENTORY LOADING STATE */}

          {/* Display a loading message while inventory
              is being retrieved from the backend.
              If loading is complete but no records match,
              display an appropriate empty-state message. */}
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw
                size={28}
                className="mx-auto mb-3 animate-spin"
              />

              Loading inventory...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">

              <Package
                size={42}
                className="mx-auto mb-4 text-slate-500"
              />

              <h3 className="text-lg font-semibold text-slate-300">
                {items.length === 0
                  ? "No inventory items yet."
                  : "No matching inventory items."}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {items.length === 0
                  ? "Add your first item using the form above."
                  : "Try changing your search or filters."}
              </p>

            </div>
          ) : (

            /* INVENTORY RECORDS */

            /* Display each inventory record as an individual card. */
            <div className="space-y-4">

              {filteredItems.map((item) => {

                // Calculate the expiration label and styling
                // for the current inventory item.
                const expirationStatus =
                  getExpirationStatus(item.expirationDate);

                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-700 bg-slate-900 p-5"
                  >

                    <div className="flex flex-wrap items-start justify-between gap-4">

                      <div>
                        {/* Display the item name and category. */}
                        <h3 className="text-lg font-semibold text-white">
                          {item.name || "Unnamed Item"}
                        </h3>

                        <p className="mt-1 text-sm text-cyan-400">
                          {item.type || "Other"}
                        </p>
                      </div>

                      {/* Display the backend inventory status
                          and the expiration status calculated
                          by this frontend component. */}
                      <div className="flex flex-wrap gap-2">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(item.status)}`}
                        >
                          {item.status || "OK"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${expirationStatus.color} ${expirationStatus.background}`}
                        >
                          {expirationStatus.label}
                        </span>

                      </div>

                    </div>

                    {/* Display the main inventory details. */}
                    <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 xl:grid-cols-5">

                      {/* Number of packages available. */}
                      <div>
                        <p className="text-slate-500">
                          Quantity
                        </p>

                        <p className="mt-1 font-semibold text-white">
                          {item.quantity ?? "—"}
                        </p>
                      </div>

                      {/* Weight of one package or item. */}
                      <div>
                        <p className="text-slate-500">
                          Weight per Item
                        </p>

                        <p className="mt-1 font-semibold text-white">
                          {item.weight || "—"}
                        </p>
                      </div>

                      {/* Expected shelf life in days. */}
                      <div>
                        <p className="text-slate-500">
                          Shelf Life
                        </p>

                        <p className="mt-1 font-semibold text-white">
                          {item.shelfLife === null ||
                          item.shelfLife === undefined
                            ? "—"
                            : `${item.shelfLife} days`}
                        </p>
                      </div>

                      {/* Formatted expiration date. */}
                      <div>
                        <p className="text-slate-500">
                          Expiration Date
                        </p>

                        <p className="mt-1 font-semibold text-white">
                          {formatDate(item.expirationDate)}
                        </p>
                      </div>

                      {/* Calories stored for one serving. */}
                      <div>
                        <p className="text-slate-500">
                          Calories / Serving
                        </p>

                        <p className="mt-1 font-semibold text-white">
                          {item.calories ?? 0} kcal
                        </p>
                      </div>

                    </div>

                    {/* Display the remaining nutrition values. */}
                    <div className="mt-4 border-t border-slate-700 pt-4">

                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Nutrition per Serving
                      </p>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">

                        <span>
                          Protein: {item.protein ?? 0} g
                        </span>

                        <span>
                          Carbs: {item.carbs ?? 0} g
                        </span>

                        <span>
                          Fat: {item.fat ?? 0} g
                        </span>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

          {/* Show how many records are currently visible
              compared with the total number of saved records. */}
          <p className="mt-5 text-sm text-slate-500">
            Showing {filteredItems.length} of {items.length} inventory records.
          </p>

        </section>

      </div>
    </main>
  );
}

// ==========================================
//              INPUT STYLING
// ==========================================

// Shared Tailwind CSS classes for the inventory form inputs.
// Using one style variable keeps the inputs consistent
// and makes future styling changes easier.
const inputStyle =
  "w-full rounded-lg border border-slate-700 bg-slate-900 " +
  "px-4 py-3 text-white placeholder:text-slate-500 " +
  "focus:border-blue-500 focus:outline-none";
