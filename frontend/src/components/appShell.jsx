
/*
===========================================================
 SPACEBYTE - APP SHELL
 File: frontend/src/components/appShell.jsx

 PURPOSE:
 1. Display the SpaceByte sidebar and navigation.
 2. Preserve the dashboard and meal planner.
 3. Connect the combined inventory page.
 4. Connect nutrition and dietary restrictions.
 5. Connect OCR Capture under Inventory.
 6. Preserve Firebase sign-out through onSignOut.
 7. Keep the existing SpaceByte styling.

===========================================================
*/


// Import Fragment to group JSX elements without adding
// unnecessary HTML elements to the page.
//
// Import useState to keep track of the currently selected page.
import { Fragment, useState } from "react";


// ================================================
//              IMPORT APPLICATION PAGES
// ================================================

// Main dashboard page.
import Dashboard from "./dashboard";

// Weekly meal planning page.
import MealPlanner from "./mealPlanner";

// Food inventory management page.
import Inventory from "./Inventory";

// Nutrition tracking page.
import Nutrition from "./Nutrition";

// Food image recognition and OCR capture page.
import OcrCapture from "./OcrCapture";

// User dietary preferences and restrictions page.
import DietaryRestrictions from "./dietaryRestrictions";


// ================================================
//                IMPORT SPACEBYTE STYLES
// ================================================

// Import the main SpaceByte stylesheet.
// This file controls the appearance of the sidebar,
// dashboard layout, buttons, navigation, and page content.
import "../spacebyte-ui.css";


/*
===========================================================
 SIDEBAR ICONS
===========================================================
*/

// Reusable SVG icons for sidebar navigation.
//
// Instead of repeating SVG code for every navigation button,
// this component displays the appropriate icon based on
// the name passed through the name prop.
function SidebarIcon({ name }) {

  // Shared SVG properties used by all sidebar icons.
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


  // Select the correct SVG icon based on its name.
  switch (name) {

    // ----------------------------------------
    // HOME ICON
    // ----------------------------------------
    case "home":
      return (
        <svg {...commonProps}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-7h6v7" />
        </svg>
      );


    // ----------------------------------------
    // INVENTORY ICON
    // ----------------------------------------
    case "inventory":
      return (
        <svg {...commonProps}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="M3 8v9l9 5 9-5V8" />
          <path d="M12 13v9" />
          <path d="m7.5 5.5 9 5" />
        </svg>
      );


    // ----------------------------------------
    // NUTRITION ICON
    // ----------------------------------------
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


    // ----------------------------------------
    // CREW HEALTH ICON
    // ----------------------------------------
    case "health":
      return (
        <svg {...commonProps}>
          <path d="M20.8 8.5c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.3Z" />
          <path d="M4.5 11h4l2-3 3 7 2-4h4" />
        </svg>
      );


    // ----------------------------------------
    // MISSIONS ICON
    // ----------------------------------------
    case "missions":
      return (
        <svg {...commonProps}>
          <path d="M12 15 9 12c1-4.5 4-7.5 11-9 0 7-4.5 10-8 12Z" />
          <path d="m9 12-4 1-2 4 6-1" />
          <path d="m12 15-1 4-4 2 1-6" />
          <circle cx="15.5" cy="7.5" r="1.5" />
        </svg>
      );


    // ----------------------------------------
    // MEAL PLANNER ICON
    // ----------------------------------------
    case "meals":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );


    // Return nothing if an unsupported icon name is supplied.
    default:
      return null;
  }
}


/*
===========================================================
 SIDEBAR NAVIGATION
===========================================================
*/

// This array defines the navigation items displayed
// in the SpaceByte sidebar.
//
// Each navigation item contains:
// - key: Internal identifier used to select a page.
// - title: Text displayed in the sidebar.
// - icon: Name of the SVG icon.
//
// Some navigation items also contain children.
//
// Inventory:
//   - OCR Capture
//
// Nutrition:
//   - Dietary Restrictions
//
// Crew health:
//   - Astronaut
//
// Keeping navigation in one array makes it easier
// to add or reorganize pages later.

