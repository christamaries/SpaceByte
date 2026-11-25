/*
===========================================================
 SPACEBYTE - OCR FOOD CAPTURE
 File: frontend/src/components/OcrCapture.jsx

 PURPOSE:
 1. Upload or take a food photograph.
 2. Read nutrition-label text using Tesseract.js.
 3. Identify possible foods using CLIP.
 4. Search the SpaceByte nutrition lookup service.
 5. Display up to three nutrition matches.
 6. Let the astronaut select and edit the correct match.
 7. Save selected foods to the existing inventory.

 IMPORTANT:
 - No paid OCR API or API token is used.
 - Tesseract.js reads label text.
 - CLIP identifies possible foods from photographs.
 - Food identification can make mistakes.
 - Nutrition matches must be reviewed.
 - Database values are currently displayed per 100 grams.
===========================================================
*/

// =========================================================
//                         IMPORTS
// =========================================================

import { useEffect, useRef, useState } from "react";

import { createWorker } from "tesseract.js";

import { pipeline } from "@huggingface/transformers";

// Existing SpaceByte API helper.
import { apiRequest } from "../api";

// SpaceByte nutrition lookup helper.
import { lookupFood } from "../services/foodLookup";

// Shared SpaceByte styles.
import "../spacebyte-ui.css";

// =========================================================
//                    FOOD CATEGORIES
// =========================================================

// CLIP compares the uploaded photograph against these
// possible food descriptions.

const FOOD_CATEGORIES = [
  // Fruits
  "avocado",
  "apple",
  "banana",
  "orange",
  "lemon",
  "lime",
  "grapes",
  "strawberry",
  "blueberry",
  "raspberry",
  "blackberry",
  "watermelon",
  "cantaloupe",
  "honeydew",
  "pineapple",
  "mango",
  "papaya",
  "peach",
  "pear",
  "plum",
  "kiwi",
  "cherries",
  "coconut",
  "pomegranate",

  // Vegetables
  "broccoli",
  "cauliflower",
  "lettuce",
  "spinach",
  "kale",
  "cabbage",
  "green beans",
  "peas",
  "asparagus",
  "celery",
  "cucumber",
  "zucchini",
  "eggplant",
  "bell pepper",
  "jalapeno pepper",
  "tomato",
  "carrot",
  "potato",
  "sweet potato",
  "onion",
  "garlic",
  "mushroom",
  "corn",
  "beet",
  "radish",
  "pumpkin",
  "butternut squash",
  "brussels sprouts",

  // Beans and legumes
  "black beans",
  "kidney beans",
  "pinto beans",
  "chickpeas",
  "lentils",
  "edamame",
  "soybeans",

  // Grains and carbohydrates
  "white rice",
  "brown rice",
  "quinoa",
  "oatmeal",
  "pasta",
  "spaghetti",
  "macaroni",
  "bread",
  "bagel",
  "tortilla",
  "cereal",
  "crackers",

  // Meat and poultry
  "chicken breast",
  "chicken thighs",
  "fried chicken",
  "turkey",
  "ground beef",
  "steak",
  "pork chop",
  "bacon",
  "ham",
  "sausage",

  // Seafood
  "salmon",
  "tuna",
  "shrimp",
  "crab",
  "lobster",
  "tilapia",
  "cod",
  "fish fillet",

  // Dairy and eggs
  "whole eggs",
  "boiled eggs",
  "cheese",
  "milk",
  "yogurt",
  "butter",
  "cottage cheese",

  // Prepared foods
  "pizza",
  "hamburger",
  "sandwich",
  "salad",
  "soup",
  "french fries",
  "mashed potatoes",
  "rice and beans",

  // Nuts and seeds
  "almonds",
  "peanuts",
  "walnuts",
  "cashews",
  "chia seeds",
  "sunflower seeds",

  // Other foods and beverages
  "food in a can",
  "frozen food",
  "food package",
  "bottle of water",
  "juice",
  "unknown or unidentifiable object",
];

// =========================================================
//                    INVENTORY TYPES
// =========================================================

// These categories match the existing Inventory.jsx form.

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
//                    HELPER FUNCTIONS
// =========================================================

// Convert a value into a safe nonnegative number.

function safeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

// Create an item in the format expected by SpaceByte.

