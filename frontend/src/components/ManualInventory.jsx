import { useState } from "react";
import { PackagePlus, Package, Scale, AlertTriangle, Trash2 } from "lucide-react";

// Shared dashboard styles (all classes prefixed sb-).
import "../spacebyte-ui.css";

const initialForm = {
  name: "",
  quantity: "",
  weight: "",
  weightUnit: "g",
  shelfLife: "",
  shelfLifeUnit: "months",
  expirationDate: "",
  type: "",
};

const ITEM_TYPES = [
  "Perishable",
  "Non-Perishable",
  "Freeze-Dried",
  "Dry Goods",
  "Dehydrated",
  "Thermostabilized",
  "Other",
];

// Calculate how many days remain before an item expires.
function getExpirationStatus(expirationDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiration = new Date(`${expirationDate}T00:00:00`);

  const daysRemaining = Math.ceil(
    (expiration - today) / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0) {
    return { label: "Expired", className: "sb-status-expired" };
  }

  if (daysRemaining <= 30) {
    return { label: "Expiring Soon", className: "sb-status-low" };
  }

  return { label: "Fresh", className: "sb-status-ok" };
}
export default function ManualInventory() {
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");


  // Search and filter controls
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortOrder, setSortOrder] = useState("soonest");

  // Filter and sort inventory items
  const filteredItems = items
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) =>
      filterType === "All" || item.type === filterType
  )
    .sort((a, b) => {
      if (sortOrder === "soonest") {
        return new Date(a.expirationDate) - new Date(b.expirationDate);
      }

      if (sortOrder === "latest") {
        return new Date(b.expirationDate) - new Date(a.expirationDate);
      }

      if (sortOrder === "name") {
        return a.name.localeCompare(b.name);
      }

      return 0;
    });

// Total number of packages in the inventory.
const totalPackages = items.reduce(
  (total, item) => total + item.quantity,
  0
);

// Total weight in kilograms.
// Convert grams to kilograms when necessary.
const totalWeightKg = items.reduce((total, item) => {
  const weightKg =
    item.weightUnit === "g"
      ? item.weight / 1000
      : item.weight;

  return total + weightKg * item.quantity;
}, 0);

