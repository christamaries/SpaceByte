
/*
===========================================================
 SPACEBYTE LANDING PAGE
===========================================================

 Includes:
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

// Import React page styles.
import "../landing.css";

// Import the existing SpaceByte image assets.
import logo from "../assets/logo.png";
import earth from "../assets/earth.png";
import moon from "../assets/moon.png";
import iss from "../assets/iss.png";

// Import icons for the four feature cards.
import {
  Package,
  CalendarDays,
  HeartPulse,
  Bell,
} from "lucide-react";

// Navigation links and their matching section IDs.
const NAV = [
  ["About Us", "#about"],
  ["Features", "#features"],
  ["Missions", "#missions"],
  ["Future Plans", "#future-plans"],
  ["Contact Us", "#contact"],
];

// Feature cards.
// Each tone matches an existing colored chip in landing.css.
// Each icon identifies the feature visually.
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

// Mission cards and their image assets.
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

// Steps shown in the How It Works section.
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

// Sample data for the static meal planner preview.
const DAYS = ["Mon", "Tue", "Wed", "Thu"];

const PLAN = {
  Breakfast: ["Eggs", "Granola", "Fruit cup", "Omelette"],
  Lunch: ["Tortilla wrap", "Shrimp", "Noodles", "Sandwich"],
  Dinner: ["Beef stew", "Mac & cheese", "Teriyaki", "Rice bowl"],
};

// Callbacks are supplied by the parent component, such as App.jsx.
export default function LandingPage({
  onSignIn,
  onCreateAccount,
  onStartPlanning,
  onTourGalley,
}) {
  return (
    <div className="lp">

      {
      /* =========================================
                      NAVIGATION BAR
         ========================================= */  
        }
      <header className="lp-nav">
        <a href="#top" className="lp-brand" aria-label="SpaceByte home">
          <img src={logo} alt="" />
          <span>SpaceByte</span>
        </a>

        <nav aria-label="Primary">
          {NAV.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="lp-auth">
          <button className="lp-link" onClick={onSignIn}>
            Sign in
          </button>

          <button
            className="lp-btn primary"
            onClick={onCreateAccount}
          >
            Create account
          </button>
        </div>
      </header>

      <main id="top">

        {
        /* =========================================
                        HERO SECTION
           ========================================= */
        }
        <section className="lp-hero" id="about">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow pink">About us</p>

            <h1>Fuel your mission.</h1>

            <p className="lp-lede">
              SpaceByte helps people who live or train in space-like
              environments manage what they eat. It combines real-time
              food inventory tracking, nutrition monitoring, dietary
              preferences, and an environment toggle to recommend meals
              from the food a user actually has on hand. The goals are
              to avoid menu fatigue, reduce food waste, and make eating
              in space enjoyable as well as nutritious.
            </p>

            <div className="lp-cta">
              <button
                className="lp-btn primary"
                onClick={onStartPlanning}
              >
                Start planning
              </button>
    {import.meta.env.DEV && (
  <a
    href="/manual-inventory"
    className="lp-btn ghost"
  >
    📦 Manual Inventory
  </a>
)}
              <button
                className="lp-btn ghost"
                onClick={onTourGalley}
              >
                Tour the galley
              </button>
            </div>

            <p className="lp-eyebrow green">
              Earth • ISS • Moon
            </p>
          </div>

          {/* Decorative Earth and Moon illustration. */}
          <div className="lp-orbit" aria-hidden="true">
            <img className="lp-moon" src={moon} alt="" />
            <img className="lp-earth" src={earth} alt="" />

            {/* Calories summary card. */}
            <div className="lp-float kcal">
              <span className="chip blue" />

              <div>
                <small>KCAL TODAY</small>
                <b>9,840</b>
                {" "}
                <em>/ 11,200</em>
              </div>
            </div>

            {/* Sample nutrient progress bars. */}
            <div className="lp-float nutrition">
              <b>Today's nutrition</b>

              {[
                ["Protein", 88, "purple"],
                ["Carbs", 78, "yellow"],
                ["Vitamin D", 56, "pink"],
              ].map(([name, value, color]) => (
                <label key={name}>
                  {name}

                  <span className="bar">
                    <i
                      className={color}
                      style={{ width: `${value}%` }}
                    />
                  </span>
                </label>
              ))}
            </div>

            {/* Sample food expiry alert. */}
            <div className="lp-float alert">
              <span className="chip pink" />

              <div>
                <b>Shrimp cocktail</b>
                <small>Expires in 5 days · 12 left</small>
              </div>
            </div>
          </div>
        </section>

        {
        /* =========================================
                      FEATURES SECTION
            Each colored block now contains an icon.
           ========================================= */
           }
        <section className="lp-section" id="features">
          <p className="lp-eyebrow green">Features</p>

          <h2>
            Everything the galley needs, nothing it doesn't.
          </h2>

          <p className="lp-sub">
            One mission control for food stores, meal plans and crew nutrition.
          </p>

          <div className="lp-grid four">
            {FEATURES.map((feature) => {
              // Select the icon component for this feature.
              const FeatureIcon = feature.icon;

              return (
                <article className="lp-card" key={feature.title}>

                  {/* Colored square containing the icon. */}
                  <span
                    className={`chip ${feature.tone} lp-feature-icon`}
                    aria-hidden="true"
                  >
                    <FeatureIcon
                      size={22}
                      strokeWidth={2}
                    />
                  </span>

                  {/* Feature title and description. */}
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {
        /* =========================================
                    MEAL PLANNER PREVIEW
           ========================================= */
        }
        <section className="lp-section planner" id="meal-planner">
          <div>
            <p className="lp-eyebrow green">Meal planner</p>

            <h2>Plan the week in one glance.</h2>

            <p className="lp-sub">
              Build a crew's meal plans around what's actually on board.
              SpaceByte balances every day against your crew's calorie target.
            </p>

            <ul className="lp-checks">
              <li>Week, month and full-mission views</li>
              <li>
                Live ration check for calories, protein, vitamin D and water
              </li>
              <li>Smart swaps when stock runs low</li>
            </ul>
          </div>

          {/* Static meal planner example. */}
          <div className="lp-mock" aria-label="Meal planner preview">
            <div className="lp-mock-head">
              <b>Week 16</b>
              <small>Crew of 4 · 2,800 kcal target</small>

              <span className="tabs">
                <i className="on">Week</i>
                <i>Month</i>
                <i>Mission</i>
              </span>
            </div>

            <div className="lp-table">
              <span />

              {DAYS.map((day) => (
                <strong key={day}>{day}</strong>
              ))}

              {Object.entries(PLAN).map(([meal, items]) => (
                <div className="row" key={meal}>
                  <strong className={meal.toLowerCase()}>
                    {meal}
                  </strong>

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

            {/* Sample nutrition meters. */}
            <div className="lp-meters">
              <label>
                Calories <em>98%</em>
                <span className="bar">
                  <i className="green" style={{ width: "98%" }} />
                </span>
              </label>

              <label>
                Vitamin D <em>86%</em>
                <span className="bar">
                  <i className="yellow" style={{ width: "86%" }} />
                </span>
              </label>
            </div>

            <p className="lp-swap">
              <b>Suggested swap</b> · Mac &amp; cheese running low.
              Try rice bowl on Tue.
            </p>
          </div>
        </section>

        {
        /* =========================================
                      MISSIONS SECTION
           ========================================= */
        }
        <section className="lp-section" id="missions">
          <p className="lp-eyebrow pink">Missions</p>

          <h2>Built for every orbit.</h2>

          <div className="lp-grid three">
            {MISSIONS.map((mission) => (
              <article className="lp-card mission" key={mission.name}>
                <img src={mission.img} alt="" />

                <h3>{mission.name}</h3>
                <p>{mission.text}</p>
              </article>
            ))}
          </div>
        </section>

        {
        /* =========================================
                      HOW IT WORKS SECTION
           ========================================= */
        }
        <section className="lp-section" id="how-it-works">
          <p className="lp-eyebrow pink">How it works</p>

          <h2>Three steps to liftoff.</h2>

          <ol className="lp-steps">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className={`num ${step.tone}`}>
                  {index + 1}
                </span>

                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {
      /* =========================================
                          FOOTER
         ========================================= */
      }
      <footer className="lp-foot">
        <section id="future-plans">
          <h3>Future plans</h3>
          <p>Coming soon.</p>
        </section>

        <section id="contact">
          <h3>THE TEAM BEHIND SPACEBYTE</h3>
          <p className="lp-team-name">"JACE"</p>
          <p>SpaceByte brings together software development,
             nutrition tracking, and mission planning to explore
             better food management for space environments. </p>
          <p className="lp-capstone">Senior Capstone · University of Tampa</p>
        </section>
      </footer>

      <div className="lp-copyright">
        <p>© {new Date().getFullYear()} SpaceByte. All rights reserved.</p>
      </div>
    </div>   
  );
}