
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
  Trash2,
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
    return { label: "No expiration date", className: "sb-status-none" };
  }

  if (days < 0) {
    return { label: "Expired", className: "sb-status-expired" };
  }

  if (days <= 30) {
    return { label: "Expiring Soon", className: "sb-status-expiring" };
  }

  return { label: "Fresh", className: "sb-status-ok" };
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

// Label and color for an item's stock level.
//
// The backend sets status to "LOW" when the quantity is at
// or below the item's low-stock threshold. Expiration is
// shown separately by getExpirationStatus().
//
// The colors come from the shared sb-status-* classes
// in spacebyte-ui.css.
function getStockStatus(item) {
  if (String(item.status || "").toUpperCase() === "LOW") {
    return { label: "Low Stock", className: "sb-status-low" };
  }

  return { label: "In Stock", className: "sb-status-ok" };
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

  // ID of the item currently being removed, if any.
  const [removingId, setRemovingId] = useState(null);

  // Item waiting for the user to confirm removal.
  // While set, the confirmation dialog is shown.
  const [pendingRemove, setPendingRemove] = useState(null);

  // Close the confirmation dialog when Escape is pressed.
  useEffect(() => {
    if (!pendingRemove) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") setPendingRemove(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingRemove]);

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
  //          REMOVE INVENTORY ITEM
  // ==========================================

  // Permanently delete one item.
  // Called from the confirmation dialog's Remove button.
  async function handleRemove(item) {
    const itemName = item.name || "this item";

    setPendingRemove(null);
    setError("");
    setNotice("");
    setRemovingId(item.id);

    try {
      const token = await user.getIdToken();

      await apiRequest(`/inventory/${item.id}`, token, {
        method: "DELETE",
      });

      setNotice(`${itemName} was removed from inventory.`);

      // Reload so the list and summary cards update.
      await loadInventory();
    } catch (err) {
      console.error("Inventory remove error:", err);
      setError(err.message || "Unable to remove this inventory item.");
    } finally {
      setRemovingId(null);
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
      // "In Stock" and "Low Stock" compare the stock badge;
      // every other option compares the expiration badge.
      .filter((item) => {
        if (filterStatus === "All") return true;

        if (filterStatus === "In Stock" || filterStatus === "Low Stock") {
          return getStockStatus(item).label === filterStatus;
        }

        return getExpirationStatus(item.expirationDate).label === filterStatus;
      })

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
    <section className="sb-nutrition-page sb-inventory-page">

      {/* PAGE HEADER */}

      {/* Displays the page title and refresh button. */}
      <header className="sb-nutrition-header">
        <div>
          <p className="sb-nutrition-eyebrow">CREW GALLEY</p>

          <h1>Food Inventory</h1>

          <p>
            Manage mission food supplies, monitor
            expiration dates, and track nutrition.
          </p>
        </div>

        {/* Reloads inventory from the backend. */}
        <button
          type="button"
          onClick={loadInventory}
          disabled={loading}
          className="sb-nutrition-refresh"
        >
          <RefreshCw size={16} aria-hidden="true" />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* ERROR AND SUCCESS MESSAGES */}

      {error && (
        <p role="alert" className="sb-inventory-message sb-inventory-error">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="sb-inventory-message sb-inventory-success">
          {notice}
        </p>
      )}

      {/* INVENTORY SUMMARY CARDS */}

      {/* These cards summarize the complete inventory.
          They use the totals calculated above. */}
      <div className="sb-stats sb-stats-four">

        {/* Total number of packages across all records. */}
        <div className="sb-stat">
          <span className="sb-stat-icon mint" aria-hidden="true">
            <Package />
          </span>
          <div>
            <small>TOTAL PACKAGES</small>
            <strong>
              {totalPackages} <em>in {items.length} records</em>
            </strong>
          </div>
        </div>

        {/* Combined inventory weight in kilograms. */}
        <div className="sb-stat">
          <span className="sb-stat-icon blue" aria-hidden="true">
            <Scale />
          </span>
          <div>
            <small>TOTAL WEIGHT</small>
            <strong>
              {totalWeightKg.toFixed(2)} <em>kg</em>
            </strong>
          </div>
        </div>

        {/* Number of records expiring within 30 days. */}
        <div className="sb-stat">
          <span className="sb-stat-icon yellow" aria-hidden="true">
            <AlertTriangle />
          </span>
          <div>
            <small>EXPIRING SOON</small>
            <strong>
              {expiringSoonCount} <em>within 30 days</em>
            </strong>
          </div>
        </div>

        {/* Number of expired records and low-stock records. */}
        <div className="sb-stat">
          <span className="sb-stat-icon pink" aria-hidden="true">
            <CalendarDays />
          </span>
          <div>
            <small>EXPIRED</small>
            <strong>
              {expiredCount} <em>{lowStockCount} low stock</em>
            </strong>
          </div>
        </div>

      </div>

      {/* ADD INVENTORY FORM */}

      {/* This section allows the user to enter a new
          food or supply item and save it to the backend. */}
      <section className="sb-inventory-card">

        <div className="sb-inventory-section-heading">
          <div>
            <h2>Add New Inventory Item</h2>
            <p>Enter the food or supply information below.</p>
          </div>
          <PackagePlus color="#b7a0ff" size={24} aria-hidden="true" />
        </div>

        {/* Submitting this form calls handleSubmit. */}
        <form onSubmit={handleSubmit}>

          {/* BASIC FOOD INFORMATION */}

          <h3 className="sb-inventory-subheading">Food Information</h3>

          <div className="sb-inventory-form sb-inventory-form-three">

            {/* Food or supply name. */}
            <label className="sb-inventory-field">
              <span>Item Name *</span>
              <input
                name="name"
                type="text"
                maxLength={120}
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Freeze-Dried Strawberries"
              />
            </label>

            {/* Number of packages or units available. */}
            <label className="sb-inventory-field">
              <span>Quantity *</span>
              <input
                name="quantity"
                type="number"
                min="0"
                step="1"
                required
                value={form.quantity}
                onChange={handleChange}
                placeholder="Number of packages"
              />
            </label>

            {/* Select the category for the item. */}
            <label className="sb-inventory-field">
              <span>Item Type *</span>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
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
            <div className="sb-inventory-field">
              <span>Weight per Item</span>
              <div className="sb-inventory-pair">
                <input
                  name="weight"
                  type="number"
                  min="0.01"
                  step="any"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="250"
                  aria-label="Weight per item"
                />
                <select
                  name="weightUnit"
                  value={form.weightUnit}
                  onChange={handleChange}
                  aria-label="Weight unit"
                >
                  <option value="g">Grams</option>
                  <option value="kg">Kilograms</option>
                  <option value="lb">Pounds</option>
                  <option value="oz">Ounces</option>
                </select>
              </div>
            </div>

            {/* Enter the expected shelf life in days. */}
            <label className="sb-inventory-field">
              <span>Shelf Life (Days)</span>
              <input
                name="shelfLife"
                type="number"
                min="0"
                step="1"
                value={form.shelfLife}
                onChange={handleChange}
                placeholder="180"
              />
            </label>

            {/* Enter the item's expiration date. */}
            <label className="sb-inventory-field">
              <span>Expiration Date</span>
              <input
                name="expirationDate"
                type="date"
                value={form.expirationDate}
                onChange={handleChange}
              />
            </label>

            {/* Set the quantity at which the backend
                should identify the item as low stock. */}
            <label className="sb-inventory-field">
              <span>Low-Stock Alert Threshold</span>
              <input
                name="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                value={form.lowStockThreshold}
                onChange={handleChange}
              />
              <small className="sb-inventory-hint">
                Inventory is marked LOW when quantity is at or below this number.
              </small>
            </label>

          </div>

          {/* NUTRITION INFORMATION */}

          {/* Nutrition values are entered per serving.
              These values are sent to the backend with
              the inventory item. */}
          <div className="sb-inventory-divider">
            <h3 className="sb-inventory-subheading">Nutrition Information</h3>

            <p className="sb-inventory-subtitle sb-inventory-subtitle-tight">
              Enter nutrition values per serving from the
              product label. These fields are optional.
            </p>

            <div className="sb-inventory-form sb-inventory-form-four">

              {/* Generate the nutrition inputs from
                  the NUTRITION_FIELDS configuration. */}
              {NUTRITION_FIELDS.map((field) => (
                <label key={field.name} className="sb-inventory-field">
                  <span>{field.label} ({field.unit})</span>
                  <input
                    name={field.name}
                    type="number"
                    min="0"
                    step="any"
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder="Enter value"
                  />
                </label>
              ))}

            </div>
          </div>

          {/* SUBMIT */}

          {/* The button is disabled while the request
              is being processed to prevent duplicate submissions. */}
          <div className="sb-inventory-divider">
            <button
              type="submit"
              disabled={saving}
              className="sb-inventory-submit sb-button-with-icon"
            >
              <PackagePlus size={16} />
              {saving ? "Saving Inventory Item..." : "Add to Inventory"}
            </button>
          </div>

        </form>
      </section>

      {/* INVENTORY LIST */}

      {/* Displays the saved inventory records and
          provides tools for searching, filtering,
          and sorting the list. */}
      <section className="sb-inventory-card">

        <div className="sb-inventory-section-heading">
          <div>
            <h2>Inventory Overview</h2>
            <p>Search and organize your saved mission supplies.</p>
          </div>
        </div>

        {/* SEARCH, FILTERS, AND SORT */}

        <div className="sb-inventory-form sb-inventory-filters sb-inventory-filters-four">

          {/* Search inventory records by item name. */}
          <label className="sb-inventory-field">
            <span>Search</span>
            <div className="sb-inventory-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search inventory..."
              />
            </div>
          </label>

          {/* Filter by food or supply category. */}
          <label className="sb-inventory-field">
            <span>Type</span>
            <select
              value={filterType}
              onChange={(event) =>
                setFilterType(event.target.value)
              }
            >
              <option value="All">All Item Types</option>
              {ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          {/* Filter by the same labels shown in the
              Status column's badges. */}
          <label className="sb-inventory-field">
            <span>Status</span>
            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value)
              }
            >
              <option value="All">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Fresh">Fresh</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="No expiration date">No Expiration Date</option>
            </select>
          </label>

          {/* Sort records by expiration date or item name. */}
          <label className="sb-inventory-field">
            <span>Sort</span>
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value)
              }
            >
              <option value="soonest">Expiration: Soonest First</option>
              <option value="latest">Expiration: Latest First</option>
              <option value="name">Name: A–Z</option>
            </select>
          </label>

        </div>

        {/* INVENTORY LOADING AND EMPTY STATES */}

        {loading ? (
          <div className="sb-inventory-empty sb-button-with-icon sb-centered">
            <RefreshCw size={20} className="animate-spin" />
            <span>Loading inventory...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="sb-inventory-empty">
            <span aria-hidden="true">📦</span>
            <h3>
              {items.length === 0
                ? "No inventory items yet."
                : "No matching inventory items."}
            </h3>
            <p>
              {items.length === 0
                ? "Add your first item using the form above."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (

          /* INVENTORY RECORDS */

          <div className="sb-inventory-table-wrap">
            <table className="sb-inventory-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Weight</th>
                  <th>Shelf Life</th>
                  <th>Expires</th>
                  <th>Per Serving</th>
                  <th>Status</th>
                  <th aria-label="Remove" />
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => {

                  // Calculate the expiration label and styling
                  // for the current inventory item.
                  const expirationStatus =
                    getExpirationStatus(item.expirationDate);

                  const stockStatus = getStockStatus(item);

                  return (
                    <tr key={item.id}>

                      {/* Item name and category. */}
                      <td className="sb-inventory-item-name">
                        {item.name || "Unnamed Item"}
                        <small className="sb-inventory-item-type">
                          {item.type || "Other"}
                        </small>
                      </td>

                      <td>{item.quantity ?? "—"}</td>

                      <td>{item.weight || "—"}</td>

                      <td>
                        {item.shelfLife === null ||
                        item.shelfLife === undefined
                          ? "—"
                          : `${item.shelfLife} days`}
                      </td>

                      <td>{formatDate(item.expirationDate)}</td>

                      {/* Nutrition values for one serving. */}
                      <td>
                        {item.calories ?? 0} kcal
                        <small className="sb-inventory-item-type">
                          P {item.protein ?? 0}g · C {item.carbs ?? 0}g · F {item.fat ?? 0}g
                        </small>
                      </td>

                      {/* Stock level and expiration status.
                          These labels match the Status filter options. */}
                      <td>
                        <div className="sb-inventory-badges">
                          <span className={`sb-inventory-status ${stockStatus.className}`}>
                            {stockStatus.label}
                          </span>
                          <span className={`sb-inventory-status ${expirationStatus.className}`}>
                            {expirationStatus.label}
                          </span>
                        </div>
                      </td>

                      {/* Permanently remove this item. */}
                      <td>
                        <button
                          type="button"
                          onClick={() => setPendingRemove(item)}
                          disabled={removingId === item.id}
                          aria-label={`Remove ${item.name || "item"}`}
                          className="sb-diet-remove sb-button-with-icon"
                        >
                          <Trash2 size={14} />
                          {removingId === item.id ? "Removing…" : "Remove"}
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Show how many records are currently visible
            compared with the total number of saved records. */}
        <p className="sb-inventory-hint sb-inventory-footer-note">
          Showing {filteredItems.length} of {items.length} inventory records.
        </p>

      </section>

      {/* REMOVE CONFIRMATION DIALOG */}

      {/* Shown after a Remove button is clicked.
          Clicking the dimmed background or pressing
          Escape cancels without removing anything. */}
      {pendingRemove && (
        <div
          className="sb-modal-backdrop"
          onClick={() => setPendingRemove(null)}
        >
          <div
            className="sb-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="sb-modal-icon" aria-hidden="true">
              <Trash2 size={22} />
            </span>

            <h2 id="remove-dialog-title">Remove item?</h2>

            <p>
              <strong>{pendingRemove.name || "This item"}</strong> will be
              permanently removed from the crew inventory.
              This can't be undone.
            </p>

            <div className="sb-modal-actions">
              <button
                type="button"
                className="sb-inventory-refresh"
                onClick={() => setPendingRemove(null)}
                autoFocus
              >
                Cancel
              </button>

              <button
                type="button"
                className="sb-modal-danger"
                onClick={() => handleRemove(pendingRemove)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
