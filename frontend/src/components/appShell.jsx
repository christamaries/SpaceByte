
/*
===========================================================
 SPACEBYTE - APP SHELL
 File: frontend/src/components/appShell.jsx

 PURPOSE:
 1. Display the SpaceByte sidebar and navigation.
 2. Preserve the dashboard and meal planner.
 3. Connect inventory, nutrition, and OCR pages.
 4. Preserve the manual inventory page.
 5. Preserve Firebase sign-out through onSignOut.
 6. Keep the existing SpaceByte styling.
===========================================================
*/

import { Fragment, useState } from "react";
import Dashboard from "./dashboard";
import MealPlanner from "./mealPlanner";
import Inventory from "./Inventory";
import ManualInventory from "./ManualInventory";
import Nutrition from "./Nutrition";
import OcrCapture from "./OcrCapture";

import "../spacebyte-ui.css";

// Reusable SVG icons for sidebar navigation.
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
    case "home":
      return (
        <svg {...commonProps}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-7h6v7" />
        </svg>
      );

    case "inventory":
      return (
        <svg {...commonProps}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="M3 8v9l9 5 9-5V8" />
          <path d="M12 13v9" />
          <path d="m7.5 5.5 9 5" />
        </svg>
      );

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

    case "health":
      return (
        <svg {...commonProps}>
          <path d="M20.8 8.5c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.3Z" />
          <path d="M4.5 11h4l2-3 3 7 2-4h4" />
        </svg>
      );

    case "missions":
      return (
        <svg {...commonProps}>
          <path d="M12 15 9 12c1-4.5 4-7.5 11-9 0 7-4.5 10-8 12Z" />
          <path d="m9 12-4 1-2 4 6-1" />
          <path d="m12 15-1 4-4 2 1-6" />
          <circle cx="15.5" cy="7.5" r="1.5" />
        </svg>
      );

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

// Sidebar navigation and its expandable sub-items.
const NAV_ITEMS = [
  { key: "home", title: "Overview", icon: "home" },
  {
    key: "inventory",
    title: "Inventory",
    icon: "inventory",
    children: [
      { key: "manual-inventory", title: "Manual Inventory" },
      { key: "ocr", title: "OCR Capture" },
    ],
  },
  { key: "nutrition", title: "Nutrition", icon: "nutrition" },
  {
    key: "health",
    title: "Crew health",
    icon: "health",
    children: [{ key: "astronaut", title: "Astronaut" }],
  },
  { key: "missions", title: "Missions", icon: "missions" },
  { key: "meals", title: "Meal Planner", icon: "meals" },
];

// Friendly placeholder for pages not yet connected.
function ComingSoon({ title }) {
  const item = NAV_ITEMS
    .flatMap((navItem) => [
      navItem,
      ...(navItem.children || []),
    ])
    .find((navItem) => navItem.key === title);

  return (
    <section className="sb-coming-soon">
      <span className="sb-coming-icon" aria-hidden="true">
        <SidebarIcon name={item?.icon} />
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

// Main signed-in application layout.
export default function AppShell({ user, onSignOut }) {
  const [screen, setScreen] = useState("home");

  // Include both parent navigation items and sub-items.
  const allScreens = NAV_ITEMS.flatMap((item) => [
    item,
    ...(item.children || []),
  ]);

  const currentScreen = allScreens.find(
    (item) => item.key === screen
  );

  // Display the selected page.
  function renderScreen() {
    switch (screen) {
      case "home":
        return (
          <Dashboard
            user={user}
            activeScreen="home"
            onNavigate={setScreen}
          />
        );

      case "inventory":
        return <Inventory user={user} />;

      case "manual-inventory":
        return <ManualInventory user={user} />;

      case "meals":
        return <MealPlanner user={user} />;

      case "nutrition":
        return <Nutrition user={user} />;

      case "ocr":
        return <OcrCapture user={user} />;

      case "astronaut":
        return <ComingSoon title="Astronaut" />;

      case "health":
        return <ComingSoon title="Crew health" />;

      case "missions":
        return <ComingSoon title="Missions" />;

      default:
        return (
          <Dashboard
            user={user}
            activeScreen="home"
            onNavigate={setScreen}
          />
        );
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
          {/* Main sidebar navigation */}
          <nav
            className="sb-sidebar"
            aria-label="Main navigation"
          >
            <div className="sb-logo">
              <img
                src="/logo.png"
                alt="SpaceByte logo"
                className="sb-logo-image"
              />
            </div>

            <div className="sb-nav-items">
              {NAV_ITEMS.map((item) => {
                const childIsActive = (
                  item.children || []
                ).some((child) => child.key === screen);

                const isActive =
                  screen === item.key || childIsActive;

                return (
                  <Fragment key={item.key}>
                    <button
                      type="button"
                      className={
                        isActive
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
                      <span>{item.title}</span>
                    </button>

                    {item.children && isActive && (
                      <div className="sb-sub-items">
                        {item.children.map((child) => (
                          <button
                            key={child.key}
                            type="button"
                            className={
                              screen === child.key
                                ? "sb-sub-button active"
                                : "sb-sub-button"
                            }
                            onClick={() => setScreen(child.key)}
                            aria-current={
                              screen === child.key
                                ? "page"
                                : undefined
                            }
                          >
                            {child.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>

            {/* Keep the existing Firebase sign-out callback. */}
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
