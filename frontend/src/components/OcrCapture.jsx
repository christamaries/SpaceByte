
/*
===========================================================
 SPACEBYTE - OCR FOOD CAPTURE
 File: frontend/src/components/OcrCapture.jsx

 PURPOSE:
 1. Allow the user to upload or take a food photograph.
 2. Read nutrition-label text using Tesseract.js.
 3. Identify possible foods in a photograph using OWL-ViT.
 4. Let the user review and edit detected information.
 5. Save selected foods to the existing SpaceByte inventory.

 IMPORTANT:
 - No paid OCR API or API token is used.
 - OCR reads text; it does not guarantee that the text
   has been interpreted correctly.
 - Food-photo identification can make mistakes.
 - Review the information before saving it.
===========================================================
*/

// React hooks manage the component's state and lifecycle.
import { useEffect, useRef, useState } from "react";

// Tesseract.js performs text recognition in the browser.
import { createWorker } from "tesseract.js";

// Transformers.js runs the food-photo model in the browser.
import { pipeline } from "@huggingface/transformers";

// Existing SpaceByte API helper.
//
// IMPORTANT:
// Your Inventory.jsx currently imports this helper as:
// import { apiRequest } from "../api";
//
// This version uses the same import path.
// If your actual helper is in src/services/api.js instead,
// change this import to "../services/api".
import { apiRequest } from "../api";

// Use the shared SpaceByte styles.
import "../spacebyte-ui.css";

// =========================================================
//                  FOOD CATEGORIES
// =========================================================

// These are the possible food labels the image model
// will look for in the uploaded photograph.
//
// OWL-ViT compares the photograph against these descriptions.
// It does not know every food automatically.
const FOOD_CATEGORIES = [
  "apple",
  "banana",
  "orange",
  "strawberry",
  "grapes",
  "watermelon",
  "broccoli",
  "carrot",
  "lettuce",
  "tomato",
  "potato",
  "corn",
  "rice",
  "pasta",
  "macaroni and cheese",
  "bread",
  "sandwich",
  "pizza",
  "hamburger",
  "chicken",
  "fried chicken",
  "fish",
  "shrimp",
  "shrimp cocktail",
  "beef",
  "eggs",
  "cheese",
  "yogurt",
  "milk",
  "cereal",
  "soup",
  "beans",
  "nuts",
  "canned food",
  "food package",
  "bottle of water",
  "juice",
];

// These are the same general food-storage categories
// used by your Inventory.jsx component.
const ITEM_TYPES = [
  "Natural Form",
  "Beverage",
  "Thermostabilized",
  "Rehydratable",
  "Irradiated",
  "Intermediate Moisture",
  "Fresh Food",
  "Other",
];

// =========================================================
//                  HELPER FUNCTIONS
// =========================================================

// Convert a value into a safe nonnegative number.
//
// If OCR returns something that is not a valid number,
// use zero instead of allowing invalid data into inventory.
function safeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

// Create an inventory item in the format expected
// by your existing POST /inventory endpoint.
function createFoodResult(name, values = {}) {
  return {
    // Food name displayed in the results.
    name: name || "Unknown food",

    // Default quantity is one package or item.
    quantity: "1",

    // Weight can be entered or corrected by the user.
    weight: "",

    // Shelf life is optional.
    shelfLife: "",

    // Expiration date is optional.
    expirationDate: "",

    // Use a category supported by Inventory.jsx.
    type: "Other",

    // Nutrition values can be filled from OCR.
    calories: values.calories ?? "",
    protein: values.protein ?? "",
    carbs: values.carbs ?? "",
    fat: values.fat ?? "",

    // New results are selected by default.
    checked: true,

    // Store the model confidence when available.
    confidence: values.confidence ?? null,
  };
}

// =========================================================
//              PARSE NUTRITION LABEL TEXT
// =========================================================

// Tesseract returns text from the photograph.
// This function attempts to find common nutrition values.
//
// NOTE:
// Food labels have different layouts.
// Always check the values before saving them.
function parseNutritionText(text) {
  const normalizedText = String(text || "")
    .replace(/,/g, "")
    .replace(/\r/g, "\n");

  // Find calories.
  // Example: Calories 250
  const caloriesMatch = normalizedText.match(
    /calories\s*[:\-]?\s*(\d+(?:\.\d+)?)/i
  );

  // Find protein.
  // Example: Protein 10g
  const proteinMatch = normalizedText.match(
    /protein\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i
  );

  // Find total carbohydrates.
  const carbsMatch = normalizedText.match(
    /(?:total\s+)?carbohydrates?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i
  );

  // Find total fat.
  const fatMatch = normalizedText.match(
    /(?:total\s+)?fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i
  );

  // Return the extracted values.
  return {
    calories: caloriesMatch ? caloriesMatch[1] : "",
    protein: proteinMatch ? proteinMatch[1] : "",
    carbs: carbsMatch ? carbsMatch[1] : "",
    fat: fatMatch ? fatMatch[1] : "",
  };
}

