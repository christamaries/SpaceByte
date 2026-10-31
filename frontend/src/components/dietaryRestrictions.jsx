/*
===========================================================
 SPACEBYTE - DIETARY RESTRICTIONS
 File: frontend/src/components/DietaryRestrictions.jsx

 PURPOSE:
 Allows signed-in users to manage their dietary restrictions.

 FEATURES:
 1. Loads restrictions from the signed-in user's Firestore data.
 2. Adds restrictions through the authenticated backend.
 3. Deletes restrictions through the authenticated backend.
 4. Uses the existing Firebase authentication token.
 5. Displays loading, success, and error messages.

===========================================================
*/

// Import React hooks.
//
// useState: Stores dietary restrictions, form information,
// and loading or error messages.
//
// useEffect: Loads dietary restrictions when the component opens.
//
// useCallback: Prevents functions from being recreated unnecessarily.
import { useCallback, useEffect, useState } from "react";


// Import icons from the Lucide React icon library.
//
// ShieldCheck: Represents dietary safety and restrictions.
// Plus: Represents adding a new restriction.
// Trash2: Represents deleting a restriction.
// AlertTriangle: Highlights a dietary warning.
// Utensils: Represents food and dietary information.
// Loader2: Displays a loading animation.
import {
  ShieldCheck,
  Plus,
  Trash2,
  AlertTriangle,
  Utensils,
  Loader2
} from "lucide-react";


// Import the existing API helper.
//
// This helper sends authenticated requests to the SpaceByte backend.
import { apiRequest } from "../api";

// Import the existing SpaceByte stylesheet.
import "../spacebyte-ui.css";


// ===========================================================
// RESTRICTION TYPES
// ===========================================================

// These are the available categories a user can select
// when adding a dietary restriction.
const restrictionTypes = [
  "Food Allergy",
  "Food Intolerance",
  "Medical Dietary Restriction",
  "Religious Restriction",
  "Vegetarian",
  "Vegan",
  "Other"
];


// ===========================================================
// INITIAL FORM VALUES
// ===========================================================

// Defines the default values displayed when the form opens.
//
// name: The food or restriction name.
// type: The selected restriction category.
// notes: Additional information about the restriction.
// severity: The seriousness of the restriction.
const initialForm = {
  name: "",
  type: "Food Allergy",
  notes: "",
  severity: "Not specified"
};


// ===========================================================
// SEVERITY BADGE COLORS
// ===========================================================

// Choose the badge style for a severity level 
function getSeverityClass(severity) {
  if (severity === "Severe" || severity === "Life-threatening") {
    return "sb-status-expired";
  }

  if (severity === "Moderate") {
    return "sb-status-low";
  }

  if (severity === "Mild") {
    return "sb-status-ok";
  }

  return "sb-status-expiring";
}


// ===========================================================
// MAIN DIETARY RESTRICTIONS COMPONENT
// ===========================================================

