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


  // =========================================================
  // DIETARY RESTRICTIONS PAGE USER INTERFACE
  // =========================================================

  return (
    <div className="sb-inventory-page space-y-6">


      {/* =====================================================
          PAGE HEADER

          Displays the page title and a short explanation
          of the dietary restrictions feature.
      ===================================================== */}

      <div>
        <div className="flex items-center gap-3">

          {/* Shield icon represents dietary safety. */}
          <ShieldCheck size={28} />

          <h1 className="text-2xl font-bold">
            Dietary Restrictions
          </h1>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Manage crew food allergies, dietary needs,
          and food preferences.
        </p>
      </div>


      {/* =====================================================
          SUCCESS MESSAGE

          Displayed after a restriction is successfully
          added or deleted.
      ===================================================== */}

      {message && (
        <div
          role="status"
          className="rounded-lg bg-purple-100 p-3 text-purple-800"
        >
          {message}
        </div>
      )}


      {/* =====================================================
          ERROR MESSAGE

          Displayed when loading, adding, or deleting
          a dietary restriction fails.
      ===================================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
        >
          {error}
        </div>
      )}


      {/* =====================================================
          ADD DIETARY RESTRICTION FORM

          Allows users to enter a new dietary restriction
          and save it to their account.
      ===================================================== */}

      <section className="rounded-xl border p-5">

        <div className="mb-4 flex items-center gap-2">

          {/* Plus icon indicates adding a new record. */}
          <Plus size={20} />

          <h2 className="text-xl font-semibold">
            Add Dietary Restriction
          </h2>
        </div>


        {/* When submitted, the form calls handleAddRestriction. */}
        <form
          onSubmit={handleAddRestriction}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >


          {/* =================================================
              FOOD OR RESTRICTION NAME

              Examples:
              Peanuts, Dairy, Gluten.
          ================================================= */}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Food or Restriction Name *
            </label>

            <input
              type="text"

              // The name identifies which formData property
              // this input updates.
              name="name"

              // Connect the input to React state.
              value={formData.name}

              // Update the form when the user types.
              onChange={handleChange}

              placeholder="Example: Peanuts, Dairy, Gluten"

              // Limit the name to 100 characters.
              maxLength={100}

              // Require the user to enter a restriction name.
              required

              className="w-full rounded-lg border p-3"
            />
          </div>


          {/* =================================================
              RESTRICTION CATEGORY

              Allows users to select the type of restriction.
          ================================================= */}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Restriction Category
            </label>

            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            >

              {/* Create one option for each restriction category. */}
              {restrictionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}

            </select>
          </div>


          {/* =================================================
              SEVERITY

              Allows the user to indicate how serious
              the dietary restriction is.
          ================================================= */}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Severity
            </label>

            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            >
              <option value="Not specified">Not specified</option>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
              <option value="Life-threatening">
                Life-threatening
              </option>
            </select>
          </div>


          {/* =================================================
              ADDITIONAL NOTES

              Provides space for extra information about
              the restriction or food preparation.
          ================================================= */}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Additional Notes
            </label>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add relevant food preparation or avoidance notes..."
              rows={3}

              // Limit additional notes to 1,000 characters.
              maxLength={1000}

              className="w-full rounded-lg border p-3"
            />
          </div>


          {/* =================================================
              SUBMIT BUTTON

              Saves the new dietary restriction.
          ================================================= */}

          <div className="md:col-span-2">
            <button
              type="submit"

              // Prevent another submission while saving.
              disabled={saving}

              className="flex items-center gap-2 rounded-lg px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"

              // Uses the existing SpaceByte purple button color.
              style={{ backgroundColor: "#7650B8" }}
            >

              {/* Show a loading animation while saving. */}
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={18} />
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

      <section className="rounded-xl border p-5">

        <div className="mb-4 flex items-center gap-2">

          {/* Utensils icon represents food information. */}
          <Utensils size={21} />

          <h2 className="text-xl font-semibold">
            Saved Dietary Restrictions
          </h2>
        </div>


        {/* ===================================================
            LOADING STATE

            Displayed while restrictions are being retrieved
            from the backend.
        =================================================== */}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8">

            {/* Animated loading icon. */}
            <Loader2 size={22} className="animate-spin" />

            <span>Loading your saved restrictions...</span>
          </div>


        ) : restrictions.length === 0 ? (

          /* =================================================
             EMPTY STATE

             Displayed when the user has not added any
             dietary restrictions.
          ================================================= */

          <div className="rounded-lg border border-dashed p-8 text-center">

            <ShieldCheck
              size={35}
              className="mx-auto mb-3 text-gray-400"
            />

            <p className="font-semibold">
              No Dietary Restrictions Added
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Add a food allergy, intolerance, or dietary
              preference above.
            </p>

          </div>


        ) : (

          /* =================================================
             SAVED RESTRICTIONS LIST

             Creates a card for each saved dietary restriction.
          ================================================= */

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {restrictions.map((item) => (

              // Each restriction card uses its Firestore ID
              // as its unique React key.
              <article
                key={item.id}
                className="rounded-xl border p-4"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>

                    {/* Display the restriction or food name. */}
                    <h3 className="font-semibold">
                      {item.name}
                    </h3>

                    {/* Display the restriction category. */}
                    <p className="mt-1 text-sm text-gray-500">
                      {item.type}
                    </p>

                  </div>

                  {/* Warning icon highlights the restriction. */}
                  <AlertTriangle
                    size={20}
                    className="text-amber-500"
                  />

                </div>


                {/* Display the saved severity level. */}
                <p className="mt-3 text-sm">
                  <strong>Severity:</strong>{" "}
                  {item.severity}
                </p>


                {/* Display additional notes only when notes exist. */}
                {item.notes && (
                  <p className="mt-2 text-sm text-gray-600">
                    <strong>Notes:</strong> {item.notes}
                  </p>
                )}


                {/* =================================================
                    REMOVE RESTRICTION BUTTON

                    Deletes the selected restriction from the
                    user's Firestore dietaryRestrictions collection.
                ================================================= */}

                <button
                  type="button"

                  // Call handleDelete with this restriction's ID.
                  onClick={() => handleDelete(item.id)}

                  // Disable the button while this restriction
                  // is being deleted.
                  disabled={deletingId === item.id}

                  className="mt-4 flex items-center gap-2 text-sm font-medium text-red-600 disabled:opacity-50"
                >

                  {/* Show a loading animation during deletion.
                      Otherwise, display the trash icon. */}
                  {deletingId === item.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}

                  {/* Change the button text while deleting. */}
                  {deletingId === item.id ? "Removing..." : "Remove"}

                </button>

              </article>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}
