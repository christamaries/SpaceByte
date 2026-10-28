/*
===========================================================
 SPACEBYTE - APP SHELL
 AppShell.jsx

 PURPOSE:
 1. Display the SpaceByte sidebar.
 2. Show the correct icon for each navigation item.
 3. Preserve the existing Dashboard and Meal Planner.
 4. Keep the existing Firebase sign-out handler.
 5. Provide navigation placeholders for pages that have
    not yet been connected to their real components.

 ICONS:
 Overview    = House
 Inventory   = Package
 Nutrition   = Fork and knife
 Crew health = Heart with heartbeat
 Missions    = Rocket
 Meal Planner = Calendar
===========================================================
*/

import { useState } from "react";
import Dashboard from "./dashboard";
import MealPlanner from "./mealPlanner";
import Inventory from "./Inventory";
import Nutrition from "./Nutrition";
import "../spacebyte-ui.css";

/*
 * Reusable SVG icon component.
 *
 * Inline SVG means you do not need to install lucide-react
 * or another icon library.
 *
 * All icons use the same size and stroke style.
 */
function SidebarIcon({ name }) {
  const commonProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: "false",
  };

  switch (name) {
    // Overview: house icon
    case "home":
      return (
        <svg {...commonProps}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-7h6v7" />
        </svg>
      );

    // Inventory: package / box icon
    case "inventory":
      return (
        <svg {...commonProps}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="M3 8v9l9 5 9-5V8" />
          <path d="M12 13v9" />
          <path d="m7.5 5.5 9 5" />
        </svg>
      );

    // Nutrition: fork and knife icon
    case "nutrition":
      return (
        <svg {...commonProps}>
          <path d="M6 3v6" />
          <path d="M3.5 3v3.5a2.5 2.5 0 0 0 5 0V3" />
          <path d="M6 9v12" />
          <path d="M16 3v18" />
          <path d="M16 3c3 2 4 5 4 8h-4" />
        </svg>
      );

    // Crew health: heart with heartbeat line
    case "health":
      return (
        <svg {...commonProps}>
          <path d="M20.8 8.5c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.3Z" />
          <path d="M4.5 11h4l2-3 3 7 2-4h4" />
        </svg>
      );

    // Missions: rocket icon
    case "missions":
      return (
        <svg {...commonProps}>
          <path d="M12 15 9 12c1-4.5 4-7.5 11-9 0 7-4.5 10-8 12Z" />
          <path d="m9 12-4 1-2 4 6-1" />
          <path d="m12 15-1 4-4 2 1-6" />
          <circle cx="15.5" cy="7.5" r="1.5" />
        </svg>
      );

    // Meal Planner: calendar icon
    case "meals":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );

    default:
      return null;
  }
}

/*
 * Sidebar navigation configuration.
 *
 * The five primary items match your requested screenshot.
 * Meal Planner is retained as an additional item so your
 * existing MealPlanner component remains accessible.
 */
const NAV_ITEMS = [
  { key: "home", title: "Overview", icon: "home" },
  { key: "inventory", title: "Inventory", icon: "inventory" },
  { key: "nutrition", title: "Nutrition", icon: "nutrition" },
  { key: "health", title: "Crew health", icon: "health" },
  { key: "missions", title: "Missions", icon: "missions" },
  { key: "meals", title: "Meal Planner", icon: "meals" },
];

/*
 * Placeholder for pages that do not yet have a connected
 * page component.
 *
 * This prevents clicking a navigation item from displaying
 * a blank page. Replace these placeholders with the actual
 * page components as those features are implemented.
 */
function ComingSoon({ title }) {
  return (
    <section className="sb-coming-soon">
      <span className="sb-coming-icon" aria-hidden="true">
        <SidebarIcon
          name={
            NAV_ITEMS.find((item) => item.title === title)?.icon
          }
        />
      </span>

      <h2>{title}</h2>

      <p>
        This SpaceByte module is ready for its page
        integration. Your existing dashboard and meal
        planner remain available.
      </p>
    </section>
  );
}

/*
 * Main application shell.
 *
 * The user and onSignOut props are supplied by your
 * existing authentication/application code.
 */
export default function AppShell({ user, onSignOut }) {
  // Track which navigation item is currently selected.
  const [screen, setScreen] = useState("home");

  // Find the current screen title for the window header.
  const currentScreen = NAV_ITEMS.find(
    (item) => item.key === screen
  );

  /*
   * Render the appropriate screen.
   *
   * Dashboard and Meal Planner use your existing components.
   * The other screens show placeholders until their real
   * components are connected.
   */
  
function renderScreen() {
  switch (screen) {
    case "home":
      return <Dashboard user = {user} />;

    case "inventory":
      return <Inventory user = {user} />;

    case "meals":
      return <MealPlanner user = {user} />;

    case "nutrition":
      return <Nutrition user = {user} />;

    case "health":
      return <ComingSoon title = "Crew health" />;

    case "missions":
      return <ComingSoon title = "Missions" />;

    default:
      return <Dashboard user = {user} />;
  }
}

  return (
    <div className="sb-stage">
      <div className="sb-window">
        {/* Browser-style title bar */}
        <div className="sb-titlebar">
          <i
            style={{ background: "#ee5fa7" }}
            aria-hidden="true"
          />
          <i
            style={{ background: "#f9d56e" }}
            aria-hidden="true"
          />
          <i
            style={{ background: "#5ad1b0" }}
            aria-hidden="true"
          />

          <span>
            SpaceByte · {currentScreen?.title || "Overview"}
          </span>
        </div>

        <div className="sb-body">
          {/* Sidebar navigation */}
          <nav className="sb-sidebar" aria-label="Main navigation">
            {/* SpaceByte logo mark */}
            
          {/* SpaceByte dashboard logo */}
          <div className="sb-logo">
          <img
          src="/logo.png"
          alt="SpaceByte logo"
          className="sb-logo-image"
          />
        </div>


            {/* Navigation buttons */}
            <div className="sb-nav-items">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={
                    screen === item.key
                      ? "sb-nav-button active"
                      : "sb-nav-button"
                  }
                  onClick={() => setScreen(item.key)}
                  aria-label={item.title}
                  aria-current={
                    screen === item.key ? "page" : undefined
                  }
                  title={item.title}
                >
                  <SidebarIcon name={item.icon} />

                  {/* Text labels match the dashboard screenshot */}
                  <span>{item.title}</span>
                </button>
              ))}
            </div>

            {/* Sign out remains connected to Firebase auth */}
            <button
              type="button"
              className="sb-signout"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <span aria-hidden="true">⏻</span>
              <span>Sign out</span>
            </button>
          </nav>

          {/* Selected page content */}
          <main className="sb-content">
            {renderScreen()}
          </main>
        </div>
      </div>
    </div>
  );
}