function createFoodResult(name, values = {}) {
  return {
    name: name || "Unknown food",

    quantity: "1",

    weight: "",

    shelfLife: "",

    expirationDate: "",

    type: "Other",

    // Nutrition information.
    calories: values.calories ?? "",
    protein: values.protein ?? "",
    carbs: values.carbs ?? "",
    fat: values.fat ?? "",

    // Select the item by default.
    checked: true,

    // CLIP confidence score.
    confidence: values.confidence ?? null,

    // Nutrition database alternatives.
    nutritionMatches: values.nutritionMatches ?? [],

    // -1 means no database match has been selected.
    selectedNutritionIndex: -1,

    // Photo-identified foods require confirmation.
    requiresNutritionConfirmation:
      values.requiresNutritionConfirmation ?? false,
  };
}

// =========================================================
//              PARSE NUTRITION LABEL TEXT
// =========================================================

// Extract common nutrition values from OCR text.
//
// These values come from the photographed label.
// They are suggestions and should be reviewed.

function parseNutritionText(text) {
  const normalizedText = String(text || "")
    .replace(/,/g, "")
    .replace(/\r/g, "\n");

  const caloriesMatch = normalizedText.match(
    /calories\s*[:\-]?\s*(\d+(?:\.\d+)?)/i
  );

  const proteinMatch = normalizedText.match(
    /protein\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i
  );

  const carbsMatch = normalizedText.match(
    /(?:total\s+)?carbohydrates?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i
  );

  const fatMatch = normalizedText.match(
    /(?:total\s+)?fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i
  );

  return {
    calories: caloriesMatch ? caloriesMatch[1] : "",
    protein: proteinMatch ? proteinMatch[1] : "",
    carbs: carbsMatch ? carbsMatch[1] : "",
    fat: fatMatch ? fatMatch[1] : "",
  };
}

// =========================================================
//                 FIND FOOD NAME FROM LABEL
// =========================================================

function findPossibleFoodName(text) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

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
//                   MAIN COMPONENT
// =========================================================