// Count inventory entries expiring within 30 days.
const expiringSoonCount = items.filter(
  (item) =>
    getExpirationStatus(item.expirationDate).label === "Expiring Soon"
).length;
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.quantity ||
      !form.weight ||
      !form.shelfLife ||
      !form.expirationDate ||
      !form.type
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (
      Number(form.quantity) < 1 ||
      !Number.isInteger(Number(form.quantity)) ||
      Number(form.weight) <= 0 ||
      Number(form.shelfLife) <= 0
    ) {
      setError("Please enter valid positive quantities, weights, and shelf life.");
      return;
    }

    const newItem = {
      ...form,
      id: crypto.randomUUID(),
      name: form.name.trim(),
      quantity: Number(form.quantity),
      weight: Number(form.weight),
      shelfLife: Number(form.shelfLife),
    };

    setItems((previous) => [...previous, newItem]);
    setForm({ ...initialForm });
  }

  function removeItem(id) {
    setItems((previous) =>
      previous.filter((item) => item.id !== id)
    );
  }

  return (
    <div className="sb-stage">
      <div className="sb-window">
        <main className="sb-content">
          <div className="sb-inventory-page">
            {import.meta.env.DEV && (
              <a href="/" className="sb-inventory-refresh sb-inventory-back">
                ← Back to SpaceByte Home
              </a>
            )}

            {/* PAGE HEADER */}
            <header className="sb-inventory-header">
              <div>
                <p className="sb-inventory-eyebrow">
                  SPACEBYTE • MISSION SUPPLIES
                </p>
                <h1>Manual Inventory Entry</h1>
                <p className="sb-inventory-subtitle">
                  Register food and supplies for your mission.
                  Keep track of quantities, storage types, and expiration dates.
                </p>
              </div>

              <div className="sb-inventory-count">
                <span>Items</span>
                <strong>{items.length}</strong>
              </div>
            </header>

            {/* INVENTORY OVERVIEW */}
            <div className="sb-stats sb-stats-three">
              <div className="sb-stat">
                <span className="sb-stat-icon mint" aria-hidden="true">
                  <Package />
                </span>
                <div>
                  <small>TOTAL PACKAGES</small>
                  <strong>{totalPackages}</strong>
                </div>
              </div>

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
            </div>

            {/* ADD ITEM FORM */}
            <section className="sb-inventory-card">
              <div className="sb-inventory-section-heading">
                <div>
                  <h2>Add New Item</h2>
                  <p>Every field is required.</p>
                </div>
                <PackagePlus color="#b7a0ff" size={24} aria-hidden="true" />
              </div>

              {error && (
                <p role="alert" className="sb-inventory-message sb-inventory-error">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="sb-inventory-form">
                <label className="sb-inventory-field">
                  <span>Item Name</span>
                  <input
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Freeze-Dried Strawberries"
                    value={form.name}
                    onChange={handleChange}
                  />
                </label>

                <label className="sb-inventory-field">
                  <span>Quantity</span>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="Number of packages"
                    value={form.quantity}
                    onChange={handleChange}
                  />
                </label>

                <div className="sb-inventory-field">
                  <span>Weight per Item</span>
                  <div className="sb-inventory-pair">
                    <input
                      name="weight"
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      placeholder="250"
                      aria-label="Weight per item"
                      value={form.weight}
                      onChange={handleChange}
                    />
                    <select
                      name="weightUnit"
                      aria-label="Weight unit"
                      value={form.weightUnit}
                      onChange={handleChange}
                    >
                      <option value="g">Grams</option>
                      <option value="kg">Kilograms</option>
                    </select>
                  </div>
                </div>

                <div className="sb-inventory-field">
                  <span>Shelf Life</span>
                  <div className="sb-inventory-pair">
                    <input
                      name="shelfLife"
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="18"
                      aria-label="Shelf life"
                      value={form.shelfLife}
                      onChange={handleChange}
                    />
                    <select
                      name="shelfLifeUnit"
                      aria-label="Shelf life unit"
                      value={form.shelfLifeUnit}
                      onChange={handleChange}
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>

                <label className="sb-inventory-field">
                  <span>Expiration Date</span>
                  <input
                    name="expirationDate"
                    type="date"
                    required
                    value={form.expirationDate}
                    onChange={handleChange}
                  />
                </label>

                <label className="sb-inventory-field">
                  <span>Item Type</span>
                  <select
                    name="type"
                    required
                    value={form.type}
                    onChange={handleChange}
                  >
                    <option value="">Select item type</option>
                    {ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <div className="sb-inventory-form-actions">
                  <button type="submit" className="sb-inventory-submit">
                    Add to Inventory
                  </button>
                </div>
              </form>
            </section>

            {/* SAVED ITEMS */}
            <section className="sb-inventory-card">
              <div className="sb-inventory-section-heading">
                <div>
                  <h2>Inventory</h2>
                  <p>Search, filter, and sort the items you have added.</p>
                </div>
              </div>

              <div className="sb-inventory-form sb-inventory-filters">
                <label className="sb-inventory-field">
                  <span>Search</span>
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>

                <label className="sb-inventory-field">
                  <span>Type</span>
                  <select
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                  >
                    <option value="All">All Types</option>
                    {ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="sb-inventory-field">
                  <span>Sort</span>
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                  >
                    <option value="soonest">Expiration: Soonest First</option>
                    <option value="latest">Expiration: Latest First</option>
                    <option value="name">Name: A–Z</option>
                  </select>
                </label>
              </div>

              {filteredItems.length === 0 ? (
                <div className="sb-inventory-empty">
                  <span aria-hidden="true">📦</span>
                  <h3>
                    {items.length === 0
                      ? "No inventory items added yet."
                      : "No items match your search or filters."}
                  </h3>
                  <p>Add your first item using the form above.</p>
                </div>
              ) : (
                <div className="sb-inventory-table-wrap">
                  <table className="sb-inventory-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Weight</th>
                        <th>Shelf Life</th>
                        <th>Expires</th>
                        <th>Status</th>
                        <th aria-label="Remove" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => {
                        const status = getExpirationStatus(item.expirationDate);

                        return (
                          <tr key={item.id}>
                            <td className="sb-inventory-item-name">{item.name}</td>
                            <td>{item.type}</td>
                            <td>{item.quantity}</td>
                            <td>{item.weight} {item.weightUnit}</td>
                            <td>{item.shelfLife} {item.shelfLifeUnit}</td>
                            <td>{item.expirationDate}</td>
                            <td>
                              <span className={`sb-inventory-status ${status.className}`}>
                                {status.label}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                aria-label={`Remove ${item.name}`}
                                className="sb-inventory-remove"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
