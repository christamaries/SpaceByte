
/*
===========================================================
 SPACEBYTE - NUTRITION PAGE
 Nutrition.jsx

 PURPOSE:
 1. Load today's nutrition from the existing backend.
 2. Display calories, protein, carbohydrates, and fat.
 3. Show progress toward the daily calorie target.
 4. Preserve Firebase authentication.
 5. Display loading, error, and empty states.

 API:
 GET /nutrition/today
===========================================================
*/

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";
import "../spacebyte-ui.css";

const DEFAULT_TARGET = 2800;

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

function NutritionCard({ label, value, unit, icon, description }) {
  return (
    <article className="sb-nutrition-card">
      <div className="sb-nutrition-card-top">
        <span className="sb-nutrition-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="sb-nutrition-card-label">{label}</span>
      </div>

      <div className="sb-nutrition-value">
        {formatNumber(value)}
        <span>{unit}</span>
      </div>

      <p className="sb-nutrition-description">{description}</p>
    </article>
  );
}

export default function Nutrition({ user }) {
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadNutrition = useCallback(async (isRefresh = false) => {
    if (!user) {
      setNutrition(null);
      setError("Please sign in to view your nutrition.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // Get a fresh Firebase ID token for this signed-in user.
      const token = await user.getIdToken();

      // Request today's nutrition from the existing backend.
      const result = await apiRequest(
        "/nutrition/today",
        token
      );

      setNutrition({
        calories: Number(result?.calories) || 0,
        protein: Number(result?.protein) || 0,
        carbs: Number(result?.carbs) || 0,
        fat: Number(result?.fat) || 0,
        calorieTarget:
          Number(result?.calorieTarget) > 0
            ? Number(result.calorieTarget)
            : DEFAULT_TARGET,
        caloriePercentage:
          Number(result?.caloriePercentage) || 0,
      });
    } catch (err) {
      console.error("Unable to load nutrition:", err);
      setError(
        err?.message ||
          "Unable to load nutrition. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadNutrition();
  }, [loadNutrition]);

  const calories = nutrition?.calories ?? 0;
  const target = nutrition?.calorieTarget ?? DEFAULT_TARGET;
  const remaining = Math.max(0, target - calories);
  const percentage =
    target > 0
      ? Math.min(100, Math.round((calories / target) * 100))
      : 0;

  if (loading) {
    return (
      <section className="sb-nutrition-page">
        <div className="sb-nutrition-header">
          <div>
            <p className="sb-nutrition-eyebrow">CREW WELLNESS</p>
            <h1>Nutrition</h1>
            <p>Loading your nutrition summary...</p>
          </div>
        </div>

        <div className="sb-nutrition-message" role="status">
          <span className="sb-nutrition-spinner" />
          Loading today's nutrition data...
        </div>
      </section>
    );
  }

  return (
    <section className="sb-nutrition-page">
      <header className="sb-nutrition-header">
        <div>
          <p className="sb-nutrition-eyebrow">CREW WELLNESS</p>
          <h1>Nutrition</h1>
          <p>
            Track your daily fuel and monitor your nutritional
            intake.
          </p>
        </div>

        <button
          type="button"
          className="sb-nutrition-refresh"
          onClick={() => loadNutrition(true)}
          disabled={refreshing}
        >
          <span aria-hidden="true">↻</span>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="sb-nutrition-error" role="alert">
          <strong>Nutrition data unavailable</strong>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadNutrition(true)}
            disabled={refreshing}
          >
            Try again
          </button>
        </div>
      )}

      {!error && nutrition && (
        <>
          <div className="sb-nutrition-hero">
            <div className="sb-nutrition-hero-copy">
              <p className="sb-nutrition-eyebrow">
                TODAY'S CALORIE INTAKE
              </p>
              <div className="sb-nutrition-calorie-total">
                {formatNumber(calories)}
                <span>kcal</span>
              </div>
              <p>
                {remaining > 0
                  ? `${formatNumber(remaining)} kcal remaining to your daily target`
                  : "You've reached your daily calorie target."}
              </p>
            </div>

            <div
              className="sb-nutrition-progress"
              role="progressbar"
              aria-label="Daily calorie goal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentage}
            >
              <div className="sb-nutrition-progress-track">
                <div
                  className="sb-nutrition-progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="sb-nutrition-progress-labels">
                <span>{percentage}% of goal</span>
                <span>{formatNumber(target)} kcal goal</span>
              </div>
            </div>
          </div>

          <div className="sb-nutrition-section-heading">
            <div>
              <h2>Nutrient breakdown</h2>
              <p>Totals from your recorded food consumption.</p>
            </div>
          </div>

          <div className="sb-nutrition-grid">
            <NutritionCard
              label="Protein"
              value={nutrition.protein}
              unit="g"
              icon="✦"
              description="Supports muscle maintenance"
            />

            <NutritionCard
              label="Carbohydrates"
              value={nutrition.carbs}
              unit="g"
              icon="◈"
              description="A source of daily energy"
            />

            <NutritionCard
              label="Fat"
              value={nutrition.fat}
              unit="g"
              icon="◎"
              description="Helps support normal body functions"
            />
          </div>

          <div className="sb-nutrition-note">
            <span aria-hidden="true">ⓘ</span>
            <p>
              Nutrition totals are calculated from foods recorded
              as consumed. Inventory items that have not been
              logged as eaten are not included. Nutrient totals
              depend on the serving values stored for each food.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
