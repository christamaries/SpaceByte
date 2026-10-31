
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

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Import React page styles.
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
// The third value is the link's color while selected,
// matching the accent color of its section.
// Colors cycle pink, green, yellow, blue.
const NAV = [
  ["About Us", "#about", "#ee6fa8"],
  ["Features", "#features", "#5ad1b0"],
  ["Missions", "#missions", "#f6c85f"],
  ["How It Works", "#how-it-works", "#5fd3ff"],
  ["Future Plans", "#future-plans", "#ee6fa8"],
  ["Contact Us", "#contact", "#5ad1b0"],
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
//                FUTURE PLANS
// ==========================================

// One card is displayed for each entry.
// Edit the titles and text, or add/remove entries.
const FUTURE_PLANS = [
  {
    title: "Crew health tracking",
    text: "Placeholder: describe this planned feature.",
  },
  {
    title: "Mission planning",
    text: "Placeholder: describe this planned feature.",
  },
  {
    title: "Smarter recommendations",
    text: "Placeholder: describe this planned feature.",
  },
];

// ==========================================
//          THE TEAM BEHIND SPACEBYTE
// ==========================================

// One card is displayed for each team member.
// Replace the placeholder names, roles, and contact details.
const TEAM = [
  {
    name: "Team member",
    role: "Role",
    contact: "email@example.com",
  },
  {
    name: "Team member",
    role: "Role",
    contact: "email@example.com",
  },
  {
    name: "Team member",
    role: "Role",
    contact: "email@example.com",
  },
  {
    name: "Team member",
    role: "Role",
    contact: "email@example.com",
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

// Hero headline, written out letter by letter by the spaceship's exhaust.
const TITLE = "Fuel your mission.";

// Spaceship timing in seconds. These must match the lp-ship-fly
// animation in landing.css: 0.3s delay, 2.6s long, with the first
// 69% spent crossing the headline before it boosts off the page.
const SHIP_DELAY = 0.3;
const SHIP_CROSS = 2.6 * 0.69;
const SHIP_WIDTH = 120;

// Callbacks are supplied by the parent component, such as App.jsx.
export default function LandingPage({
  onSignIn,
  onCreateAccount,
  onStartPlanning,
}) {
  const pageRef = useRef(null);
  const titleRef = useRef(null);

  // The nav link the visitor last clicked, such as "#features".
  const [activeLink, setActiveLink] = useState(null);

  // Times each headline letter to appear just as the ship's exhaust
  // passes over it. Runs before the first paint so nothing flickers.
  useLayoutEffect(() => {
    const title = titleRef.current;
    if (!title) return;

    const box = title.getBoundingClientRect();

    // The ship starts just off the left edge of the window
    // and crosses to the right edge of the headline.
    const start = -box.left - SHIP_WIDTH;
    const end = box.width;
    title.style.setProperty("--ship-start", `${start}px`);

    title.querySelectorAll(".lp-letter").forEach((letter) => {
      const rect = letter.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - box.left;
      const progress = (x - start) / (end - start);
      const time = SHIP_DELAY + progress * SHIP_CROSS;
      letter.style.setProperty("--t", `${time.toFixed(2)}s`);
    });
  }, []);

  // Fades sections in as they scroll into view.
  // Anything marked with data-reveal gets the is-visible class once.
  useEffect(() => {
    const items = pageRef.current.querySelectorAll("[data-reveal]");

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp" ref={pageRef}>

      {/* =========================================
                    NAVIGATION BAR
         ========================================= */}

      {/* The header contains the SpaceByte logo,
          section navigation, and account buttons. */}
      <header className="lp-nav">

        {/* Clicking the logo returns the visitor
            to the top of the landing page. */}
        <a
          href="#top"
          className="lp-brand"
          aria-label="SpaceByte home"
          onClick={(event) => {
            event.preventDefault();
            setActiveLink(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <img src={logo} alt="" />
        </a>

        {/* Generate the navigation links from the NAV array.
            Each link points to its matching page section. */}
        <nav aria-label="Primary">
          {NAV.map(([label, href, color]) => (
            <a
              key={label}
              href={href}
              onClick={() => setActiveLink(href)}
              style={activeLink === href ? { color } : undefined}
            >
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

            {/* Each letter is its own span so it can condense out of
                the exhaust. Screen readers get the plain title. */}
            <h1 className="lp-title" ref={titleRef} aria-label={TITLE}>
              <span aria-hidden="true">
                {TITLE.split(" ").map((word, w) => (
                  <span key={word}>
                    {w > 0 && " "}
                    <span className="lp-word">
                      {[...word].map((letter, i) => (
                        <span className="lp-letter" key={i}>
                          {letter}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
              </span>

              {/* Spaceship that flies in, writes the headline, then leaves. */}
              <span className="lp-ship" aria-hidden="true">
                <span className="lp-ship-trail" />
                <svg viewBox="0 0 120 48" width={SHIP_WIDTH} height="48">
                  <defs>
                    <linearGradient id="lp-flame" x1="1" x2="0">
                      <stop offset="0" stopColor="#fff6d6" />
                      <stop offset="0.4" stopColor="#f6c85f" />
                      <stop offset="1" stopColor="#ee6fa8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    className="lp-ship-flame"
                    d="M24 17 L0 24 L24 31 Z"
                    fill="url(#lp-flame)"
                  />
                  <path d="M30 14 L22 3 H40 L50 14 Z" fill="#6c63ff" />
                  <path d="M30 34 L22 45 H40 L50 34 Z" fill="#6c63ff" />
                  <path
                    d="M22 14 H78 C96 14 112 19 119 24 C112 29 96 34 78 34 H22 Z"
                    fill="#e8ecff"
                  />
                  <rect x="30" y="22" width="40" height="4" rx="2" fill="#6c63ff" />
                  <circle cx="88" cy="24" r="5.5" fill="#5ad1b0" stroke="#0b1424" strokeWidth="2" />
                </svg>
              </span>
            </h1>

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
            </div>

            {/* Displays the three environments
                supported by the SpaceByte concept. */}
            <p className="lp-eyebrow pink">
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
          <p className="lp-eyebrow green" data-reveal>Features</p>

          <h2 data-reveal style={{ "--d": "0.1s" }}>
            Everything the galley needs, nothing it doesn't.
          </h2>

          <p className="lp-sub" data-reveal style={{ "--d": "0.2s" }}>
            One mission control for food stores, meal plans and crew nutrition.
          </p>

          {/* Four-column feature card layout. */}
          <div className="lp-grid four">
            {FEATURES.map((feature, index) => {
              // Select the icon component for this feature.
              const FeatureIcon = feature.icon;

              return (
                <article
                  className="lp-card"
                  key={feature.title}
                  data-reveal
                  style={{ "--d": `${index * 0.12}s` }}
                >

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
          <div data-reveal="left">
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

          {/* Static meal planner example. */}
          <div
            className="lp-mock"
            aria-label="Meal planner preview"
            data-reveal="right"
            style={{ "--d": "0.15s" }}
          >
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

              {Object.entries(PLAN).map(([meal, items], row) => (
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
                      style={{ "--i": row * items.length + index }}
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
          <p className="lp-eyebrow yellow" data-reveal>Missions</p>

          <h2 data-reveal style={{ "--d": "0.1s" }}>Built for every orbit.</h2>

          {/* Generate one mission card for each entry
              in the MISSIONS array. */}
          <div className="lp-grid three">
            {MISSIONS.map((mission, index) => (
              <article
                className="lp-card mission"
                key={mission.name}
                data-reveal
                style={{ "--d": `${index * 0.15}s` }}
              >
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
          <p className="lp-eyebrow blue" data-reveal>How it works</p>

          <h2 data-reveal style={{ "--d": "0.1s" }}>Three steps to liftoff.</h2>

          {/* Ordered list displays the three workflow steps. */}
          <ol className="lp-steps">

            {/* Generate each numbered step from the STEPS array. */}
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                data-reveal
                style={{ "--d": `${index * 0.2}s` }}
              >
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

        {/* Future plans for SpaceByte.
            Replace the heading and text below with your own content. */}
        <section className="lp-section" id="future-plans">
          <p className="lp-eyebrow pink" data-reveal>Future plans</p>

          <h2 data-reveal style={{ "--d": "0.1s" }}>What's next for SpaceByte.</h2>

          <p className="lp-sub" data-reveal style={{ "--d": "0.2s" }}>
            Coming soon.
          </p>

          {/* One card for each entry in the FUTURE_PLANS array. */}
          <div className="lp-grid three">
            {FUTURE_PLANS.map((plan, index) => (
              <article
                className="lp-card"
                key={plan.title}
                data-reveal
                style={{ "--d": `${index * 0.15}s` }}
              >
                <h3>{plan.title}</h3>
                <p>{plan.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* The team behind SpaceByte and how to reach them.
            Edit the team members in the TEAM array above. */}
        <section className="lp-section" id="contact">
          <p className="lp-eyebrow green" data-reveal>Contact us</p>

          <h2 data-reveal style={{ "--d": "0.1s" }}>The team behind SpaceByte.</h2>

          <p className="lp-sub" data-reveal style={{ "--d": "0.2s" }}>
            We are team <span className="lp-team-name">"JACE"</span>. SpaceByte
            brings together software development, nutrition tracking, and
            mission planning to explore better food management for space
            environments.
          </p>

          {/* One card for each entry in the TEAM array.
              The index is part of the key because the
              placeholder names are all the same. */}
          <div className="lp-grid four">
            {TEAM.map((member, index) => (
              <article
                className="lp-card"
                key={`${member.name}-${index}`}
                data-reveal
                style={{ "--d": `${index * 0.15}s` }}
              >
                <h3>{member.name}</h3>
                <p>{member.role}</p>
                <p>{member.contact}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* =========================================
                         FOOTER
         ========================================= */}

      {/* Footer contains the capstone attribution. */}
      <footer className="lp-foot">
        {/* University capstone identification. */}
        <p className="lp-capstone">Senior Capstone · University of Tampa</p>
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