// Try to find a possible food name from the label.
//
// This is only a suggestion. The user can edit it.
function findPossibleFoodName(text) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Skip common nutrition-label headings and numbers.
  const ignoredWords =
    /nutrition facts|serving size|calories|protein|total fat|total carbohydrate|ingredients|amount per serving|% daily value/i;

  const possibleName = lines.find((line) => {
    return (
      line.length >= 3 &&
      line.length <= 65 &&
      !ignoredWords.test(line) &&
      !/^\d+([.,]\d+)?\s*(g|mg|kg|oz|calories)?$/i.test(line)
    );
  });

  return possibleName || "Scanned food item";
}

// =========================================================
//                  MAIN COMPONENT
// =========================================================

// The parent component must pass the authenticated
// Firebase user into this component.
//
// Example:
// <OcrCapture user={user} />
export default function OcrCapture({ user }) {

  // -------------------------------------------------------
  //                         STATE
  // -------------------------------------------------------

  // Stores the uploaded photograph.
  const [selectedFile, setSelectedFile] = useState(null);

  // Stores the temporary image URL used for the preview.
  const [photoUrl, setPhotoUrl] = useState("");

  // Determines which scanning method the user selected.
  const [mode, setMode] = useState("label");

  // Stores the food items found by OCR or the image model.
  const [results, setResults] = useState([]);

  // Stores all text extracted from a nutrition label.
  const [rawText, setRawText] = useState("");

  // Tracks loading and saving operations.
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  // Displays progress information.
  const [progress, setProgress] = useState("");

  // Displays error and success messages.
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // These refs keep the models available between scans.
// The models are loaded only when the user needs them.

// Stores the Tesseract OCR worker.
const workerRef = useRef(null);

// Stores the CLIP image-classification model.
const detectorRef = useRef(null);

// -------------------------------------------------------
//              CLEAN UP IMAGE URL
// -------------------------------------------------------

// Release the previous image URL when a new image is
// selected or when this component is removed.
useEffect(() => {
  return () => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
  };
}, [photoUrl]);

// Terminate the OCR worker only when the component
// is actually unmounted, not whenever the photo changes.
useEffect(() => {
  return () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };
}, []);

// -------------------------------------------------------
//                 SELECT AN IMAGE
// -------------------------------------------------------

