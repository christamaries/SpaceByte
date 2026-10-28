
/*
===========================================================
 SPACEBYTE - INVENTORY PAGE
 File: frontend/src/components/Inventory.jsx

 FEATURES:
 1. Add inventory items manually.
 2. Store quantity, weight, shelf life, expiration date,
    and item type.
 3. Load saved items from the backend.
 4. Display status and handle loading/errors.
 5. Use the existing Firebase authentication and API helper.
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
};

const ITEM_TYPES = [
  "Perishable",
  "Non-perishable",
  "Freeze-dried",
  "Dry goods",
  "Frozen",
  "Other",
];

function formatDate(value) {
  if (!value) return "—";

  // The backend stores expiration dates as YYYY-MM-DD.
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

      // The current backend GET /inventory returns an array.
      if (!Array.isArray(result)) {
        throw new Error("The backend returned an unexpected inventory response.");
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

    if (form.quantity === "" || Number(form.quantity) < 0) {
      setError("Quantity must be zero or greater.");
      return;
    }

    if (!Number.isFinite(Number(form.quantity))) {
      setError("Enter a valid quantity.");
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
      };

      await apiRequest("/inventory", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setForm(EMPTY_FORM);
      setNotice("Inventory item added successfully.");

      // Reload the data returned by the backend.
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
            Track supplies, shelf life, and expiration dates.
          </p>
        </div>

        <div className="sb-inventory-count">
          <span>Total items</span>
          <strong>{items.length}</strong>
        </div>
      </header>

      {error && (
        <div className="sb-inventory-message sb-inventory-error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="sb-inventory-message sb-inventory-success" role="status">
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
              placeholder="e.g. Freeze-dried strawberries"
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
