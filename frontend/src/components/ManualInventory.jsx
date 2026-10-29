import { useState } from "react";
import { PackagePlus, Package, Trash2 } from "lucide-react";

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

const inputStyle =
  "w-full rounded-lg border border-slate-700 bg-slate-900 " +
  "px-4 py-3 text-white placeholder:text-slate-500 " +
  "focus:border-blue-500 focus:outline-none";
// Calculate how many days remain before an item expires.
function getExpirationStatus(expirationDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiration = new Date(`${expirationDate}T00:00:00`);

  const daysRemaining = Math.ceil(
    (expiration - today) / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0) {
    return {
      label: "Expired",
      color: "text-red-400",
      background: "bg-red-500/10",
    };
  }

  if (daysRemaining <= 30) {
    return {
      label: "Expiring Soon",
      color: "text-yellow-400",
      background: "bg-yellow-500/10",
    };
  }

  return {
    label: "Fresh",
    color: "text-green-400",
    background: "bg-green-500/10",
  };
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
    <main className="min-h-screen bg-[#070b1c] px-5 py-12 text-white">
      <div className="mx-auto max-w-6xl">
  {import.meta.env.DEV && (
  <a
    href="/"
    className="mb-8 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-cyan-400 transition-colors hover:bg-slate-800"
  >
    ← Back to SpaceByte Home
  </a>
)}
        {/* PAGE HEADER */}
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            SpaceByte • Mission Supplies
          </p>

          <h1 className="text-4xl font-bold">
            Manual Inventory Entry
          </h1>

          <p className="mt-3 text-slate-400">
            Register food and supplies for your mission.
            Keep track of quantities, storage types, and expiration dates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* LEFT SIDE: FORM */}
          <section className="rounded-2xl border border-slate-700 bg-[#0b1424] p-6 shadow-xl">

            <div className="mb-6 flex items-center gap-3">
              <PackagePlus className="text-cyan-400" size={28} />

              <h2 className="text-2xl font-semibold">
                Add New Item
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ITEM NAME */}
              <div>
                <label htmlFor="item-name" className="mb-2 block text-sm">
                  Item Name
                </label>

                <input
                  id="item-name"
                  name="name"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Freeze-Dried Strawberries"
                  value={form.name}
                  onChange={handleChange}
                  className={inputStyle}
                />
              </div>

              {/* QUANTITY */}
              <div>
                <label htmlFor="quantity" className="mb-2 block text-sm">
                  Quantity
                </label>

                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="Number of packages"
                  value={form.quantity}
                  onChange={handleChange}
                  className={inputStyle}
                />
              </div>

              {/* WEIGHT */}
              <div>
                <label htmlFor="weight" className="mb-2 block text-sm">
                  Weight per Item
                </label>

                <div className="grid grid-cols-[1fr_110px] gap-3">
                  <input
                    id="weight"
                    name="weight"
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="250"
                    value={form.weight}
                    onChange={handleChange}
                    className={inputStyle}
                  />

                  <select
                    name="weightUnit"
                    aria-label="Weight unit"
                    value={form.weightUnit}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    <option value="g">Grams</option>
                    <option value="kg">Kilograms</option>
                  </select>
                </div>
              </div>

              {/* SHELF LIFE */}
              <div>
                <label htmlFor="shelf-life" className="mb-2 block text-sm">
                  Shelf Life
                </label>

                <div className="grid grid-cols-[1fr_130px] gap-3">
                  <input
                    id="shelf-life"
                    name="shelfLife"
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="18"
                    value={form.shelfLife}
                    onChange={handleChange}
                    className={inputStyle}
                  />

                  <select
                    name="shelfLifeUnit"
                    aria-label="Shelf life unit"
                    value={form.shelfLifeUnit}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              {/* EXPIRATION DATE */}
              <div>
                <label htmlFor="expiration-date" className="mb-2 block text-sm">
                  Expiration Date
                </label>

                <input
                  id="expiration-date"
                  name="expirationDate"
                  type="date"
                  required
                  value={form.expirationDate}
                  onChange={handleChange}
                  className={`${inputStyle} scheme-dark`}
                />
              </div>

              {/* ITEM TYPE */}
              <div>
                <label htmlFor="item-type" className="mb-2 block text-sm">
                  Item Type
                </label>

                <select
                  id="item-type"
                  name="type"
                  required
                  value={form.type}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="">Select item type</option>
                  <option value="Perishable">Perishable</option>
                  <option value="Non-Perishable">Non-Perishable</option>
                  <option value="Freeze-Dried">Freeze-Dried</option>
                  <option value="Dry Goods">Dry Goods</option>
                  <option value="Dehydrated">Dehydrated</option>
                  <option value="Thermostabilized">Thermostabilized</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <PackagePlus size={20} />
                Add to Inventory
              </button>

            </form>
          </section>

          {/* RIGHT SIDE: INVENTORY OVERVIEW */}
          <section className="rounded-2xl border border-slate-700 bg-[#0b1424] p-6 shadow-xl">

            <div className="mb-6 flex items-center gap-3">
              <Package className="text-cyan-400" size={28} />

              <h2 className="text-2xl font-semibold">
                Inventory Overview
              </h2>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

  {/* TOTAL PACKAGES */}
  <div className="rounded-xl bg-slate-900 p-4">
    <p className="text-xs text-slate-400">
      📦 Total Packages
    </p>

    <p className="mt-2 text-2xl font-bold text-cyan-400">
      {totalPackages}
    </p>
  </div>

  {/* TOTAL WEIGHT */}
  <div className="rounded-xl bg-slate-900 p-4">
    <p className="text-xs text-slate-400">
      ⚖️ Total Weight
    </p>

    <p className="mt-2 text-2xl font-bold text-cyan-400">
      {totalWeightKg.toFixed(2)} kg
    </p>
  </div>

  {/* EXPIRING SOON */}
  <div className="rounded-xl bg-slate-900 p-4">
    <p className="text-xs text-slate-400">
      ⚠️ Expiring Soon
    </p>

    <p className="mt-2 text-2xl font-bold text-yellow-400">
      {expiringSoonCount}
    </p>
  </div>