function handlePhoto(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  // Only accept image files.
  if (!file.type.startsWith("image/")) {
    setError("Please select a valid image file.");
    event.target.value = "";
    return;
  }

  // Create a temporary preview URL.
  // The cleanup effect above will release the old URL.
  const newPhotoUrl = URL.createObjectURL(file);

  setSelectedFile(file);
  setPhotoUrl(newPhotoUrl);

  // Reset information from the previous scan.
  setResults([]);
  setRawText("");
  setError("");
  setStatus("");
  setProgress("");

  // Reset the file input so the same image can be selected again.
  event.target.value = "";
}

  // -------------------------------------------------------
  //                UPDATE A DETECTED ITEM
  // -------------------------------------------------------

  // This function lets the user correct information
  // before saving it to the inventory.
  function updateResult(index, changes) {
    setResults((currentResults) =>
      currentResults.map((item, currentIndex) =>
        currentIndex === index
          ? { ...item, ...changes }
          : item
      )
    );
  }

  // -------------------------------------------------------
  //                GET THE OCR WORKER
  // -------------------------------------------------------

  // Create the Tesseract worker only once.
  //
  // Reusing the worker prevents unnecessary downloads
  // every time the user scans a new nutrition label.
  async function getOcrWorker() {
    if (workerRef.current) {
      return workerRef.current;
    }

    setProgress("Loading the OCR text-recognition engine...");

    const worker = await createWorker("eng", 1, {
      logger: (message) => {
        if (message.status === "recognizing text") {
          const percent = Math.round(
            (message.progress || 0) * 100
          );

          setProgress(`Reading label: ${percent}%`);
        }
      },
    });

    workerRef.current = worker;

    return worker;
  }

  // -------------------------------------------------------
  //              SCAN A NUTRITION LABEL
  // -------------------------------------------------------

  async function scanNutritionLabel() {
    setError("");
    setStatus("");
    setResults([]);
    setRawText("");

    // The user must select an image first.
    if (!selectedFile) {
      setError("Please upload a food-label photograph first.");
      return;
    }

    setBusy(true);

    try {
      // Get the OCR worker.
      const worker = await getOcrWorker();

      setProgress("Reading the nutrition label...");

      // Recognize text in the selected image.
      const recognition = await worker.recognize(selectedFile);

      // Save the complete extracted text.
      const extractedText = recognition.data.text || "";
      setRawText(extractedText);

      // Convert the extracted text into nutrition values.
      const nutrition = parseNutritionText(extractedText);

      // Attempt to identify the product name.
      const foodName = findPossibleFoodName(extractedText);

      // Create one editable result.
      const foodItem = createFoodResult(foodName, nutrition);

      setResults([foodItem]);

      setStatus(
        "Label scanned. Please review the food name and nutrition values."
      );

      setProgress("");
    } catch (err) {
      console.error("OCR scanning error:", err);

      setError(
        err.message ||
        "Unable to read this label. Try a clearer photograph."
      );

      setProgress("");
    } finally {
      setBusy(false);
    }
  }

  
  // -------------------------------------------------------
  //             LOAD THE FOOD PHOTO MODEL
  // -------------------------------------------------------

  // CLIP is a zero-shot image-classification model.
  //
  // It compares the uploaded photograph with the food
  // descriptions in FOOD_CATEGORIES.
  //
  // Unlike OWL-ViT, CLIP ranks possible food categories
  // instead of locating individual objects with boxes.
  //
  // The model downloads when first needed and is reused
  // for subsequent photographs.

  async function getFoodDetector() {

    // Reuse the model if it has already been loaded.
    if (detectorRef.current) {
      return detectorRef.current;
    }

    setProgress("Downloading/loading the CLIP food-recognition model...");

    // Load CLIP using the supported image-classification task.
    const classifier = await pipeline(
      "zero-shot-image-classification",
      "Xenova/clip-vit-base-patch32"
    );

    // Save the model so it does not need to load again.
    detectorRef.current = classifier;

    return classifier;
  }

  
  // -------------------------------------------------------
  //              IDENTIFY FOOD IN A PHOTO
  // -------------------------------------------------------

  async function identifyFoods() {

    setError("");
    setStatus("");
    setResults([]);

    // Make sure the user selected an image.
    if (!selectedFile || !photoUrl) {
      setError("Please upload a food photograph first.");
      return;
    }

    setBusy(true);

    try {

      // Load or reuse the CLIP image-classification model.
      const classifier = await getFoodDetector();

      setProgress("Analyzing the photograph for possible foods...");

      // Compare the photograph against the available
      // food categories.
      //
      // CLIP returns predictions ranked by similarity.
      const predictions = await classifier(
        photoUrl,
        FOOD_CATEGORIES
      );

      // Keep the six highest-ranked suggestions.
      // These are suggestions, not confirmed food identifications.
      const topPredictions = (predictions || []).slice(0, 6);

      // Convert the model predictions into the same
      // editable result format used by the inventory page.
      const uniqueFoods = [];

      for (const prediction of topPredictions) {

        const foodName = prediction.label;

        // Skip predictions without a valid label.
        if (!foodName || typeof foodName !== "string") {
          continue;
        }

        // Prevent duplicate food suggestions.
        const alreadyAdded = uniqueFoods.some(
          (item) =>
            item.name.toLowerCase() === foodName.toLowerCase()
        );

        if (!alreadyAdded) {

          uniqueFoods.push(
            createFoodResult(foodName, {
              confidence: prediction.score,
            })
          );
        }
      }

      // Display the possible food matches.
      setResults(uniqueFoods);

      if (uniqueFoods.length === 0) {

        setStatus(
          "No food suggestions were returned. Try another photograph."
        );

      } else {

        setStatus(
          "Possible foods identified. Review and correct the suggestions before saving."
        );
      }

      setProgress("");

    } catch (err) {

      console.error("CLIP food identification error:", err);

      setError(
        err.message ||
        "Unable to identify foods in this photograph. Please try another image."
      );

      setProgress("");

    } finally {

      setBusy(false);
    }
  }


  // -------------------------------------------------------
//             SAVE SELECTED INVENTORY ITEMS
// -------------------------------------------------------