const NAV_ITEMS = [
  {
    key: "home",
    title: "Overview",
    icon: "home",
  },

  {
    key: "inventory",
    title: "Inventory",
    icon: "inventory",
    children: [
      {
        key: "ocr",
        title: "OCR Capture",
      },
    ],
  },

  {
    key: "nutrition",
    title: "Nutrition",
    icon: "nutrition",
    children: [
      {
        key: "dietary",
        title: "Dietary Restrictions",
      },
    ],
  },

  {
    key: "health",
    title: "Crew health",
    icon: "health",
    children: [
      {
        key: "astronaut",
        title: "Astronaut",
      },
    ],
  },

  {
    key: "missions",
    title: "Missions",
    icon: "missions",
  },

  {
    key: "meals",
    title: "Meal Planner",
    icon: "meals",
  },
];


/*
===========================================================
 COMING SOON PAGE
===========================================================
*/

// Display a placeholder page for modules that have not
// been fully connected to their application functionality.
//
// The title prop identifies which module is being displayed.
function ComingSoon({ title }) {

  // Search the navigation configuration for the selected item.
  //
  // flatMap combines parent navigation items and their
  // children into one array so both can be searched.
  const item = NAV_ITEMS
    .flatMap((navItem) => [
      navItem,
      ...(navItem.children || []),
    ])
    .find((navItem) => navItem.key === title);


  // Display the placeholder content.
  return (
    <section className="sb-coming-soon">

      {/* Display the navigation icon when one exists. */}
      <span className="sb-coming-icon" aria-hidden="true">
        <SidebarIcon name={item?.icon} />
      </span>

      {/* Display the name of the selected module. */}
      <h2>{title}</h2>

      {/* Explain that the module is not fully connected yet. */}
      <p>
        This SpaceByte module is ready for its page
        integration. Your existing dashboard and meal
        planner remain available.
      </p>

    </section>
  );
}


/*
===========================================================
 MAIN SIGNED-IN APPLICATION LAYOUT
===========================================================
*/

