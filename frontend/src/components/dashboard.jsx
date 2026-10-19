// Dashboard.jsx
// Crew Galley screen. Reads GET /dashboard.
//
// /dashboard returns:
//   { inventory: [{id, name, quantity, calories, expirationDate, status, ...}],
//     alerts: { lowStock, expiringSoon, expired },
//     nutrition: { calories, protein, carbs, fat, calorieTarget, caloriesRemaining } }

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";
import { CREW, TARGETS, foodIcon } from "../spacebyteConfig";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const ms = new Date(dateString).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// Badge text + color for one inventory item.
function badgeFor(item) {
  if (item.status === "EXPIRED") return { text: "Expired", cls: "pink" };
  if (item.status === "EXPIRING") {
    const d = daysUntil(item.expirationDate);
    return { text: d === null ? "Soon" : `${d} day${d === 1 ? "" : "s"}`, cls: "pink" };
  }
  if (item.status === "LOW") return { text: "Low", cls: "yellow" };
  return { text: "OK", cls: "green" };
}

export default function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const load = useCallback(async () => {
    try {
      const token = await user.getIdToken();
      const result = await apiRequest("/dashboard", token);
      setData(result);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="sb-error">Couldn't load dashboard: {error}</p>;
  if (!data) return <p className="sb-muted">Loading galley…</p>;

  const { inventory, alerts, nutrition } = data;

  // Days of food on board = total stored kcal / what the whole crew eats per day.
  const totalKcal = inventory.reduce(
    (sum, f) => sum + (Number(f.calories) || 0) * (Number(f.quantity) || 0),
    0
  );
  const daysOnBoard = Math.round(totalKcal / (TARGETS.calories * CREW.size));

  const expiringCount = alerts.expiringSoon.length + alerts.expired.length;

  const calTarget = nutrition.calorieTarget || TARGETS.calories;
  const pct = Math.min(100, Math.round((nutrition.calories / calTarget) * 100));

  // Donut geometry
  const R = 52;
  const C = 2 * Math.PI * R;

  const visible = showAll ? inventory : inventory.slice(0, 4);

  const bars = [
    { label: "Protein", value: nutrition.protein, target: TARGETS.protein, color: "#6c63ff" },
    { label: "Carbs", value: nutrition.carbs, target: TARGETS.carbs, color: "#f9d56e" },
    { label: "Fat", value: nutrition.fat, target: TARGETS.fat, color: "#ee5fa7" },
  ];

  const firstName = (user.displayName || "Commander").split(" ")[0];

  return (
    <>
      <header className="sb-header">
        <div>
          <h2>
            {greeting()}, {firstName}
          </h2>
          <p className="sb-muted">
            Mission day {CREW.missionDay} · Crew of {CREW.size}
          </p>
        </div>
        <div className="sb-avatars">
          {CREW.members.map((m) => (
            <span key={m.initials} className="sb-avatar" style={{ background: m.color }}>
              {m.initials}
            </span>
          ))}
        </div>
      </header>

      <div className="sb-stats">
        <div className="sb-stat">
          <span className="sb-stat-icon" style={{ background: "#5ad1b0" }}>📅</span>
          <div>
            <small>FOOD ON BOARD</small>
            <strong>
              {daysOnBoard} <em>days</em>
            </strong>
          </div>
        </div>
        <div className="sb-stat">
          <span className="sb-stat-icon" style={{ background: "#8fd0f7" }}>🔥</span>
          <div>
            <small>KCAL TODAY</small>
            <strong>
              {Math.round(nutrition.calories).toLocaleString()}{" "}
              <em>/ {calTarget.toLocaleString()}</em>
            </strong>
          </div>
        </div>
        <div className="sb-stat">
          <span className="sb-stat-icon" style={{ background: "#ee5fa7" }}>🔔</span>
          <div>
            <small>EXPIRING ≤ 7 DAYS</small>
            <strong>
              {expiringCount} <em>items</em>
            </strong>
          </div>
        </div>
      </div>

      <div className="sb-panels">
        <section className="sb-panel">
          <div className="sb-panel-head">
            <h3>Galley inventory</h3>
            <button className="sb-link" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Show less" : "View all"}
            </button>
          </div>
          <ul className="sb-inventory">
            {visible.map((item) => {
              const badge = badgeFor(item);
              return (
                <li key={item.id}>
                  <span className="sb-food-icon">{foodIcon(item.name)}</span>
                  <span className="sb-food-name">{item.name}</span>
                  <span className="sb-food-qty">{item.quantity}</span>
                  <span className={`sb-badge ${badge.cls}`}>{badge.text}</span>
                </li>
              );
            })}
            {inventory.length === 0 && <li className="sb-muted">No food in inventory yet.</li>}
          </ul>
        </section>

        <section className="sb-panel">
          <h3>Today's nutrition</h3>
          <div className="sb-nutrition">
            <svg viewBox="0 0 140 140" className="sb-donut" role="img" aria-label={`${pct}% of calorie target`}>
              <circle cx="70" cy="70" r={R} fill="none" stroke="#2a2f55" strokeWidth="14" />
              <circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke="#5ad1b0"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * C} ${C}`}
                transform="rotate(-90 70 70)"
              />
              <text x="70" y="70" textAnchor="middle" className="sb-donut-big">{pct}%</text>
              <text x="70" y="88" textAnchor="middle" className="sb-donut-small">of target</text>
            </svg>
            <div className="sb-bars">
              {bars.map((b) => (
                <div key={b.label}>
                  <span>{b.label}</span>
                  <div className="sb-bar">
                    <i style={{ width: `${Math.min(100, (b.value / b.target) * 100)}%`, background: b.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