async function addSelectedToInventory() {
  setError("");
  setStatus("");

  // Require a signed-in Firebase user.
  if (!user) {
    setError("Please sign in before adding inventory.");
    return;
  }

  // Make sure every selected item has a food name.
  const hasInvalidName = results.some(
    (item) =>
      item.checked &&
      (!item.name || !item.name.trim())
  );

  // Stop saving if a selected food has no name.
  if (hasInvalidName) {
    setError("Every selected food must have a name.");
    return;
  }

  // Only save results that the user selected.
  const selectedItems = results.filter(
    (item) => item.checked
  );

  // Make sure at least one food is selected.
  if (selectedItems.length === 0) {
    setError("Please select at least one food item.");
    return;
  }

  setSaving(true);

  let savedCount = 0;

    try {
      // Retrieve the Firebase ID token.
      // The backend uses this token to authenticate the request.
      const token = await user.getIdToken();

      // Save each selected food item.
      //
      // A separate POST request is sent for each item.
      for (const item of selectedItems) {

        // Create the payload using the same field names
        // expected by your existing Inventory.jsx form.
        const payload = {
          name: item.name.trim(),

          quantity: safeNumber(item.quantity) || 1,

          // Inventory.jsx stores weight as text,
          // for example "250 g" or "2 kg".
          weight: item.weight || "",

          // Shelf life is optional.
          shelfLife:
            item.shelfLife === "" ||
            item.shelfLife === null
              ? null
              : safeNumber(item.shelfLife),

          // Expiration date is optional.
          expirationDate: item.expirationDate || null,

          // Use the selected inventory category.
          type: ITEM_TYPES.includes(item.type)
            ? item.type
            : "Other",

          // Nutrition values are sent as numbers.
          calories: safeNumber(item.calories),
          protein: safeNumber(item.protein),
          carbs: safeNumber(item.carbs),
          fat: safeNumber(item.fat),

          // Use the same default threshold as Inventory.jsx.
          lowStockThreshold: 10,
        };

        // Send the authenticated POST request.
        const response = await apiRequest(
          "/inventory",
          token,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        // Confirm that the backend returned the saved item.
        if (!response || !response.item) {
          throw new Error(
            `The server did not confirm saving ${item.name}.`
          );
        }

        savedCount += 1;
      }

      // Display the successful save count.
      setStatus(
        `${savedCount} food item(s) added to your inventory.`
      );

      // Remove saved results from the OCR screen.
      setResults((currentResults) =>
        currentResults.filter((item) => !item.checked)
      );
    } catch (err) {
      console.error("OCR inventory save error:", err);

      setError(
        err.message ||
        "Unable to save the selected foods."
      );

      if (savedCount > 0) {
        setStatus(
          `${savedCount} item(s) were saved before the error occurred.`
        );
      }
    } finally {
      setSaving(false);
    }
  }

// -------------------------------------------------------
//                    CLEAR THE IMAGE
// -------------------------------------------------------

function clearImage() {
  // The photoUrl cleanup effect releases the old URL.
  setSelectedFile(null);
  setPhotoUrl("");

  setResults([]);
  setRawText("");
  setError("");
  setStatus("");
  setProgress("");
}

  // =========================================================
  //                       PAGE UI
  // =========================================================

  return (
    <section className="sb-nutrition-page">

      {/* PAGE HEADER */}
      <header className="sb-nutrition-header">
        <div>
          <h1>OCR Food Capture</h1>

          <p>
            Scan food labels or identify foods from
            photographs to add them to your mission inventory.
          </p>
        </div>
      </header>

      {/* SCANNING MODE SELECTOR */}
      <div className="sb-card">
        <h2>Choose a scanning method</h2>

        <div className="sb-ocr-mode-buttons">
          <button
            type="button"
            onClick={() => {
              setMode("label");
              setResults([]);
              setError("");
              setStatus("");
            }}
            disabled={busy}
            aria-pressed={mode === "label"}
          >
            Scan Nutrition Label
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("photo");
              setResults([]);
              setError("");
              setStatus("");
            }}
            disabled={busy}
            aria-pressed={mode === "photo"}
          >
            Identify Food Photograph
          </button>
        </div>

        {mode === "label" ? (
          <p>
            Use this option to read text from a nutrition
            facts panel or packaged-food label.
          </p>
        ) : (
          <p>
            Use this option to identify possible foods
            in a photograph.
          </p>
        )}
      </div>

      {/* IMAGE UPLOAD */}
      <div className="sb-card">
        <h2>Upload a photograph</h2>

        <p>
          Select a photograph from your device or take
          a new picture using your camera.
        </p>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          disabled={busy || saving}
        />

        {/* IMAGE PREVIEW */}
        {photoUrl && (
          <div className="sb-ocr-preview">
            <img
              src={photoUrl}
              alt="Selected food or nutrition label"
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                marginTop: "16px",
              }}
            />

            <button
              type="button"
              onClick={clearImage}
              disabled={busy || saving}
            >
              Remove Photograph
            </button>
          </div>
        )}

        {/* RUN THE SELECTED SCAN */}
        <button
          type="button"
          onClick={
            mode === "label"
              ? scanNutritionLabel
              : identifyFoods
          }
          disabled={!selectedFile || busy || saving}
        >
          {busy
            ? "Processing Photograph..."
            : mode === "label"
              ? "Scan Nutrition Label"
              : "Identify Foods"}
        </button>

        {/* PROGRESS MESSAGE */}
        {progress && (
          <p role="status">
            {progress}
          </p>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <p
          role="alert"
          className="sb-inventory-message sb-inventory-error"
        >
          {error}
        </p>
      )}

      {/* SUCCESS OR INFORMATION MESSAGE */}
      {status && (
        <p
          role="status"
          className="sb-inventory-message sb-inventory-success"
        >
          {status}
        </p>
      )}

      {/* DETECTED FOOD RESULTS */}
      {results.length > 0 && (
        <div className="sb-card">
          <h2>Review detected foods</h2>

          <p>
            Check the foods you want to save. Correct
            the names and values before adding them.
          </p>

          {results.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="sb-ocr-result"
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              {/* SELECT OR DESELECT THIS FOOD */}
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(item.checked)}
                  onChange={(event) =>
                    updateResult(index, {
                      checked: event.target.checked,
                    })
                  }
                />

                Add this food to inventory
              </label>

              {/* FOOD NAME */}
              <div>
                <label>
                  Food name

                  <input
                    type="text"
                    value={item.name}
                    onChange={(event) =>
                      updateResult(index, {
                        name: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* QUANTITY */}
              <div>
                <label>
                  Quantity

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(event) =>
                      updateResult(index, {
                        quantity: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* WEIGHT */}
              <div>
                <label>
                  Weight (example: 250 g)

                  <input
                    type="text"
                    value={item.weight}
                    placeholder="Enter weight"
                    onChange={(event) =>
                      updateResult(index, {
                        weight: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* SHELF LIFE */}
              <div>
                <label>
                  Shelf life (days)

                  <input
                    type="number"
                    min="0"
                    value={item.shelfLife}
                    onChange={(event) =>
                      updateResult(index, {
                        shelfLife: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* EXPIRATION DATE */}
              <div>
                <label>
                  Expiration date

                  <input
                    type="date"
                    value={item.expirationDate}
                    onChange={(event) =>
                      updateResult(index, {
                        expirationDate: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* FOOD CATEGORY */}
              <div>
                <label>
                  Food category

                  <select
                    value={item.type}
                    onChange={(event) =>
                      updateResult(index, {
                        type: event.target.value,
                      })
                    }
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* NUTRITION INFORMATION */}
              <h3>Nutrition information</h3>

              <div>
                <label>
                  Calories (kcal)

                  <input
                    type="number"
                    min="0"
                    value={item.calories}
                    onChange={(event) =>
                      updateResult(index, {
                        calories: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div>
                <label>
                  Protein (g)

                  <input
                    type="number"
                    min="0"
                    value={item.protein}
                    onChange={(event) =>
                      updateResult(index, {
                        protein: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div>
                <label>
                  Carbohydrates (g)

                  <input
                    type="number"
                    min="0"
                    value={item.carbs}
                    onChange={(event) =>
                      updateResult(index, {
                        carbs: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div>
                <label>
                  Fat (g)

                  <input
                    type="number"
                    min="0"
                    value={item.fat}
                    onChange={(event) =>
                      updateResult(index, {
                        fat: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* SHOW MODEL CONFIDENCE WHEN AVAILABLE */}
              {item.confidence !== null && (
                <p>
                  Model confidence:{" "}
                  {Math.round(item.confidence * 100)}%
                </p>
              )}
            </div>
          ))}

          {/* SAVE SELECTED FOODS */}
          <button
            type="button"
            onClick={addSelectedToInventory}
            disabled={saving || busy}
          >
            {saving
              ? "Adding to Inventory..."
              : "Add Selected Foods to Inventory"}
          </button>
        </div>
      )}

      {/* SHOW THE ORIGINAL OCR TEXT */}
      {rawText && (
        <details className="sb-card">
          <summary>
            View extracted label text
          </summary>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {rawText}
          </pre>
        </details>
      )}

      {/* EXPLANATION */}
      <div className="sb-card">
        <h2>How SpaceByte scanning works</h2>

        <p>
          Scanning results are suggestions. Always verify
          food names and nutrition values before saving.
        </p>
      </div>
    </section>
  );
}
