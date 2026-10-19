// MealPlanner.jsx
// Weekly meal planner. Uses:
//   GET    /meal-plan        -> [{id, date: "YYYY-MM-DD", mealType, foodId, foodName, servings, calories, protein, carbs, fat}]
//   POST   /meal-plan        -> { date, mealType, foodId, servings }
//   DELETE /meal-plan/:id
//   GET    /dashboard        -> inventory + statuses (food picker and "suggested swap")

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";
import { CREW, TARGETS, foodIcon } from "../spacebyteConfig";

const MEAL_TYPES = ["breakfast", "lunch", "dinner"];
const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const TYPE_COLORS = { breakfast: "#f9d56e", lunch: "#5ad1b0", dinner: "#6c63ff" };

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mondayOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export default function MealPlanner({ user }) {
  const [meals, setMeals] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [adding, setAdding] = useState(null); // { date, mealType }
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const token = await user.getIdToken();
      const [plan, dash] = await Promise.all([
        apiRequest("/meal-plan", token),
        apiRequest("/dashboard", token),
      ]);
      setMeals(plan);
      setInventory(dash.inventory);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // ===========================================
  //              WEEK DATES
  //===========================================
  
  const start = mondayOf(new Date());
  start.setDate(start.getDate() + weekOffset * 7);
  const days = DAY_LABELS.map((label, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { label, iso: toISO(d), dayNum: d.getDate() };
  });
  const todayISO = toISO(new Date());
  const missionWeek = Math.ceil((CREW.missionDay + weekOffset * 7) / 7);

  // ===========================================
  //      GROUP MEALS BY "DATE|MEALTYPE"
  // ===========================================
  const grouped = {};
  for (const m of meals) {
    const key = `${String(m.date).slice(0, 10)}|${m.mealType}`;
    (grouped[key] ||= []).push(m);
  }
  const weekMeals = meals.filter((m) =>
    days.some((d) => d.iso === String(m.date).slice(0, 10))
  );

  // ===========================================
  //                ACTIONS
  // ===========================================
  async function addMeal(foodId) {
    if (!foodId || !adding) return;
    try {
      const token = await user.getIdToken();
      await apiRequest("/meal-plan", token, {
        method: "POST",
        body: JSON.stringify({ date: adding.date, mealType: adding.mealType, foodId, servings: 1 }),
      });
      setAdding(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteMeal(id) {
    try {
      const token = await user.getIdToken();
      await apiRequest(`/meal-plan/${id}`, token, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  // ===============================================
  //  ration check (average per day across the week) 
  // ================================================
  const sum = (key) => weekMeals.reduce((s, m) => s + (Number(m[key]) || 0), 0) / 7;
  const ration = [
    { label: "Calories", value: sum("calories"), target: TARGETS.calories, color: "#5ad1b0" },
    { label: "Protein", value: sum("protein"), target: TARGETS.protein, color: "#6c63ff" },
    { label: "Carbs", value: sum("carbs"), target: TARGETS.carbs, color: "#f9d56e" },
    { label: "Fat", value: sum("fat"), target: TARGETS.fat, color: "#ee5fa7" },
  ].map((r) => ({ ...r, pct: Math.round((r.value / r.target) * 100) }));

  // ==================================================
  // suggested swap: a planned food that is running low 
  // ===================================================
  const byId = Object.fromEntries(inventory.map((f) => [f.id, f]));
  const lowMeal = weekMeals
    .filter((m) => ["LOW", "EXPIRED"].includes(byId[m.foodId]?.status))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
  const alternative = inventory
    .filter((f) => f.status === "OK" && (Number(f.calories) || 0) > 0)
    .sort((a, b) => b.quantity - a.quantity)[0];
  let swapText = "Everything planned this week is well stocked.";
  if (lowMeal && alternative) {
    const idx = days.findIndex((d) => d.iso === String(lowMeal.date).slice(0, 10));
    const dayName = DAY_LABELS[idx][0] + DAY_LABELS[idx].slice(1).toLowerCase();
    swapText = `${lowMeal.foodName} running low. Try ${alternative.name} on ${dayName}.`;
  }

  if (loading) return <p className="sb-muted">Loading meal plan…</p>;

  return (
    <div className="sb-planner">
      <div className="sb-planner-main">
        <div className="sb-planner-top">
          <div className="sb-week-title">
            <h2>Week {missionWeek}</h2>
            <span className="sb-muted">
              Crew of {CREW.size} · {TARGETS.calories.toLocaleString()} kcal target
            </span>
          </div>
          <div className="sb-pills">
            <button className="sb-pill active">Week</button>
            <button className="sb-pill" disabled title="Coming soon">Month</button>
            <button className="sb-pill" disabled title="Coming soon">Mission</button>
          </div>
        </div>

        <div className="sb-week-nav">
          <button className="sb-link" onClick={() => setWeekOffset((w) => w - 1)}>← Previous</button>
          <button className="sb-link" onClick={() => setWeekOffset(0)}>This week</button>
          <button className="sb-link" onClick={() => setWeekOffset((w) => w + 1)}>Next →</button>
        </div>

        {error && <p className="sb-error">{error}</p>}

        <div className="sb-grid">
          <div />
          {days.map((d) => (
            <div key={d.iso} className={`sb-day-head ${d.iso === todayISO ? "today" : ""}`}>
              {d.label}
              <small>{d.dayNum}</small>
            </div>
          ))}

          {MEAL_TYPES.map((type) => (
            <FragmentRow key={type}>
              <div className="sb-row-label" style={{ color: TYPE_COLORS[type] }}>
                {type.toUpperCase()}
              </div>
              {days.map((d) => {
                const list = grouped[`${d.iso}|${type}`] || [];
                const isAdding = adding && adding.date === d.iso && adding.mealType === type;
                const first = list[0];
                return (
                  <div
                    key={d.iso + type}
                    className={`sb-cell ${d.iso === todayISO ? "today" : ""} ${first ? "" : "empty"}`}
                    onClick={() => !first && !isAdding && setAdding({ date: d.iso, mealType: type })}
                  >
                    {isAdding ? (
                      <select
                        autoFocus
                        defaultValue=""
                        onChange={(e) => addMeal(e.target.value)}
                        onBlur={() => setAdding(null)}
                      >
                        <option value="" disabled>Pick food…</option>
                        {inventory.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    ) : first ? (
                      <>
                        <span className="sb-cell-icon" style={{ color: TYPE_COLORS[type] }}>
                          {foodIcon(first.foodName)}
                        </span>
                        <span>{first.foodName}</span>
                        {list.length > 1 && <small className="sb-more">+{list.length - 1} more</small>}
                        <button
                          className="sb-x"
                          aria-label={`Remove ${first.foodName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMeal(first.id);
                          }}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="sb-plus">+</span>
                    )}
                  </div>
                );
              })}
            </FragmentRow>
          ))}
        </div>
      </div>

      <aside className="sb-panel sb-ration">
        <h3>Ration check</h3>
        {ration.map((r) => (
          <div key={r.label} className="sb-ration-row">
            <div>
              <span>{r.label}</span>
              <b style={{ color: r.color }}>{r.pct}%</b>
            </div>
            <div className="sb-bar">
              <i style={{ width: `${Math.min(100, r.pct)}%`, background: r.color }} />
            </div>
          </div>
        ))}
        <div className="sb-swap">
          <strong>⇄ Suggested swap</strong>
          <p>{swapText}</p>
        </div>
      </aside>
    </div>
  );
}

// Grid rows are flat children of the CSS grid, so a fragment is needed.
function FragmentRow({ children }) {
  return <>{children}</>;
}