// AppShell displays the main application after authentication.
//
// PROPS:
// user:
//   The currently authenticated user's information.
//
// onSignOut:
//   Callback provided by the parent authentication component.
//   It handles Firebase sign-out.
export default function AppShell({ user, onSignOut }) {

  // The Overview page is the default screen.
  //
  // setScreen changes the selected page when a sidebar
  // navigation button is clicked.
  const [screen, setScreen] = useState("home");

  /*
  =========================================================
   PAGE RENDERING
  =========================================================
  */

  // Determine which application page should appear
  // inside the main content area.
  function renderScreen() {

    // Check the currently selected screen.
    switch (screen) {

      // ----------------------------------------
      // DASHBOARD / OVERVIEW
      // ----------------------------------------

      case "home":
        return (
          <Dashboard
            user={user}
            activeScreen="home"
            onNavigate={setScreen}
          />
        );


      // ----------------------------------------
      // INVENTORY PAGE
      // ----------------------------------------

      // Display the combined inventory page.
      // Manual inventory entry is included inside this page.
      case "inventory":
        return <Inventory user={user} />;


      // ----------------------------------------
      // MEAL PLANNER
      // ----------------------------------------

      // Display the weekly meal planner.
      case "meals":
        return <MealPlanner user={user} />;


      // ----------------------------------------
      // NUTRITION OVERVIEW
      // ----------------------------------------

      // Display nutrition totals and tracking information.
      case "nutrition":
        return <Nutrition user={user} />;


      // ----------------------------------------
      // DIETARY RESTRICTIONS
      // ----------------------------------------

      // Display dietary preferences and restrictions.
      case "dietary":
        return <DietaryRestrictions user={user} />;


      // ----------------------------------------
      // OCR CAPTURE
      // ----------------------------------------

      // Display the food image recognition page.
      case "ocr":
        return <OcrCapture user={user} />;


      // ----------------------------------------
      // CREW HEALTH PLACEHOLDER
      // ----------------------------------------

      case "astronaut":
        return <ComingSoon title="astronaut" />;

      case "health":
        return <ComingSoon title="Crew health" />;


      // ----------------------------------------
      // MISSIONS PLACEHOLDER
      // ----------------------------------------

      case "missions":
        return <ComingSoon title="missions" />;


      // ----------------------------------------
      // DEFAULT PAGE
      // ----------------------------------------

      // If an unknown screen is selected, return the user
      // to the dashboard instead of displaying a blank page.
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


  /*
  =========================================================
   APPLICATION LAYOUT
  =========================================================
  */

  // Render the complete signed-in SpaceByte application.
  return (
    <div className="sb-stage">

      {/* Main application window. */}
      <div className="sb-window">
        <div className="sb-body">


          {/* =====================================
              MAIN SIDEBAR NAVIGATION
          ===================================== */}

          <nav
            className="sb-sidebar"
            aria-label="Main navigation"
          >

            {/* ---------------------------------
                SPACEBYTE LOGO
            --------------------------------- */}

            {/* Display the application logo.
                The image is loaded from the frontend public folder. */}
            <div className="sb-logo">
              <img
                src="/logo.png"
                alt="SpaceByte logo"
                className="sb-logo-image"
              />
            </div>


            {/* ---------------------------------
                NAVIGATION ITEMS
              --------------------------------- */}

            {/* Loop through the NAV_ITEMS array to build
                the sidebar navigation dynamically. */}
            <div className="sb-nav-items">

              {NAV_ITEMS.map((item) => {

                // Check whether one of this parent's children
                // is currently selected.
                const childIsActive = (
                  item.children || []
                ).some((child) => child.key === screen);


                // Highlight the parent when it or one
                // of its child pages is active.
                const isActive =
                  screen === item.key || childIsActive;


                // Render the parent and any expanded children.
                return (
                  <Fragment key={item.key}>


                    {/* ---------------------------------
                        PARENT NAVIGATION BUTTON
                    --------------------------------- */}

                    <button
                      type="button"

                      // Apply the active CSS class when
                      // this navigation section is selected.
                      className={
                        isActive
                          ? "sb-nav-button active"
                          : "sb-nav-button"
                      }

                      // Update the selected page when clicked.
                      onClick={() => setScreen(item.key)}

                      // Provide an accessible button label.
                      aria-label={item.title}

                      // Identify the currently selected page.
                      aria-current={
                        screen === item.key ? "page" : undefined
                      }

                      // Display a tooltip when hovering.
                      title={item.title}
                    >

                      {/* Display the icon associated with the item. */}
                      <SidebarIcon name={item.icon} />

                      {/* Display the navigation label. */}
                      <span>{item.title}</span>

                    </button>


                    {/* ---------------------------------
                        CHILD NAVIGATION ITEMS
                    --------------------------------- */}

                    {/* Show child navigation buttons only
                        when their parent section is active. */}
                    {item.children && isActive && (

                      <div className="sb-sub-items">

                        {/* Render each child navigation item. */}
                        {item.children.map((child) => (

                          <button
                            key={child.key}
                            type="button"

                            // Highlight the currently selected child.
                            className={
                              screen === child.key
                                ? "sb-sub-button active"
                                : "sb-sub-button"
                            }

                            // Change the selected page.
                            onClick={() => setScreen(child.key)}

                            // Identify the active child page.
                            aria-current={
                              screen === child.key
                                ? "page"
                                : undefined
                            }
                          >

                            {/* Display the child page name. */}
                            {child.title}

                          </button>

                        ))}

                      </div>
                    )}

                  </Fragment>
                );
              })}

            </div>


            {/* =====================================
                FIREBASE SIGN-OUT
            ===================================== */}

            {/* Call the sign-out function supplied by the
                parent authentication component.
                
                This keeps Firebase authentication handling
                outside of the AppShell navigation component. */}
            <button
              type="button"
              className="sb-signout"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
            >

              {/* Power symbol used for the sign-out button. */}
              <span aria-hidden="true">⏻</span>

              {/* Visible button label. */}
              <span>Sign out</span>

            </button>

          </nav>


          {/* =====================================
              SELECTED PAGE CONTENT
          ===================================== */}

          {/* The selected application page is rendered here.
              renderScreen() determines which component appears. */}
          <main className="sb-content">

            {renderScreen()}

          </main>


        </div>
      </div>
    </div>
  );
}