</div>

{/* SEARCH AND FILTER CONTROLS */}
<div className="mb-6 space-y-3">

  <input
    type="text"
    placeholder="🔍 Search inventory..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
    className={inputStyle}
  />

  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

    <select
      value={filterType}
      onChange={(event) => setFilterType(event.target.value)}
      className={inputStyle}
      aria-label="Filter inventory by type"
    >
      <option value="All">All Types</option>
      <option value="Perishable">Perishable</option>
      <option value="Non-Perishable">Non-Perishable</option>
      <option value="Freeze-Dried">Freeze-Dried</option>
      <option value="Dry Goods">Dry Goods</option>
      <option value="Dehydrated">Dehydrated</option>
      <option value="Thermostabilized">Thermostabilized</option>
      <option value="Other">Other</option>
    </select>

    <select
      value={sortOrder}
      onChange={(event) => setSortOrder(event.target.value)}
      className={inputStyle}
      aria-label="Sort inventory"
    >
      <option value="soonest">Expiration: Soonest First</option>
      <option value="latest">Expiration: Latest First</option>
      <option value="name">Name: A–Z</option>
    </select>

  </div>
</div>



            {filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
                <Package
                  size={42}
                  className="mx-auto mb-4 text-slate-500"
                />

              <p className="text-slate-300">
  {items.length === 0
    ? "No inventory items added yet."
    : "No items match your search or filters."}
</p>

                <p className="mt-2 text-sm text-slate-500">
                  Add your first item using the form.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-700 bg-slate-900 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-sm text-cyan-400">
                          {item.type}
                        </p>
                      <span
  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
    getExpirationStatus(item.expirationDate).color
  } ${getExpirationStatus(item.expirationDate).background}`}
>
  {getExpirationStatus(item.expirationDate).label}
</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <p>Quantity: {item.quantity}</p>
                      <p>Weight: {item.weight} {item.weightUnit}</p>
                      <p>
                        Shelf Life: {item.shelfLife} {item.shelfLifeUnit}
                      </p>
                      <p>Expires: {item.expirationDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </section>
        </div>
      </div>
    </main>
  );
}