// The user prop contains the currently signed-in Firebase user.
//
// The component uses this account to retrieve an authentication
// token before communicating with the backend.
export default function DietaryRestrictions({ user }) {

  // Stores the dietary restrictions returned by the backend.
  const [restrictions, setRestrictions] = useState([]);

  // Stores the information entered into the add restriction form.
  const [formData, setFormData] = useState(initialForm);


  // =========================================================
  // LOADING STATES
  // =========================================================

  // Tracks whether saved restrictions are being loaded.
  const [loading, setLoading] = useState(true);

  // Tracks whether a new restriction is being saved.
  const [saving, setSaving] = useState(false);

  // Stores the ID of the restriction currently being deleted.
  // This allows the correct Remove button to display a loading state.
  const [deletingId, setDeletingId] = useState(null);

  // Restriction waiting for the user to confirm removal.
  // While set, the confirmation dialog is shown.
  const [pendingDelete, setPendingDelete] = useState(null);

  // Close the confirmation dialog when Escape is pressed.
  useEffect(() => {
    if (!pendingDelete) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") setPendingDelete(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingDelete]);


  // =========================================================
  // SUCCESS AND ERROR MESSAGES
  // =========================================================

  // Stores messages displayed after successful operations.
  const [message, setMessage] = useState("");

  // Stores error messages when an operation fails.
  const [error, setError] = useState("");


  // =========================================================
  // GET FIREBASE AUTHENTICATION TOKEN
  // =========================================================

  // Obtain the Firebase ID token for the current user.
  //
  // The token identifies the signed-in user when the frontend
  // sends requests to protected backend endpoints.
  //
  // useCallback keeps this function stable unless the user changes.
  const getToken = useCallback(async () => {

    // Make sure a user is signed in and that Firebase provides
    // the getIdToken() function.
    if (!user || typeof user.getIdToken !== "function") {
      throw new Error(
        "Please sign in again to manage dietary restrictions."
      );
    }

    // Request and return the user's Firebase authentication token.
    return user.getIdToken();

  }, [user]);


  // =========================================================
  // LOAD SAVED DIETARY RESTRICTIONS
  // =========================================================

  // Retrieves the signed-in user's dietary restrictions
  // from the backend.
  //
  // Backend endpoint:
  // GET /users/dietary-restrictions
  //
  // The backend uses the Firebase token to identify the user
  // and retrieve their saved Firestore records.
  const loadRestrictions = useCallback(async () => {

    // Display the loading state.
    setLoading(true);

    // Clear any previous error before making a new request.
    setError("");

    try {

      // Obtain the Firebase authentication token.
      const token = await getToken();

      // Send an authenticated GET request to the backend.
      const response = await apiRequest(
        "/users/dietary-restrictions",
        token
      );

      // Save the returned restrictions.
      //
      // Array.isArray makes sure the response contains an array.
      // If it does not, use an empty array instead.
      setRestrictions(
        Array.isArray(response.restrictions)
          ? response.restrictions
          : []
      );

    } catch (err) {

      // Log the error in the browser console for debugging.
      console.error("Load dietary restrictions error:", err);

      // Display an error message to the user.
      setError(err.message || "Unable to load dietary restrictions.");

    } finally {

      // Stop displaying the loading indicator.
      // This happens whether the request succeeds or fails.
      setLoading(false);
    }

  }, [getToken]);


  // =========================================================
  // LOAD DATA WHEN THE ACCOUNT CHANGES
  // =========================================================

  // Automatically load dietary restrictions when:
  // 1. The component first appears.
  // 2. The signed-in user's account changes.
  //
  // This ensures the page displays the correct user's records.
  useEffect(() => {
    loadRestrictions();
  }, [loadRestrictions]);


  // =========================================================
  // HANDLE FORM INPUT CHANGES
  // =========================================================

  // This function handles changes to the form fields.
  //
  // It works with the name attribute of each input.
  // For example:
  // name="name" updates formData.name.
  // name="type" updates formData.type.
  // name="notes" updates formData.notes.
  // name="severity" updates formData.severity.
  function handleChange(event) {

    // Get the input's name and current value.
    const { name, value } = event.target;

    // Update only the field that changed.
    //
    // The previous state is copied first so the other
    // form values are not lost.
    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  }


  // =========================================================
  // ADD A NEW DIETARY RESTRICTION
  // =========================================================

  // Handles the form submission when the user clicks
  // the Add Restriction button.
  async function handleAddRestriction(event) {

    // Prevent the browser from refreshing the entire page.
    event.preventDefault();

    // Clear old success and error messages.
    setMessage("");
    setError("");


    // -------------------------------------------------------
    // VALIDATE THE RESTRICTION NAME
    // -------------------------------------------------------

    // A restriction name is required.
    // trim() removes extra spaces before and after the text.
    if (!formData.name.trim()) {
      setError("Please enter a restriction or food name.");
      return;
    }


    // -------------------------------------------------------
    // START THE SAVE OPERATION
    // -------------------------------------------------------

    // Disable the submit button and display the saving state.
    setSaving(true);

    try {

      // Obtain the Firebase authentication token.
      const token = await getToken();


      // -----------------------------------------------------
      // SEND THE NEW RESTRICTION TO THE BACKEND
      // -----------------------------------------------------

      // Send a POST request to:
      // /users/dietary-restrictions
      //
      // JSON.stringify converts the restriction information
      // into JSON before sending it to the backend.
      const response = await apiRequest(
        "/users/dietary-restrictions",
        token,
        {
          method: "POST",
          body: JSON.stringify({

            // Save the restriction name without extra spaces.
            name: formData.name.trim(),

            // Save the selected restriction category.
            type: formData.type,

            // Save the additional notes without extra spaces.
            notes: formData.notes.trim(),

            // Save the selected severity level.
            severity: formData.severity
          })
        }
      );


      // -----------------------------------------------------
      // UPDATE THE DISPLAYED RESTRICTIONS
      // -----------------------------------------------------

      // If the backend returns the newly saved Firestore record,
      // immediately add it to the page.
      if (response.restriction) {

        // Add the new restriction to the beginning of the list.
        setRestrictions((previous) => [
          response.restriction,
          ...previous
        ]);

      } else {

        // If the backend does not return the saved record,
        // reload the restrictions from the backend.
        await loadRestrictions();
      }


      // -----------------------------------------------------
      // RESET THE FORM
      // -----------------------------------------------------

      // Clear the form after a successful save.
      // This restores all fields to their original values.
      setFormData(initialForm);

      // Display a success message.
      setMessage("Dietary restriction saved to your account.");

    } catch (err) {

      // Log the error for debugging.
      console.error("Save dietary restriction error:", err);

      // Display the error message.
      setError(err.message || "Unable to save dietary restriction.");

    } finally {

      // Re-enable the submit button after the request finishes.
      setSaving(false);
    }
  }


  // =========================================================
  // DELETE A SAVED DIETARY RESTRICTION
  // =========================================================

  // Deletes a restriction using its Firestore document ID.
  //
  // Backend endpoint:
  // DELETE /users/dietary-restrictions/:id
  //
  // The backend uses the authenticated user to ensure
  // the request applies to that user's restriction record.
  async function handleDelete(id) {

    // Close the confirmation dialog.
    setPendingDelete(null);

    // Clear previous success and error messages.
    setMessage("");
    setError("");

    // Store the ID of the restriction being deleted.
    setDeletingId(id);

    try {

      // Obtain the Firebase authentication token.
      const token = await getToken();


      // -----------------------------------------------------
      // SEND DELETE REQUEST TO THE BACKEND
      // -----------------------------------------------------

      // encodeURIComponent safely encodes the document ID
      // before adding it to the URL.
      await apiRequest(
        `/users/dietary-restrictions/${encodeURIComponent(id)}`,
        token,
        {
          method: "DELETE"
        }
      );


      // -----------------------------------------------------
      // UPDATE THE RESTRICTION LIST
      // -----------------------------------------------------

      // Remove the deleted restriction from the displayed list.
      //
      // filter() keeps every restriction except the one
      // whose ID matches the deleted document ID.
      setRestrictions((previous) =>
        previous.filter((item) => item.id !== id)
      );

      // Display a successful deletion message.
      setMessage("Dietary restriction removed from your account.");

    } catch (err) {

      // Log the error for debugging.
      console.error("Delete dietary restriction error:", err);

      // Display the error message.
      setError(err.message || "Unable to remove dietary restriction.");

    } finally {

      // Clear the deleting ID and restore the Remove button.
      setDeletingId(null);
    }
  }


  return (
    <div className="sb-nutrition-page sb-inventory-page">


      {/* =====================================================
          PAGE HEADER

          Displays the page title, a short explanation of the
          dietary restrictions feature, and the saved count.
      ===================================================== */}

      <header className="sb-inventory-header">
        <div>
          <p className="sb-inventory-eyebrow">CREW SAFETY</p>

          <h1>Dietary Restrictions</h1>

          <p className="sb-inventory-subtitle">
            Manage crew food allergies, dietary needs,
            and food preferences.
          </p>
        </div>

        <div className="sb-inventory-count">
          <span>Saved</span>
          <strong>{restrictions.length}</strong>
        </div>
      </header>


      {/* =====================================================
          SUCCESS AND ERROR MESSAGES
      ===================================================== */}

      {message && (
        <p role="status" className="sb-inventory-message sb-inventory-success">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="sb-inventory-message sb-inventory-error">
          {error}
        </p>
      )}


      {/* =====================================================
          ADD DIETARY RESTRICTION FORM

          Allows users to enter a new dietary restriction
          and save it to their account.
      ===================================================== */}

      <section className="sb-inventory-card">

        <div className="sb-inventory-section-heading">
          <div>
            <h2>Add Dietary Restriction</h2>
            <p>Fields marked * are required.</p>
          </div>

          {/* Shield icon represents dietary safety. */}
          <ShieldCheck color="#b7a0ff" size={24} aria-hidden="true" />
        </div>


        {/* When submitted, the form calls handleAddRestriction. */}
        <form onSubmit={handleAddRestriction} className="sb-inventory-form">

          {/* Food or restriction name, e.g. Peanuts, Dairy, Gluten. */}
          <label className="sb-inventory-field">
            <span>Food or Restriction Name *</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Example: Peanuts, Dairy, Gluten"
              maxLength={100}
              required
            />
          </label>

          {/* Restriction category. */}
          <label className="sb-inventory-field">
            <span>Restriction Category</span>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              {restrictionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          {/* How serious the restriction is. */}
          <label className="sb-inventory-field">
            <span>Severity</span>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
            >
              <option value="Not specified">Not specified</option>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
              <option value="Life-threatening">Life-threatening</option>
            </select>
          </label>

          {/* Extra preparation or avoidance information. */}
          <label className="sb-inventory-field">
            <span>Additional Notes</span>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add relevant food preparation or avoidance notes..."
              rows={3}
              maxLength={1000}
            />
          </label>

          {/* Saves the new dietary restriction. */}
          <div className="sb-inventory-form-actions">
            <button
              type="submit"
              disabled={saving}
              className="sb-inventory-submit sb-button-with-icon"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Restriction
                </>
              )}
            </button>
          </div>

        </form>
      </section>


      {/* =====================================================
          SAVED DIETARY RESTRICTIONS

          Displays all dietary restrictions associated
          with the currently signed-in user.
      ===================================================== */}

      <section className="sb-inventory-card">

        <div className="sb-inventory-section-heading">
          <div>
            <h2>Saved Dietary Restrictions</h2>
            <p>Restrictions saved to your account.</p>
          </div>

          {/* Utensils icon represents food information. */}
          <Utensils color="#b7a0ff" size={22} aria-hidden="true" />
        </div>


        {loading ? (

          /* Loading state while restrictions are retrieved. */
          <div className="sb-inventory-empty sb-button-with-icon sb-centered">
            <Loader2 size={20} className="animate-spin" />
            <span>Loading your saved restrictions...</span>
          </div>

        ) : restrictions.length === 0 ? (

          /* Empty state when no restrictions have been added. */
          <div className="sb-inventory-empty">
            <ShieldCheck size={32} aria-hidden="true" />
            <h3>No Dietary Restrictions Added</h3>
            <p>
              Add a food allergy, intolerance, or dietary
              preference above.
            </p>
          </div>

        ) : (

          /* One card for each saved dietary restriction. */
          <div className="sb-diet-list">

            {restrictions.map((item) => (
              <article key={item.id} className="sb-diet-item">

                <div className="sb-diet-item-head">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.type}</p>
                  </div>

                  {/* Warning icon highlights the restriction. */}
                  <AlertTriangle size={18} color="#ffd166" aria-hidden="true" />
                </div>

                {/* Saved severity level as a colored badge. */}
                <span className={`sb-inventory-status ${getSeverityClass(item.severity)}`}>
                  {item.severity}
                </span>

                {/* Additional notes, only when notes exist. */}
                {item.notes && (
                  <p className="sb-diet-notes">{item.notes}</p>
                )}

                {/* Deletes this restriction from the user's
                    Firestore dietaryRestrictions collection. */}
                <button
                  type="button"
                  onClick={() => setPendingDelete(item)}
                  disabled={deletingId === item.id}
                  className="sb-diet-remove sb-button-with-icon"
                >
                  {deletingId === item.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {deletingId === item.id ? "Removing..." : "Remove"}
                </button>

              </article>
            ))}

          </div>
        )}

      </section>


      {/* =====================================================
          REMOVE CONFIRMATION DIALOG

          Shown after a Remove button is clicked.
          Clicking the dimmed background or pressing
          Escape cancels without removing anything.
      ===================================================== */}

      {pendingDelete && (
        <div
          className="sb-modal-backdrop"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="sb-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-restriction-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="sb-modal-icon" aria-hidden="true">
              <Trash2 size={22} />
            </span>

            <h2 id="remove-restriction-title">Remove restriction?</h2>

            <p>
              <strong>{pendingDelete.name || "This restriction"}</strong> will
              be permanently removed from your dietary restrictions.
              This can't be undone.
            </p>

            <div className="sb-modal-actions">
              <button
                type="button"
                className="sb-inventory-refresh"
                onClick={() => setPendingDelete(null)}
                autoFocus
              >
                Cancel
              </button>

              <button
                type="button"
                className="sb-modal-danger"
                onClick={() => handleDelete(pendingDelete.id)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
