
/*
===========================================================
 SPACEBYTE - OCR FOOD CAPTURE PAGE
 File: frontend/src/components/OcrCapture.jsx

 CURRENT FEATURES:
 1. Allows the user to take or select a food photo.
 2. Displays a preview of the selected photo.
 3. Shows sample food detection results.
 4. Allows the user to select or deselect detected foods.
 5. Allows the user to change each food's quantity.

 IMPORTANT:
 - Real OCR or AI food detection is not connected yet.
 - The food results are currently sample data.
 - The Add to Inventory button is disabled.
 - No photos or food results are saved to Firestore.
===========================================================
*/

// Import React's useState hook to manage information
// that changes while the user interacts with this page.
import { useState } from "react";

// Temporary sample food results.
//
// These results are displayed when the user clicks
// the "Find foods" button.
//
// Later, this array can be replaced with actual results
// returned by an OCR or AI food recognition service.
const SAMPLE_RESULTS = [
  { name: "Apple", quantity: 1 },
  { name: "Mac and cheese", quantity: 1 },
  { name: "Shrimp cocktail", quantity: 1 },
];

export default function OcrCapture() {
  // Stores the temporary URL used to display the selected photo.
  // An empty string means that no photo has been selected.
  const [photoUrl, setPhotoUrl] = useState("");

  // Stores the food results displayed after clicking Find foods.
  // The initial empty array means no results are displayed.
  const [results, setResults] = useState([]);

  // Handles the photo selection or camera capture.
  function handlePhoto(event) {
    // Get the first selected file from the file input.
    // The optional chaining prevents an error if no file exists.
    const file = event.target.files?.[0];

    // Stop the function if the user did not select a photo.
    if (!file) return;

    // Release the previous preview URL from memory
    // before creating a URL for the newly selected photo.
    if (photoUrl) URL.revokeObjectURL(photoUrl);

    // Create a temporary browser URL for the selected photo.
    // This allows the image to appear on the page without
    // uploading it to a server or saving it to Firestore.
    setPhotoUrl(URL.createObjectURL(file));

    // Clear any previous food results because the user
    // has selected a different photo.
    setResults([]);
  }

  // Displays the temporary sample food detection results.
  //
  // This function does not analyze the actual photo yet.
  function findFoods() {
    // Copy the sample results into the results state.
    //
    // The spread operator (...item) copies each food object.
    // The checked property is added so every food starts selected.
    setResults(
      SAMPLE_RESULTS.map((item) => ({ ...item, checked: true }))
    );
  }

  // Updates one food item when the user changes its checkbox
  // or edits its quantity.
  //
  // index identifies which food item should be changed.
  // changes contains the property or properties being updated.
  function updateItem(index, changes) {
    // Use the previous state to create an updated results array.
    setResults((previous) =>
      previous.map((item, i) =>
        // If this is the selected food item, create a new object
        // containing its existing information and updated values.
        i === index ? { ...item, ...changes } : item
      )
    );
  }

  return (
    // Main container for the OCR Capture page.
    <section>
      {/* Page heading */}
      <h2>OCR Capture</h2>

      {/* Instructions explaining how the page currently works. */}
      <p className="sb-muted">
        Take or choose a photo of your food. The results below are
        sample data for now, and nothing is saved.
      </p>

      {/* Photo upload and camera input. */}
      <p style={{ marginTop: 18 }}>
        <input
          // Allows the user to select an image file.
          type="file"

          // Restricts the file picker to image files.
          accept="image/*"

          // Requests the device's rear-facing camera when supported.
          // This is especially useful on mobile devices.
          capture="environment"

          // Runs handlePhoto whenever the selected file changes.
          onChange={handlePhoto}
        />
      </p>

      {/* Display the selected photo only when a photo URL exists. */}
      {photoUrl && (
        <>
          {/* Preview of the photo selected by the user. */}
          <img
            src={photoUrl}
            alt="Selected food"
            style={{
              display: "block",
              width: "100%",
              maxWidth: 320,
              borderRadius: 12,
              margin: "12px 0",
            }}
          />

          {/* Clicking this button displays the sample food results. */}
          <button type="button" onClick={findFoods}>
            Find foods
          </button>
        </>
      )}

      {/* Display the food list only after results are available. */}
      {results.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {/* Heading for the displayed food results. */}
          <h3>Found in photo</h3>

          {/* Create one row for every food item in the results array. */}
          {results.map((item, index) => (
            <div
              // The food name is used as the unique React key.
              key={item.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "8px 0",
                borderBottom: "1px solid #20294e",
              }}
            >
              {/* Food selection checkbox and food name. */}
              <label>
                <input
                  type="checkbox"

                  // Determines whether this food is selected.
                  checked={item.checked}

                  // Updates the checked property when clicked.
                  onChange={(event) =>
                    updateItem(index, {
                      checked: event.target.checked,
                    })
                  }
                />{" "}

                {/* Display the food's name next to its checkbox. */}
                {item.name}
              </label>

              {/* Quantity input for the selected food. */}
              <input
                type="number"

                // Prevents the user from entering negative quantities.
                min="0"

                // Displays the current quantity from React state.
                value={item.quantity}

                // Provides an accessible description for screen readers.
                aria-label={`Quantity of ${item.name}`}

                // Converts the entered quantity to a number
                // and updates the matching food item.
                onChange={(event) =>
                  updateItem(index, {
                    quantity: Number(event.target.value),
                  })
                }

                // Keeps the quantity input compact.
                style={{ width: 70 }}
              />
            </div>
          ))}

          {/* Future functionality:
              This button will eventually send selected food items
              to the backend and save them in the inventory collection.

              It is currently disabled because the inventory
              integration has not been implemented. */}
          <button type="button" disabled style={{ marginTop: 16 }}>
            Add to inventory (coming next)
          </button>
        </div>
      )}
    </section>
  );
}
