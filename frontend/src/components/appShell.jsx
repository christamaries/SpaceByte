// AppShell.jsx
// Signed-in layout: window frame, sidebar, and the two screens.

import { useState } from "react";
import Dashboard from "./dashboard";
import MealPlanner from "./MealPlanner";
import "../spacebyte-ui.css";

const SCREENS = {
  home: { title: "Crew Galley", icon: "🏠" },
  meals: { title: "Meal Planner", icon: "🍴" },
};

export default function AppShell({ user, onSignOut }) {
  const [screen, setScreen] = useState("home");

  return (
    <div className="sb-stage">
      <div className="sb-window">
        <div className="sb-titlebar">
          <i style={{ background: "#ee5fa7" }} />
          <i style={{ background: "#f9d56e" }} />
          <i style={{ background: "#5ad1b0" }} />
          <span>SpaceByte · {SCREENS[screen].title}</span>
        </div>

        <div className="sb-body">
          <nav className="sb-sidebar">
            <span className="sb-logo">✦</span>
            {Object.entries(SCREENS).map(([key, s]) => (
              <button
                key={key}
                className={screen === key ? "active" : ""}
                onClick={() => setScreen(key)}
                aria-label={s.title}
                title={s.title}
              >
                {s.icon}
              </button>
            ))}
            <button className="sb-signout" onClick={onSignOut} title="Sign out" aria-label="Sign out">
              ⏻
            </button>
          </nav>

          <main className="sb-content">
            {screen === "home" ? <Dashboard user={user} /> : <MealPlanner user={user} />}
          </main>
        </div>
      </div>
    </div>
  );
}