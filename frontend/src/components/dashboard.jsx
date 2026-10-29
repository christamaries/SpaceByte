
/*
===========================================================
 SPACEBYTE - CREW DASHBOARD
 File: frontend/src/components/dashboard.jsx

 Reads GET /dashboard using the existing Firebase token helper.
 Uses real API data for inventory, alerts and nutrition.
===========================================================
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api";
import { CREW, TARGETS, foodIcon } from "../spacebyteConfig";

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function daysUntil(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

function statusFor(item) {
  const days = item.daysToExpiry ?? daysUntil(item.expirationDate);

  if (item.status === "EXPIRED") {
    return { text: "Expired", className: "pink" };
  }

  if (item.status === "EXPIRING" || (days !== null && days >= 0 && days <= 7)) {
    return {
      text: days === null ? "Expiring" : `${days} day${days === 1 ? "" : "s"}`,
      className: "pink",
    };
  }

  if (item.status === "LOW") {
    return { text: "Low", className: "yellow" };
  }

  return { text: "OK", className: "green" };
}

function ProgressBar({ label, value, target, color }) {
  const amount = safeNumber(value);
  const goal = safeNumber(target);
  const percent = goal > 0 ? Math.round((amount / goal) * 100) : 0;

  return (
    <div className="sb-nutrient-row">
      <div className="sb-nutrient-label">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div
        className="sb-bar"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, percent)}
      >
        <i
          style={{
            width: `${Math.max(0, Math.min(100, percent))}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export default function Dashboard({ user, activeScreen = "overview", onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    if (!user) {
      setError("Please sign in to view your dashboard.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const result = await apiRequest("/dashboard", token);

      if (!result || !Array.isArray(result.inventory)) {
        throw new Error("The dashboard API returned an unexpected response.");
      }

      setData(result);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const inventory = data?.inventory ?? [];
  const alerts = data?.alerts ?? {};
  const nutrition = data?.nutrition ?? {};
  const stats = data?.stats ?? {};
  const mission = data?.mission ?? {};

  const expiringItems = alerts.expiringSoon ?? [];
  const expiredItems = alerts.expired ?? [];
  const lowStockItems = alerts.lowStock ?? [];

  const totalKcal = useMemo(() => {
    return inventory
      .filter((item) => item.status !== "EXPIRED")
      .reduce((total, item) => {
        const quantity = safeNumber(item.quantity ?? item.qty);
        const calories = safeNumber(
          item.caloriesPerUnit ?? item.kcalPerUnit ?? item.calories
        );

        return total + quantity * calories;
      }, 0);
  }, [inventory]);

  const foodDays =
    stats.foodDays ??
    Math.floor(
      totalKcal /
        Math.max(
          1,
          safeNumber(stats.kcalTarget) ||
            safeNumber(TARGETS.calories) * safeNumber(CREW.size)
        )
    );

  const calories = safeNumber(nutrition.calories ?? stats.kcalToday);
  const calorieTarget =
    safeNumber(
      nutrition.crewCalorieTarget ??
        nutrition.calorieTarget ??
        stats.kcalTarget
    ) ||
    safeNumber(TARGETS.calories) * safeNumber(CREW.size);

  const caloriePercent =
    calorieTarget > 0
      ? Math.min(100, Math.round((calories / calorieTarget) * 100))
      : 0;

  const waterPercent = safeNumber(
    stats.waterPercent ??
      nutrition.nutrients?.find((item) => item.key === "water")?.percent
  );

  const expiringCount =
    stats.expiringCount ?? expiringItems.length + expiredItems.length;

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return inventory;

    return inventory.filter((item) =>
      [item.name, item.category, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [inventory, search]);

  const visibleInventory = showAll
    ? filteredInventory
    : filteredInventory.slice(0, 6);

  const firstName = (user?.displayName || "Commander").split(" ")[0];

  const nutrients = [
    {
      label: "Protein",
      value: nutrition.protein,
      target: TARGETS.protein,
      color: "#7868ff",
    },
    {
      label: "Carbs",
      value: nutrition.carbs,
      target: TARGETS.carbs,
      color: "#ffd166",
    },
    {
      label: "Vitamin D",
      value: nutrition.vitaminD,
      target: TARGETS.vitaminD,
      color: "#f66ca8",
    },
    {
      label: "Water",
      value: nutrition.water,
      target: TARGETS.water,
      color: "#83cfff",
    },
  ];

  const focusSection =
    activeScreen === "inventory"
      ? "inventory"
      : activeScreen === "nutrition"
        ? "nutrition"
        : null;

  useEffect(() => {
    if (focusSection) {
      document.getElementById(`sb-${focusSection}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [focusSection, loading]);

  if (loading && !data) {
    return <p className="sb-muted">Loading your crew dashboard…</p>;
  }

  if (error && !data) {
    return (
      <section className="sb-error-panel">
        <h2>Unable to load your dashboard</h2>
        <p>{error}</p>
        <button type="button" className="sb-primary-button" onClick={load}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <div className="sb-dashboard">
      <header className="sb-header">
        <div>
          <p className="sb-eyebrow">MISSION CONTROL</p>
          <h1>{greeting()}, {firstName}</h1>
          <p className="sb-muted">
            Mission day {mission.day ?? CREW.missionDay} · Crew of{" "}
            {mission.crewSize ?? CREW.size} · {mission.location ?? "ISS"}
          </p>
        </div>

        <div className="sb-header-actions">
          <label className="sb-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search food, meals, crew"
              aria-label="Search inventory"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setShowAll(true);
              }}
            />
          </label>
          <button
            className="sb-notification"
            type="button"
            aria-label={`${expiringCount} expiring items`}
            title={`${expiringCount} items expiring soon`}
            onClick={() => {
              setSearch("");
              setShowAll(true);
              onNavigate?.("inventory");
            }}
          >
            ♧
            {expiringCount > 0 && <span className="sb-notification-dot" />}
          </button>
          <div className="sb-avatars" aria-label="Crew members">
            {(CREW.members ?? []).map((member) => (
              <span
                key={member.initials}
                className="sb-avatar"
                style={{ background: member.color }}
                title={member.name ?? member.initials}
              >
                {member.initials}
              </span>
            ))}
          </div>
        </div>
      </header>

      {error && (
        <p className="sb-inline-warning">
          Refresh failed. Showing the last successfully loaded data. {error}
        </p>
      )}

      

      {/* =====================================================
          DASHBOARD STAT CARDS
          Food on Board: calendar icon
          Kcal Today: fire icon
          Water Today: water droplet icon
          Expiring <= 7 Days: notification bell icon

          IMPORTANT:
          - Uses variables already calculated above.
          - Does not change Firebase authentication or API calls.
          - Keeps the existing sb-stats and sb-stat CSS classes.
      ===================================================== */}

      <div className="sb-stats">

        {/* 1. FOOD ON BOARD — Calendar icon */}
        <div className="sb-stat">
          <span
            className="sb-stat-icon mint"
            role="img"
            aria-label="Calendar"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
          </span>

          <div>
            <small>FOOD ON BOARD</small>
            <strong>
              {foodDays} <em>days</em>
            </strong>
          </div>
        </div>

        {/* 2. KCAL TODAY — Fire icon */}
        <div className="sb-stat">
          <span
            className="sb-stat-icon blue"
            role="img"
            aria-label="Fire"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-9-.5 3-2 4-3 5-1-3-3-5-3-5s1 5-2 8a7 7 0 0 0 5 8Z" />
              <path d="M12 22a3 3 0 0 0 3-3c0-2-2-3-3-5-1 2-3 3-3 5a3 3 0 0 0 3 3Z" />
            </svg>
          </span>

          <div>
            <small>KCAL TODAY</small>
            <strong>
              {Math.round(calories).toLocaleString()}
              <em>/ {Math.round(calorieTarget).toLocaleString()}</em>
            </strong>
            <div
              className="sb-stat-track"
              role="progressbar"
              aria-label="Daily calorie target"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={caloriePercent}
            >
              <i style={{ width: `${caloriePercent}%` }} />
            </div>
          </div>
        </div>

        {/* 3. WATER TODAY — Water droplet icon */}
        <div className="sb-stat">
          <span
            className="sb-stat-icon yellow"
            role="img"
            aria-label="Water droplet"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12Z" />
              <path d="M9 16a3 3 0 0 0 3 3" />
            </svg>
          </span>

          <div>
            <small>WATER TODAY</small>
            <strong>
              {Math.round(waterPercent)}
              <em>% of target</em>
            </strong>
            <div
              className="sb-stat-track"
              role="progressbar"
              aria-label="Daily water target"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.max(
                0,
                Math.min(100, Math.round(waterPercent))
              )}
            >
              <i
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, waterPercent)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 4. EXPIRING WITHIN 7 DAYS — Bell icon */}
        <div className="sb-stat">
          <span
            className="sb-stat-icon pink"
            role="img"
            aria-label="Notification bell"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </span>

          <div>
            <small>EXPIRING ≤ 7 DAYS</small>
            <strong>
              {expiringCount} <em>items</em>
            </strong>
            <button
              type="button"
              className="sb-link"
              onClick={() => {
                setSearch("");
                setShowAll(true);
                onNavigate?.("inventory");
              }}
            >
              View inventory alerts
            </button>
          </div>
        </div>
      </div>

      <div className="sb-panels sb-main-panels">
        <section className="sb-panel" id="sb-inventory">
          <div className="sb-panel-head">
            <h2>Galley inventory</h2>
            <button
              type="button"
              className="sb-link"
              onClick={() => {
                setShowAll((current) => !current);
                onNavigate?.("inventory");
              }}
            >
              {showAll ? "Show less" : "View all"}
            </button>
          </div>

          <div className="sb-table-scroll">
            <table className="sb-inventory-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th className="sb-align-right">Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleInventory.map((item) => {
                  const badge = statusFor(item);

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="sb-food-name">
                          <span className="sb-food-icon">
                            {foodIcon(item.name)}
                          </span>
                          {item.name}
                        </span>
                      </td>
                      <td>{item.category || "Uncategorized"}</td>
                      <td className="sb-align-right">
                        {item.quantity ?? item.qty ?? 0}
                      </td>
                      <td>
                        <span className={`sb-badge ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {visibleInventory.length === 0 && (
                  <tr>
                    <td colSpan="4" className="sb-empty">
                      {search
                        ? "No inventory items match your search."
                        : "No food items found. Add inventory to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="sb-inventory-footer">
            {filteredInventory.length} item
            {filteredInventory.length === 1 ? "" : "s"}
            {lastUpdated && (
              <span> · Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
        </section>

        <section className="sb-panel" id="sb-nutrition">
          <div className="sb-panel-head">
            <h2>Today's nutrition</h2>
            <button
              type="button"
              className="sb-link"
              onClick={() => onNavigate?.("nutrition")}
            >
              Details
            </button>
          </div>

          <div className="sb-nutrition">
            <div
              className="sb-donut-wrap"
              role="img"
              aria-label={`${caloriePercent}% of daily calorie target`}
              style={{
                "--sb-progress": `${caloriePercent * 3.6}deg`,
              }}
            >
              <div className="sb-donut-center">
                <strong>{caloriePercent}%</strong>
                <span>of target</span>
              </div>
            </div>

            <div className="sb-bars">
              {nutrients.map((nutrient) => (
                <ProgressBar
                  key={nutrient.label}
                  {...nutrient}
                />
              ))}
            </div>
          </div>

          <p className="sb-muted sb-nutrition-footnote">
            Nutrient progress is based on today's recorded intake.
          </p>
        </section>
      </div>

      <div className="sb-lower-panels">
        <section className="sb-panel">
          <div className="sb-panel-head">
            <h2>Inventory alerts</h2>
            <span className="sb-alert-count">
              {lowStockItems.length + expiringItems.length + expiredItems.length}
            </span>
          </div>

          {[
            ...expiredItems.map((item) => ({ ...item, alert: "Expired" })),
            ...expiringItems.map((item) => ({ ...item, alert: "Expiring soon" })),
            ...lowStockItems.map((item) => ({ ...item, alert: "Low stock" })),
          ].slice(0, 5).map((item) => (
            <div className="sb-alert-row" key={`${item.id}-${item.alert}`}>
              <span className="sb-alert-dot" />
              <span>{item.name}</span>
              <small>{item.alert}</small>
            </div>
          ))}

          {lowStockItems.length + expiringItems.length + expiredItems.length === 0 && (
            <p className="sb-muted">No inventory alerts right now.</p>
          )}
        </section>

        <section className="sb-panel">
          <div className="sb-panel-head">
            <h2>Daily mission summary</h2>
          </div>
          <p className="sb-summary-number">
            {Math.round(calories).toLocaleString()}
            <span> kcal logged today</span>
          </p>
          <div className="sb-summary-track">
            <i style={{ width: `${caloriePercent}%` }} />
          </div>
          <p className="sb-muted">
            {Math.max(0, Math.round(calorieTarget - calories)).toLocaleString()}
            {" "}kcal remaining to the crew target.
          </p>
          <button
            type="button"
            className="sb-primary-button"
            onClick={() => onNavigate?.("meals")}
          >
            Open meal planner
          </button>
        </section>
      </div>

      <div className="sb-dashboard-footer">
        <span>SpaceByte · Crew Galley</span>
        <button type="button" className="sb-link" onClick={load}>
          ↻ Refresh dashboard
        </button>
      </div>
    </div>
  );
}
