
/*
===========================================================
 SPACEBYTE LANDING PAGE
 File: frontend/src/components/LandingPage.jsx
===========================================================

 PURPOSE:
 This component displays the public SpaceByte landing page
 before a user signs in or creates an account.

 INCLUDES:
 1. Navigation bar
 2. Hero section with Earth and Moon visuals
 3. Feature cards with colored icons
 4. Meal planner preview
 5. Mission cards
 6. How it works
 7. Footer

 The four feature icons are provided by lucide-react.
===========================================================
*/

// Import the CSS file responsible for the landing page layout,
// colors, spacing, responsive design, and visual effects.
import "../landing.css";

// Import the existing SpaceByte image assets.
// These images are used in the logo, hero section,
// and mission cards.
import logo from "../assets/logo.png";
import earth from "../assets/earth.png";
import moon from "../assets/moon.png";
import iss from "../assets/iss.png";

// Import icons from lucide-react.
// These icons visually represent the four main
// SpaceByte features.
import {
  Package,
  CalendarDays,
  HeartPulse,
  Bell,
} from "lucide-react";

// ==========================================
//             NAVIGATION LINKS
// ==========================================

// Stores the navigation labels and the section IDs
// they should link to when clicked.
//
// For example:
// "Features" links to the section with id="features".
//
// This array allows the navigation menu to be generated
// automatically instead of writing every link separately.
const NAV = [
  ["About Us", "#about"],
  ["Features", "#features"],
  ["Missions", "#missions"],
  ["Future Plans", "#future-plans"],
  ["Contact Us", "#contact"],
];

// ==========================================
//               FEATURE CARDS
// ==========================================

// Defines the four main features displayed
// on the SpaceByte landing page.
//
// tone: Determines the colored background style.
// title: Displays the feature name.
// text: Explains what the feature does.
// icon: Identifies the Lucide icon component to display.
const FEATURES = [
  {
    tone: "green",
    title: "Galley inventory",
    text: "Every pouch, tin and tortilla counted, with days of food on board always in view.",
    icon: Package,
  },
  {
    tone: "purple",
    title: "Nutrition Engine",
    text: "Drag meals across breakfast, lunch and dinner, then watch the ration check update live.",
    icon: CalendarDays,
  },
  {
    tone: "yellow",
    title: "Crew nutrition",
    text: "Calories, protein, vitamin D and water per crew member, measured against mission targets.",
    icon: HeartPulse,
  },
  {
    tone: "pink",
    title: "Expiry alerts",
    text: "Flags anything expiring within seven days and suggests swaps before food goes to waste.",
    icon: Bell,
  },
];

// ==========================================
//                MISSION CARDS
// ==========================================

// Defines the mission environments supported
// by the SpaceByte concept.
//
// Each mission has:
// name: The mission environment's title.
// img: The imported image used for the card.
// text: A short explanation of the environment.
const MISSIONS = [
  {
    name: "Earth",
    img: earth,
    text: "Analog missions, training habitats and ground crews preparing for flight.",
  },
  {
    name: "ISS",
    img: iss,
    text: "Long-duration stays in low Earth orbit with regular resupply windows.",
  },
  {
    name: "Moon",
    img: moon,
    text: "Surface missions where every ration is planned before launch.",
  },
];

// ==========================================
//                HOW IT WORKS
// ==========================================

// Defines the three steps displayed in the
// How It Works section.
//
// Each step has a color, heading, and description.
// The array is used to generate the numbered steps.
const STEPS = [
  {
    tone: "green",
    title: "Log your stores",
    text: "Scan or enter what's packed for the mission. SpaceByte tracks quantities and expiry dates.",
  },
  {
    tone: "yellow",
    title: "Set crew targets",
    text: "Add each crew member and their daily calorie, protein and vitamin goals.",
  },
  {
    tone: "pink",
    title: "Follow the plan",
    text: "Get a balanced weekly menu and alerts the moment anything drifts off target.",
  },
];

// ==========================================
//            MEAL PLANNER PREVIEW
// ==========================================

// These weekday labels are used in the static
// meal planner preview.
const DAYS = ["Mon", "Tue", "Wed", "Thu"];

