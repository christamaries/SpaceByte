// OcrCapture.jsx
//
// First version of the OCR Capture page.
// Shows the chosen photo and SAMPLE food results.
// Real food detection is not connected yet, and nothing is saved.

import { useState } from "react";

// Placeholder results until food detection is connected.
const SAMPLE_RESULTS = [
  { name: "Apple", quantity: 1 },
  { name: "Mac and cheese", quantity: 1 },
  { name: "Shrimp cocktail", quantity: 1 },
];

export default function OcrCapture() {
  const [photoUrl, setPhotoUrl] = useState("");
  const [results, setResults] = useState([]);

  // Show the chosen photo as a preview.
  function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Free the previous preview image, if there was one.
    if (photoUrl) URL.revokeObjectURL(photoUrl);

    setPhotoUrl(URL.createObjectURL(file));
    setResults([]);
  }

  // For now, show the sample results.
  function findFoods() {
    setResults(
      SAMPLE_RESULTS.map((item) => ({ ...item, checked: true }))
    );
  }

  // Change one row (checkbox or quantity).
  function updateItem(index, changes) {
    setResults((previous) =>
      previous.map((item, i) =>
        i === index ? { ...item, ...changes } : item
      )
    );
  }

  return (
    <section>
      <h2>OCR Capture</h2>

      <p className="sb-muted">
        Take or choose a photo of your food. The results below are
        sample data for now, and nothing is saved.
      </p>

      <p style={{ marginTop: 18 }}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
        />
      </p>

      {photoUrl && (
        <>
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

          <button type="button" onClick={findFoods}>
            Find foods
          </button>
        </>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Found in photo</h3>

          {results.map((item, index) => (
            <div
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
              <label>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(event) =>
                    updateItem(index, {
                      checked: event.target.checked,
                    })
                  }
                />{" "}
                {item.name}
              </label>

              <input
                type="number"
                min="0"
                value={item.quantity}
                aria-label={`Quantity of ${item.name}`}
                onChange={(event) =>
                  updateItem(index, {
                    quantity: Number(event.target.value),
                  })
                }
                style={{ width: 70 }}
              />
            </div>
          ))}

          <button type="button" disabled style={{ marginTop: 16 }}>
            Add to inventory (coming next)
          </button>
        </div>
      )}
    </section>
  );
}
