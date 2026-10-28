

/*
===========================================================
 SPACEBYTE - INVENTORY PAGE
 File: frontend/src/components/Inventory.jsx

 FEATURES:
 1. Add inventory items manually.
 2. Store quantity, weight, shelf life, expiration date,
    and item type.
 3. Store nutrition values per serving.
 4. Load saved items from the backend.
 5. Preserve Firebase authentication and existing UI.
===========================================================
*/

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";
import "../spacebyte-ui.css";

const EMPTY_FORM = {
  name: "",
  quantity: "1",
  weight: "",
  shelfLife: "",
  expirationDate: "",
  type: "Perishable",

  // Nutrition values are entered per serving.
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
};

const ITEM_TYPES = [
  "Perishable",
  "Non-perishable",
  "Freeze-dried",
  "Dry goods",
  "Frozen",
  "Other",
];

const NUTRITION_FIELDS = [
  { name: "calories", label: "Calories (kcal)" },
  { name: "protein", label: "Protein (g)" },
  { name: "carbs", label: "Carbohydrates (g)" },
  { name: "fat", label: "Fat (g)" },
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString();
}

function statusClass(status) {
  return `sb-inventory-status sb-status-${String(
    status || "OK"
  ).toLowerCase()}`;
}

export default function Inventory({ user }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!user) {
        throw new Error("Please sign in to view your inventory.");
      }

      const token = await user.getIdToken();
      const result = await apiRequest("/inventory", token);

      if (!Array.isArray(result)) {
        throw new Error(
          "The backend returned an unexpected inventory response."
        );
      }

      setItems(result);
    } catch (err) {
      setError(err.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!user) {
      setError("Please sign in before adding an inventory item.");
      return;
    }

    if (!form.name.trim()) {
      setError("Enter an item name.");
      return;
    }

    if (
      form.quantity.trim() === "" ||
      !Number.isFinite(Number(form.quantity)) ||
      Number(form.quantity) < 0
    ) {
      setError("Enter a valid quantity of zero or greater.");
      return;
    }

    if (
      form.shelfLife !== "" &&
      (!Number.isFinite(Number(form.shelfLife)) ||
        Number(form.shelfLife) < 0)
    ) {
      setError("Shelf life must be zero or more days.");
      return;
    }

    // All four nutrition fields are required so the app
    // does not silently treat missing nutrition as zero.
    for (const field of NUTRITION_FIELDS) {
      const value = form[field.name];

      if (
        value.trim() === "" ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0
      ) {
        setError(
          `Enter a valid ${field.label.toLowerCase()} value of zero or greater.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      const token = await user.getIdToken();

      const payload = {
        name: form.name.trim(),
        quantity: Number(form.quantity),
        weight: form.weight.trim(),
        shelfLife:
          form.shelfLife === "" ? null : Number(form.shelfLife),
        expirationDate: form.expirationDate || null,
        type: form.type,

        // Nutrition values PER SERVING, sourced from the
        // product label or another reliable nutrition source.
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
      };

      await apiRequest("/inventory", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setForm({ ...EMPTY_FORM });
      setNotice("Inventory item added successfully.");

      await loadInventory();
    } catch (err) {
      setError(err.message || "Unable to add this inventory item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="sb-inventory-page">
      <header className="sb-inventory-header">
        <div>
          <p className="sb-inventory-eyebrow">CREW GALLEY</p>
          <h1>Food Inventory</h1>
          <p className="sb-inventory-subtitle">
            Track supplies, shelf life, expiration dates, and nutrition.
          </p>
        </div>

        <div className="sb-inventory-count">
          <span>Total items</span>
          <strong>{items.length}</strong>
        </div>
      </header>

      {error && (
        <div
          className="sb-inventory-message sb-inventory-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          className="sb-inventory-message sb-inventory-success"
          role="status"
        >
          {notice}
        </div>
      )}

      <section className="sb-inventory-card">
        <div className="sb-inventory-section-heading">
          <div>
            <h2>Add an inventory item</h2>
            <p>Enter the supply details below.</p>
          </div>
        </div>

        <form className="sb-inventory-form" onSubmit={handleSubmit}>
          <label className="sb-inventory-field">
            <span>Item name *</span>
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="e.g. Mac and cheese"
              maxLength={120}
              required
            />
          </label>

          <label className="sb-inventory-field">
            <span>Quantity *</span>
            <input
              name="quantity"
              type="number"
              min="0"
              step="any"
              value={form.quantity}
              onChange={updateField}
              required
            />
          </label>

          <label className="sb-inventory-field">
            <span>Weight of item</span>
            <input
              name="weight"
              value={form.weight}
              onChange={updateField}
              placeholder="e.g. 500 g, 2 lb, 12 oz"
            />
          </label>

          <label className="sb-inventory-field">
            <span>Shelf life (days)</span>
            <input
              name="shelfLife"
              type="number"
              min="0"
              step="1"
              value={form.shelfLife}
              onChange={updateField}
              placeholder="e.g. 180"
            />
          </label>

          <label className="sb-inventory-field">
            <span>Expiration date</span>
            <input
              name="expirationDate"
              type="date"
              value={form.expirationDate}
              onChange={updateField}
            />
          </label>

          <label className="sb-inventory-field">
            <span>Item type</span>
            <select
              name="type"
              value={form.type}
              onChange={updateField}
            >
              {ITEM_TYPES.map((itemType) => (
                <option key={itemType} value={itemType}>
                  {itemType}
                </option>
              ))}
            </select>
          </label>

          {/* Nutrition section */}
          <div className="sb-inventory-section-heading">
            <div>
              <h2>Nutrition per serving</h2>
              <p>
                Copy these values from the product nutrition label.
                Enter 0 only when the verified value is zero.
              </p>
            </div>
          </div>

          {NUTRITION_FIELDS.map((field) => (
            <label
              className="sb-inventory-field"
              key={field.name}
            >
              <span>{field.label} *</span>
              <input
                name={field.name}
                type="number"
                min="0"
                step="any"
                value={form[field.name]}
                onChange={updateField}
                placeholder="Enter label value"
                required
              />
            </label>
          ))}

          <div className="sb-inventory-form-actions">
            <button
              className="sb-inventory-submit"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving item..." : "+ Add item"}
            </button>
          </div>
        </form>
      </section>

      <section className="sb-inventory-card">
        <div className="sb-inventory-section-heading">
          <div>
            <h2>Inventory items</h2>
            <p>Review your current food supplies.</p>
          </div>

          <button
            className="sb-inventory-refresh"
            type="button"
            onClick={loadInventory}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="sb-inventory-empty">Loading inventory...</p>
        ) : items.length === 0 ? (
          <div className="sb-inventory-empty">
            <span aria-hidden="true">📦</span>
            <h3>No inventory items yet</h3>
            <p>Add your first item using the form above.</p>
          </div>
        ) : (
          <div className="sb-inventory-table-wrap">
            <table className="sb-inventory-table">
              <thead>
                <tr>
                  <th>Item name</th>
                  <th>Quantity</th>
                  <th>Weight</th>
                  <th>Shelf life</th>
                  <th>Expiration date</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="sb-inventory-item-name">
                      {item.name || "Unnamed item"}
                    </td>
                    <td>{item.quantity ?? "—"}</td>
                    <td>{item.weight || "—"}</td>
                    <td>
                      {item.shelfLife === null ||
                      item.shelfLife === undefined ||
                      item.shelfLife === ""
                        ? "—"
                        : `${item.shelfLife} days`}
                    </td>
                    <td>{formatDate(item.expirationDate)}</td>
                    <td>{item.type || "Other"}</td>
                    <td>
                      <span className={statusClass(item.status)}>
                        {item.status || "OK"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