export default function OcrCapture({ user }) {

  // =======================================================
  //                         STATE
  // =======================================================

  // Uploaded photograph.
  const [selectedFile, setSelectedFile] = useState(null);

  // Temporary photograph preview URL.
  const [photoUrl, setPhotoUrl] = useState("");

  // Scanning mode: label or photo.
  const [mode, setMode] = useState("label");

  // Detected food results.
  const [results, setResults] = useState([]);

  // Text extracted from nutrition labels.
  const [rawText, setRawText] = useState("");

  // Loading and saving states.
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  // Progress and messages.
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // =======================================================
  //                          REFS
  // =======================================================

  // Reuse the OCR worker between scans.
  const workerRef = useRef(null);

  // Reuse the CLIP model between scans.
  const detectorRef = useRef(null);

  // =======================================================
  //                   CLEAN UP IMAGE URL
  // =======================================================

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  // =======================================================
  //                  CLEAN UP OCR WORKER
  // =======================================================

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // =======================================================
  //                     SELECT IMAGE
  // =======================================================

  function handlePhoto(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    // Verify that the selected file is an image.
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    // Create a temporary preview URL.
    const newPhotoUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPhotoUrl(newPhotoUrl);

    // Clear previous scan information.
    setResults([]);
    setRawText("");
    setError("");
    setStatus("");
    setProgress("");

    // Allow the same photograph to be selected again.
    event.target.value = "";
  }

  // =======================================================
  //                  UPDATE DETECTED FOOD
  // =======================================================

  // Update one food result without replacing other results.

  function updateResult(index, changes) {
    setResults((currentResults) =>
      currentResults.map((item, currentIndex) =>
        currentIndex === index
          ? { ...item, ...changes }
          : item
      )
    );
  }

  // =======================================================
  //                    GET OCR WORKER
  // =======================================================

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

  // =======================================================
  //                SCAN NUTRITION LABEL
  // =======================================================

  async function scanNutritionLabel() {
    setError("");
    setStatus("");
    setResults([]);
    setRawText("");

    if (!selectedFile) {
      setError(
        "Please upload a food-label photograph first."
      );
      return;
    }

    setBusy(true);

    try {
      // Load or reuse Tesseract.
      const worker = await getOcrWorker();

      setProgress("Reading the nutrition label...");

      // Recognize the text in the photograph.
      const recognition = await worker.recognize(selectedFile);

      const extractedText = recognition.data.text || "";

      setRawText(extractedText);

      // Extract nutrition values.
      const nutrition = parseNutritionText(extractedText);

      // Suggest a food name.
      const foodName = findPossibleFoodName(extractedText);

      // Create an editable food result.
      const foodItem = createFoodResult(
        foodName,
        nutrition
      );

      setResults([foodItem]);

      setStatus(
        "Label scanned. Please review the food name and nutrition values."
      );

    } catch (err) {
      console.error("OCR scanning error:", err);

      setError(
        err.message ||
        "Unable to read this label. Try a clearer photograph."
      );

    } finally {
      setProgress("");
      setBusy(false);
    }
  }

  // =======================================================
  //                 LOAD FOOD PHOTO MODEL
  // =======================================================

  // CLIP performs zero-shot image classification.
  // It compares the photograph with FOOD_CATEGORIES.

  async function getFoodDetector() {
    if (detectorRef.current) {
      return detectorRef.current;
    }

    setProgress("Loading food recognition model...");

    const classifier = await pipeline(
      "zero-shot-image-classification",
      "Xenova/clip-vit-base-patch32"
    );

    detectorRef.current = classifier;

    return classifier;
  }

  // =======================================================
  //                 IDENTIFY FOOD IN PHOTO
  // =======================================================

  async function identifyFoods() {
    setError("");
    setStatus("");
    setResults([]);

    if (!selectedFile || !photoUrl) {
      setError(
        "Please upload a food photograph first."
      );
      return;
    }

    setBusy(true);

    try {
      // Load or reuse CLIP.
      const classifier = await getFoodDetector();

      setProgress("Analyzing your food photograph...");

      // Compare the photograph against the food categories.
      const predictions = await classifier(
        photoUrl,
        FOOD_CATEGORIES
      );

      if (!predictions || predictions.length === 0) {
        setStatus(
          "Unable to identify this food. Try another photograph."
        );
        return;
      }

      // Sort predictions from highest to lowest score.
      const rankedPredictions = [...predictions].sort(
        (a, b) => b.score - a.score
      );

      // Select the strongest prediction.
      const bestPrediction = rankedPredictions[0];

      const bestLabel = String(
        bestPrediction.label || ""
      ).toLowerCase();

      // Reject unknown and low-confidence predictions.
      if (
        bestLabel.includes("unknown") ||
        bestLabel.includes("unidentifiable") ||
        bestPrediction.score < 0.10
      ) {
        setStatus(
          "SpaceByte could not confidently identify this food. Please try a clearer photograph."
        );
        return;
      }

      // ---------------------------------------------------
      //             LOOK UP NUTRITION MATCHES
      // ---------------------------------------------------

      setProgress(
        `Finding nutrition information for ${bestPrediction.label}...`
      );

      let nutritionMatches = [];

      try {
        // Request the top three nutrition matches.
        nutritionMatches = await lookupFood(
          bestPrediction.label,
          3
        );

      } catch (lookupError) {
        console.warn(
          "Nutrition lookup failed:",
          lookupError
        );

        setError(
          "The food was identified, but nutrition information could not be retrieved. You can enter nutrition manually."
        );
      }

      // ---------------------------------------------------
      //              CREATE FOOD RESULT
      // ---------------------------------------------------

      // Do not automatically select a nutrition match.
      // The astronaut must confirm the correct product.

      const foodItem = createFoodResult(
        bestPrediction.label,
        {
          confidence: bestPrediction.score,
          nutritionMatches,
          requiresNutritionConfirmation: true,
        }
      );

      setResults([foodItem]);

      if (nutritionMatches.length > 0) {
        setStatus(
          `SpaceByte identified ${bestPrediction.label}. Review the three nutrition matches and select the correct one.`
        );
      } else {
        setStatus(
          `SpaceByte identified ${bestPrediction.label}, but no nutrition matches were found. You can enter nutrition manually.`
        );
      }

    } catch (err) {
      console.error(
        "Food recognition error:",
        err
      );

      setError(
        err.message ||
        "Unable to analyze this photograph."
      );

    } finally {
      setProgress("");
      setBusy(false);
    }
  }

  // =======================================================
  //              SAVE SELECTED INVENTORY ITEMS
  // =======================================================

  async function addSelectedToInventory() {
    setError("");
    setStatus("");

    // Require a signed-in Firebase user.
    if (!user) {
      setError(
        "Please sign in before adding inventory."
      );
      return;
    }

    // Verify that selected items have names.
    const hasInvalidName = results.some(
      (item) =>
        item.checked &&
        (!item.name || !item.name.trim())
    );

    if (hasInvalidName) {
      setError(
        "Every selected food must have a name."
      );
      return;
    }

    // Only save checked items.
    const selectedItems = results.filter(
      (item) => item.checked
    );

    if (selectedItems.length === 0) {
      setError(
        "Please select at least one food item."
      );
      return;
    }

    // -----------------------------------------------------
    //           REQUIRE NUTRITION CONFIRMATION
    // -----------------------------------------------------

    // If nutrition matches exist, the astronaut must
    // select one before the food can be saved.

    const unconfirmedFood = selectedItems.find(
      (item) =>
        item.requiresNutritionConfirmation &&
        item.nutritionMatches?.length > 0 &&
        item.selectedNutritionIndex === -1
    );

    if (unconfirmedFood) {
      setError(
        `Please select a nutrition match for ${unconfirmedFood.name} before saving.`
      );
      return;
    }

    // If no database matches exist, manual entry is allowed.
    setSaving(true);

    let savedCount = 0;

    try {
      // Retrieve the authenticated Firebase ID token.
      const token = await user.getIdToken();

      // Save each selected item.
      for (const item of selectedItems) {

        // Create the payload expected by POST /inventory.
        const payload = {
          name: item.name.trim(),

          quantity: safeNumber(item.quantity) || 1,

          weight: item.weight || "",

          shelfLife:
            item.shelfLife === "" ||
            item.shelfLife === null
              ? null
              : safeNumber(item.shelfLife),

          expirationDate: item.expirationDate || null,

          type: ITEM_TYPES.includes(item.type)
            ? item.type
            : "Other",

          // Send nutrition values as numbers.
          calories: safeNumber(item.calories),
          protein: safeNumber(item.protein),
          carbs: safeNumber(item.carbs),
          fat: safeNumber(item.fat),

          lowStockThreshold: 10,
        };

        // Send the authenticated inventory request.
        const response = await apiRequest(
          "/inventory",
          token,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        // Verify that the backend confirmed the save.
        if (!response || !response.item) {
          throw new Error(
            `The server did not confirm saving ${item.name}.`
          );
        }

        savedCount += 1;
      }

      // Report successful saves.
      setStatus(
        `${savedCount} food item(s) added to your inventory.`
      );

      // Remove successfully saved checked results.
      setResults((currentResults) =>
        currentResults.filter((item) => !item.checked)
      );

    } catch (err) {
      console.error(
        "OCR inventory save error:",
        err
      );

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

  // =======================================================
  //                    CLEAR THE IMAGE
  // =======================================================

  function clearImage() {
    setSelectedFile(null);
    setPhotoUrl("");

    setResults([]);
    setRawText("");

    setError("");
    setStatus("");
    setProgress("");
  }

  // =======================================================
  //                         PAGE UI
  // =======================================================

  return (
    <section className="sb-nutrition-page">

      {/* ================================================
          PAGE HEADER
      ================================================ */}

      <header className="sb-nutrition-header">
        <div>
          <h1>OCR Food Capture</h1>

          <p>
            Scan food labels or identify foods from
            photographs to add them to your mission inventory.
          </p>
        </div>
      </header>

      {/* ================================================
          SCANNING MODE SELECTOR
      ================================================ */}

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
            disabled={busy || saving}
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
            disabled={busy || saving}
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

      {/* ================================================
          IMAGE UPLOAD
      ================================================ */}

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

      {/* ================================================
          ERROR MESSAGE
      ================================================ */}

      {error && (
        <p
          role="alert"
          className="sb-inventory-message sb-inventory-error"
        >
          {error}
        </p>
      )}

      {/* ================================================
          SUCCESS OR INFORMATION MESSAGE
      ================================================ */}

      {status && (
        <p
          role="status"
          className="sb-inventory-message sb-inventory-success"
        >
          {status}
        </p>
      )}

      {/* ================================================
          DETECTED FOOD RESULTS
      ================================================ */}

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

              {/* ========================================
                  SELECT OR DESELECT FOOD
              ======================================== */}

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

              {/* ========================================
                  FOOD NAME
              ======================================== */}

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

              {/* ========================================
                  QUANTITY
              ======================================== */}

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

              {/* ========================================
                  WEIGHT
              ======================================== */}

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

              {/* ========================================
                  SHELF LIFE
              ======================================== */}

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

              {/* ========================================
                  EXPIRATION DATE
              ======================================== */}

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

              {/* ========================================
                  FOOD CATEGORY
              ======================================== */}

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

              {/* ========================================
                  NUTRITION DATABASE MATCHES
              ======================================== */}

              {item.nutritionMatches?.length > 0 && (

                <div className="sb-nutrition-matches">

                  <h3>
                    Choose the correct nutrition match
                  </h3>

                  <p>
                    Select the food that most closely matches
                    the photographed item. Nutrition values
                    will be filled in automatically.
                  </p>

                  {/* Display up to three matches. */}

                  {item.nutritionMatches
                    .slice(0, 3)
                    .map((match, matchIndex) => (

                      <label
                        key={`${match.name}-${matchIndex}`}
                        style={{
                          display: "block",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          padding: "12px",
                          marginBottom: "10px",
                          cursor: "pointer",
                        }}
                      >

                        {/* Select this nutrition match. */}

                        <input
                          type="radio"
                          name={`nutrition-match-${index}`}
                          checked={
                            item.selectedNutritionIndex === matchIndex
                          }
                          onChange={() => {

                            // Current backend results use per100g.
                            const nutrition = match.per100g || {};

                            // Fill in the editable nutrition fields.
                            updateResult(index, {
                              name: match.name || item.name,

                              calories:
                                nutrition.calories ?? "",

                              protein:
                                nutrition.protein ?? "",

                              carbs:
                                nutrition.carbs ?? "",

                              fat:
                                nutrition.fat ?? "",

                              selectedNutritionIndex: matchIndex,
                            });
                          }}
                        />

                        {/* Food name and brand. */}

                        <strong>
                          {match.name}
                        </strong>

                        {match.brand && (
                          <span>
                            {" "}— {match.brand}
                          </span>
                        )}

                        {/* Nutrition values per 100 grams. */}

                        <div style={{ marginTop: "8px" }}>

                          <strong>
                            Nutrition per 100 g
                          </strong>

                          <p>
                            Calories:{" "}
                            {match.per100g?.calories ?? "N/A"} kcal
                          </p>

                          <p>
                            Protein:{" "}
                            {match.per100g?.protein ?? "N/A"} g
                          </p>

                          <p>
                            Carbohydrates:{" "}
                            {match.per100g?.carbs ?? "N/A"} g
                          </p>

                          <p>
                            Fat:{" "}
                            {match.per100g?.fat ?? "N/A"} g
                          </p>

                        </div>

                      </label>
                    ))}

                </div>
              )}

              {/* ========================================
                  NUTRITION CONFIRMATION WARNING
              ======================================== */}

              {item.requiresNutritionConfirmation &&
                item.nutritionMatches?.length > 0 &&
                item.selectedNutritionIndex === -1 && (

                  <p role="alert">
                    Please select the correct nutrition match
                    before saving this food.
                  </p>
                )}

              {/* ========================================
                  MANUAL NUTRITION INFORMATION
              ======================================== */}

              <h3>Nutrition information</h3>

              <p>
                Values below are editable. Database matches
                currently provide nutrition per 100 grams.
              </p>

              {/* CALORIES */}

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

              {/* PROTEIN */}

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

              {/* CARBOHYDRATES */}

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

              {/* FAT */}

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

              {/* ========================================
                  MODEL CONFIDENCE
              ======================================== */}

              {item.confidence !== null && (
                <p>
                  Model confidence:{" "}
                  {Math.round(item.confidence * 100)}%
                </p>
              )}

            </div>
          ))}

          {/* ============================================
              SAVE SELECTED FOODS
          ============================================ */}

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

      {/* ================================================
          ORIGINAL OCR TEXT
      ================================================ */}

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

      {/* ================================================
          EXPLANATION
      ================================================ */}

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