// Sample meal information displayed in the landing page.
//
// This is demonstration data for the preview.
// It is not loaded from the user's actual inventory
// or saved meal plan.
const PLAN = {
  Breakfast: ["Eggs", "Granola", "Fruit cup", "Omelette"],
  Lunch: ["Tortilla wrap", "Shrimp", "Noodles", "Sandwich"],
  Dinner: ["Beef stew", "Mac & cheese", "Teriyaki", "Rice bowl"],
};

// ==========================================
//              LANDING PAGE COMPONENT
// ==========================================

// Main landing page component.
//
// The parent component, such as App.jsx, supplies
// the callback functions used by the landing page buttons.
//
// onSignIn:
// Opens the sign-in screen.
//
// onCreateAccount:
// Opens the account registration screen.
//
// onStartPlanning:
// Starts the meal-planning workflow.
//
// onTourGalley:
// Opens or navigates to the galley experience.
export default function LandingPage({
  onSignIn,
  onCreateAccount,
  onStartPlanning,
  onTourGalley,
}) {

  // Return the complete SpaceByte landing page.
  return (
    <div className="lp">

      {/* =========================================
                    NAVIGATION BAR
         ========================================= */}

      {/* The header contains the SpaceByte logo,
          section navigation, and account buttons. */}
      <header className="lp-nav">

        {/* Clicking the logo returns the visitor
            to the top of the landing page. */}
        <a href="#top" className="lp-brand" aria-label="SpaceByte home">
          <img src={logo} alt="" />
        </a>

        {/* Generate the navigation links from the NAV array.
            Each link points to its matching page section. */}
        <nav aria-label="Primary">
          {NAV.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>

        {/* Account actions connect to the parent component.
            The parent determines which authentication screen
            should open when a button is clicked. */}
        <div className="lp-auth">

          {/* Open the existing sign-in screen. */}
          <button className="lp-link" onClick={onSignIn}>
            Sign in
          </button>

          {/* Open the existing account registration screen. */}
          <button className="lp-btn primary" onClick={onCreateAccount}>
            Create account
          </button>
        </div>
      </header>

      {/* Main content contains all landing page sections. */}
      <main id="top">

        {/* =========================================
                      HERO SECTION
           ========================================= */}

        {/* Introduces SpaceByte and explains its purpose.
            The section ID allows the About Us navigation
            link to scroll to this location. */}
        <section className="lp-hero" id="about">

          {/* Text content and primary landing page actions. */}
          <div className="lp-hero-copy">

            <p className="lp-eyebrow pink">About us</p>

            {/* Main landing page headline. */}
            <h1>Fuel your mission.</h1>

            {/* Explains the purpose of SpaceByte and
                the problems the application is designed
                to address. */}
            <p className="lp-lede">
              SpaceByte helps people who live or train in space-like
              environments manage what they eat. It combines real-time
              food inventory tracking, nutrition monitoring, dietary
              preferences, and an environment toggle to recommend meals
              from the food a user actually has on hand. The goals are
              to avoid menu fatigue, reduce food waste, and make eating
              in space enjoyable as well as nutritious.
            </p>

            {/* Primary actions available to landing page visitors. */}
            <div className="lp-cta">

              {/* Start the meal-planning workflow. */}
              <button
                className="lp-btn primary"
                onClick={onStartPlanning}
              >
                Start planning
              </button>

              {/* Development-only link for testing the
                  manual inventory page.
                  import.meta.env.DEV is true when running
                  the Vite development server. */}
              {import.meta.env.DEV && (
                <a
                  href="/manual-inventory"
                  className="lp-btn ghost"
                >
                  📦 Manual Inventory
                </a>
              )}

              {/* Open the galley tour through the
                  callback supplied by the parent component. */}
              <button
                className="lp-btn ghost"
                onClick={onTourGalley}
              >
                Tour the galley
              </button>
            </div>

            {/* Displays the three environments
                supported by the SpaceByte concept. */}
            <p className="lp-eyebrow green">
              Earth • ISS • Moon
            </p>
          </div>

          {/* =========================================
                 HERO EARTH AND MOON VISUALS
             ========================================= */}

          {/* Decorative illustration area containing Earth,
              the Moon, and floating example dashboard cards.
              aria-hidden hides this decorative artwork
              from screen readers. */}
          <div className="lp-orbit" aria-hidden="true">

            {/* Moon and Earth images imported above. */}
            <img className="lp-moon" src={moon} alt="" />
            <img className="lp-earth" src={earth} alt="" />

            {/* Example calories summary card.
                These are static demonstration values,
                not live nutrition data from the backend. */}
            <div className="lp-float kcal">
              <span className="chip blue" />

              <div>
                <small>KCAL TODAY</small>
                <b>9,840</b>
                {" "}
                <em>/ 11,200</em>
              </div>
            </div>

            {/* Example nutrition progress card.
                The percentages are sample values used
                to demonstrate the nutrition interface. */}
            <div className="lp-float nutrition">
              <b>Today's nutrition</b>

              {/* Generate the nutrition progress bars
                  using sample nutrient names, percentages,
                  and color classes. */}
              {[
                ["Protein", 88, "purple"],
                ["Carbs", 78, "yellow"],
                ["Vitamin D", 56, "pink"],
              ].map(([name, value, color]) => (
                <label key={name}>
                  {name}

                  <span className="bar">
                    {/* The inline width determines how much
                        of the progress bar is filled. */}
                    <i
                      className={color}
                      style={{ width: `${value}%` }}
                    />
                  </span>
                </label>
              ))}
            </div>

            {/* Example food expiration alert.
                This demonstrates how SpaceByte can display
                a warning about food approaching expiration. */}
            <div className="lp-float alert">

              {/* Bell icon inside a colored notification chip. */}
              <span className="chip pink lp-alert-icon" aria-hidden="true">
                <Bell size={20} strokeWidth={2} />
              </span>

              {/* Sample food item and expiration information. */}
              <div>
                <b>Shrimp cocktail</b>
                <small>Expires in 5 days · 12 left</small>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
                     FEATURES SECTION
           ========================================= */}

        {/* Explains the major features of SpaceByte.
            Each card is generated from the FEATURES array.
            Each colored block contains its matching icon. */}
        <section className="lp-section" id="features">

          <p className="lp-eyebrow green">Features</p>

          <h2>
            Everything the galley needs, nothing it doesn't.
          </h2>

          <p className="lp-sub">
            One mission control for food stores, meal plans and crew nutrition.
          </p>

          {/* Four-column feature card layout. */}
          <div className="lp-grid four">

            {/* Loop through the FEATURES array to create
                one card for each SpaceByte feature. */}
            {FEATURES.map((feature) => {

              // Select the icon component stored in the
              // current feature object.
              const FeatureIcon = feature.icon;

              return (
                <article className="lp-card" key={feature.title}>

                  {/* Colored square containing the feature icon.
                      The tone class determines the icon background. */}
                  <span
                    className={`chip ${feature.tone} lp-feature-icon`}
                    aria-hidden="true"
                  >
                    <FeatureIcon
                      size={22}
                      strokeWidth={2}
                    />
                  </span>

                  {/* Display the feature name and description. */}
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* =========================================
                   MEAL PLANNER PREVIEW
           ========================================= */}

        {/* Introduces the meal planner and shows visitors
            an example of how meals can be organized. */}
        <section className="lp-section planner" id="meal-planner">

          {/* Meal planner description and feature list. */}
          <div>
            <p className="lp-eyebrow green">Meal planner</p>

            <h2>Plan the week in one glance.</h2>

            <p className="lp-sub">
              Build a crew's meal plans around what's actually on board.
              SpaceByte balances every day against your crew's calorie target.
            </p>

            {/* Lists the meal planner's advertised capabilities. */}
            <ul className="lp-checks">
              <li>Week, month and full-mission views</li>
              <li>
                Live ration check for calories, protein, vitamin D and water
              </li>
              <li>Smart swaps when stock runs low</li>
            </ul>
          </div>

          {/* Static meal planner example.
              This preview demonstrates the layout of a weekly
              meal planner but does not load saved meal plans. */}
          <div className="lp-mock" aria-label="Meal planner preview">

            {/* Header showing the sample week and crew target. */}
            <div className="lp-mock-head">
              <b>Week 16</b>
              <small>Crew of 4 · 2,800 kcal target</small>

              {/* Example view tabs.
                  These are visual preview elements. */}
              <span className="tabs">
                <i className="on">Week</i>
                <i>Month</i>
                <i>Mission</i>
              </span>
            </div>

            {/* Meal planner table.
                The first row displays weekdays.
                The remaining rows display breakfast, lunch,
                and dinner selections. */}
            <div className="lp-table">

              {/* Empty first cell aligns the weekday headings
                  with the meal category column. */}
              <span />

              {/* Generate weekday headings from the DAYS array. */}
              {DAYS.map((day) => (
                <strong key={day}>{day}</strong>
              ))}

              {/* Generate the meal rows from the PLAN object. */}
              {Object.entries(PLAN).map(([meal, items]) => (
                <div className="row" key={meal}>

                  {/* Display the meal category.
                      The lowercase class allows CSS to style
                      breakfast, lunch, and dinner separately. */}
                  <strong className={meal.toLowerCase()}>
                    {meal}
                  </strong>

                  {/* Display the sample meal assigned
                      to each weekday. */}
                  {items.map((item, index) => (
                    <span
                      key={item}
                      className={index === 3 ? "cell on" : "cell"}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ))}
            </div>

            {/* Sample nutrition progress meters.
                These values are for demonstration only. */}
            <div className="lp-meters">

              {/* Example calorie progress. */}
              <label>
                Calories <em>98%</em>
                <span className="bar">
                  <i className="green" style={{ width: "98%" }} />
                </span>
              </label>

              {/* Example vitamin D progress. */}
              <label>
                Vitamin D <em>86%</em>
                <span className="bar">
                  <i className="yellow" style={{ width: "86%" }} />
                </span>
              </label>
            </div>

            {/* Example smart food swap recommendation.
                Demonstrates how the application could suggest
                an alternative when inventory runs low. */}
            <p className="lp-swap">
              <b>Suggested swap</b> · Mac &amp; cheese running low.
              Try rice bowl on Tue.
            </p>
          </div>
        </section>

        {/* =========================================
                      MISSIONS SECTION
           ========================================= */}

        {/* Shows the different environments for which
            SpaceByte is designed. */}
        <section className="lp-section" id="missions">

          <p className="lp-eyebrow pink">Missions</p>

          <h2>Built for every orbit.</h2>

          {/* Generate one mission card for each entry
              in the MISSIONS array. */}
          <div className="lp-grid three">
            {MISSIONS.map((mission) => (
              <article className="lp-card mission" key={mission.name}>

                {/* Display the image assigned to this mission. */}
                <img src={mission.img} alt="" />

                {/* Display the mission name and description. */}
                <h3>{mission.name}</h3>
                <p>{mission.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* =========================================
                    HOW IT WORKS SECTION
           ========================================= */}

        {/* Explains the basic workflow for using SpaceByte. */}
        <section className="lp-section" id="how-it-works">

          <p className="lp-eyebrow pink">How it works</p>

          <h2>Three steps to liftoff.</h2>

          {/* Ordered list displays the three workflow steps. */}
          <ol className="lp-steps">

            {/* Generate each numbered step from the STEPS array. */}
            {STEPS.map((step, index) => (
              <li key={step.title}>

                {/* Display the step number.
                    The tone class controls its color. */}
                <span className={`num ${step.tone}`}>
                  {index + 1}
                </span>

                {/* Display the step title and explanation. */}
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {/* =========================================
                         FOOTER
         ========================================= */}

      {/* Footer contains future plans and project information. */}
      <footer className="lp-foot">

        {/* Future Plans section.
            The navigation menu links to this section. */}
        <section id="future-plans">
          <h3>Future plans</h3>
          <p>Coming soon.</p>
        </section>

        {/* Contact and project team information.
            The navigation menu links to this section. */}
        <section id="contact">
          <h3>THE TEAM BEHIND SPACEBYTE</h3>

          {/* Capstone team name. */}
          <p className="lp-team-name">"JACE"</p>

          {/* Brief description of the project and its goals. */}
          <p>SpaceByte brings together software development,
             nutrition tracking, and mission planning to explore
             better food management for space environments. </p>

          {/* University capstone identification. */}
          <p className="lp-capstone">Senior Capstone · University of Tampa</p>
        </section>
      </footer>

      {/* =========================================
                     COPYRIGHT
         ========================================= */}

      {/* Automatically displays the current year
          so the copyright year does not need to be
          manually updated every January. */}
      <div className="lp-copyright">
        <p>© {new Date().getFullYear()} SpaceByte. All rights reserved.</p>
      </div>
    </div>
  );
}
