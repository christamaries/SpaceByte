// SpaceByte landing page (public marketing page shown before sign-in).
// Sections: nav, hero, features, meal planner preview, missions, how it works, footer.
import "../landing.css";

// Point these at your real image files in src/assets (the build fails if a path is wrong).
import logo from "../assets/logo.png";
import earth from "../assets/earth.png";
import moon from "../assets/moon.png";
import iss from "../assets/iss.png";

// Top nav links: [label, in-page anchor id]. Each id matches a section/footer id below.
const NAV = [
  ["About Us", "#about"],
  ["Features", "#features"],
  ["Missions", "#missions"],
  ["Future Plans", "#future-plans"],
  ["Contact Us", "#contact"],
];

// Feature cards. `tone` picks the icon chip color (green/purple/yellow/pink in landing.css).
const FEATURES = [
  { tone: "green", title: "Galley inventory", text: "Every pouch, tin and tortilla counted, with days of food on board always in view." },
  { tone: "purple", title: "Nutrition Engine", text: "Drag meals across breakfast, lunch and dinner, then watch the ration check update live." },
  { tone: "yellow", title: "Crew nutrition", text: "Calories, protein, vitamin D and water per crew member, measured against mission targets." },
  { tone: "pink", title: "Expiry alerts", text: "Flags anything expiring within seven days and suggests swaps before food goes to waste." },
];

// Mission cards: `img` is the imported asset for each environment.
const MISSIONS = [
  { name: "Earth", img: earth, text: "Analog missions, training habitats and ground crews preparing for flight." },
  { name: "ISS", img: iss, text: "Long-duration stays in low Earth orbit with regular resupply windows." },
  { name: "Moon", img: moon, text: "Surface missions where every ration is planned before launch." },
];

// "How it works" steps, shown in order with numbered circles.
const STEPS = [
  { tone: "green", title: "Log your stores", text: "Scan or enter what's packed for the mission. SpaceByte tracks quantities and expiry dates." },
  { tone: "yellow", title: "Set crew targets", text: "Add each crew member and their daily calorie, protein and vitamin goals." },
  { tone: "pink", title: "Follow the plan", text: "Get a balanced weekly menu and alerts the moment anything drifts off target." },
];

// Static sample data for the meal planner preview (not live data).
const DAYS = ["Mon", "Tue", "Wed", "Thu"];
const PLAN = {
  Breakfast: ["Eggs", "Granola", "Fruit cup", "Omelette"],
  Lunch: ["Tortilla wrap", "Shrimp", "Noodles", "Sandwich"],
  Dinner: ["Beef stew", "Mac & cheese", "Teriyaki", "Rice bowl"],
};

// Callbacks are passed in as props so this page doesn't depend on a router.
// Wire them up in App.jsx (e.g. with navigate() or a state-based view switch).
export default function LandingPage({ onSignIn, onCreateAccount, onStartPlanning, onTourGalley }) {
  return (
    <div className="lp">
      {/* Sticky top bar: logo, anchor links, auth buttons */}
      <header className="lp-nav">
        <a href="#top" className="lp-brand" aria-label="SpaceByte home">
          <img src={logo} alt="" />
          <span>SpaceByte</span>
        </a>
        <nav aria-label="Primary">
          {NAV.map(([label, href]) => (
            <a key={label} href={href}>{label}</a>
          ))}
        </nav>
        <div className="lp-auth">
          <button className="lp-link" onClick={onSignIn}>Sign in</button>
          <button className="lp-btn primary" onClick={onCreateAccount}>Create account</button>
        </div>
      </header>

      <main id="top">
        {/* HERO: headline, intro copy, CTAs on the left; Earth/Moon with floating stat cards on the right */}
        <section className="lp-hero" id="about">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow pink">About us</p>
            <h1>Fuel your mission.</h1>
            <p className="lp-lede">
              SpaceByte helps people who live or train in space-like environments manage what they eat.
              It combines real-time food inventory tracking, nutrition monitoring, dietary preferences,
              and an environment toggle to recommend meals from the food a user actually has on hand.
              The goals are to avoid menu fatigue, reduce food waste, and make eating in space enjoyable
              as well as nutritious.
            </p>
            <div className="lp-cta">
              <button className="lp-btn primary" onClick={onStartPlanning}>Start planning</button>
              <button className="lp-btn ghost" onClick={onTourGalley}>Tour the galley</button>
            </div>
            <p className="lp-eyebrow green">Earth • ISS • Moon</p>
          </div>

          {/* Decorative visual only, hidden from screen readers (aria-hidden) */}
          <div className="lp-orbit" aria-hidden="true">
            <img className="lp-moon" src={moon} alt="" />
            <img className="lp-earth" src={earth} alt="" />
            {/* Floating card: calories today vs target */}
            <div className="lp-float kcal">
              <span className="chip blue" />
              <div><small>KCAL TODAY</small><b>9,840</b> <em>/ 11,200</em></div>
            </div>
            {/* Floating card: nutrient progress bars (width = percent of target) */}
            <div className="lp-float nutrition">
              <b>Today's nutrition</b>
              {[["Protein", 88, "purple"], ["Carbs", 78, "yellow"], ["Vitamin D", 56, "pink"]].map(([n, v, c]) => (
                <label key={n}>{n}<span className="bar"><i className={c} style={{ width: `${v}%` }} /></span></label>
              ))}
            </div>
            {/* Floating card: expiry alert example */}
            <div className="lp-float alert">
              <span className="chip pink" />
              <div><b>Shrimp cocktail</b><small>Expires in 5 days · 12 left</small></div>
            </div>
          </div>
        </section>

        {/* FEATURES: four cards built from the FEATURES array */}
        <section className="lp-section" id="features">
          <p className="lp-eyebrow green">Features</p>
          <h2>Everything the galley needs, nothing it doesn't.</h2>
          <p className="lp-sub">One mission control for food stores, meal plans and crew nutrition.</p>
          <div className="lp-grid four">
            {FEATURES.map((f) => (
              <article className="lp-card" key={f.title}>
                <span className={`chip ${f.tone}`} />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* MEAL PLANNER: description and checklist on the left, static preview on the right */}
        <section className="lp-section planner" id="meal-planner">
          <div>
            <p className="lp-eyebrow green">Meal planner</p>
            <h2>Plan the week in one glance.</h2>
            <p className="lp-sub">
              Build a crew's meal plans around what's actually on board. SpaceByte balances every day
              against your crew's calorie target.
            </p>
            <ul className="lp-checks">
              <li>Week, month and full-mission views</li>
              <li>Live ration check for calories, protein, vitamin D and water</li>
              <li>Smart swaps when stock runs low</li>
            </ul>
          </div>
          {/* Mock meal planner. Highlighted cell (.on) marks the current day (Thu) */}
          <div className="lp-mock" aria-label="Meal planner preview">
            <div className="lp-mock-head">
              <b>Week 16</b><small>Crew of 4 · 2,800 kcal target</small>
              <span className="tabs"><i className="on">Week</i><i>Month</i><i>Mission</i></span>
            </div>
            <div className="lp-table">
              <span />
              {DAYS.map((d) => <strong key={d}>{d}</strong>)}
              {Object.entries(PLAN).map(([meal, items]) => (
                <div className="row" key={meal}>
                  <strong className={meal.toLowerCase()}>{meal}</strong>
                  {items.map((m, i) => <span key={m} className={i === 3 ? "cell on" : "cell"}>{m}</span>)}
                </div>
              ))}
            </div>
            {/* Calorie and vitamin D progress meters */}
            <div className="lp-meters">
              <label>Calories <em>98%</em><span className="bar"><i className="green" style={{ width: "98%" }} /></span></label>
              <label>Vitamin D <em>86%</em><span className="bar"><i className="yellow" style={{ width: "86%" }} /></span></label>
            </div>
            <p className="lp-swap"><b>Suggested swap</b> · Mac &amp; cheese running low. Try rice bowl on Tue.</p>
          </div>
        </section>

        {/* MISSIONS: Earth, ISS and Moon cards built from the MISSIONS array */}
        <section className="lp-section" id="missions">
          <p className="lp-eyebrow pink">Missions</p>
          <h2>Built for every orbit.</h2>
          <div className="lp-grid three">
            {MISSIONS.map((m) => (
              <article className="lp-card mission" key={m.name}>
                <img src={m.img} alt="" />
                <h3>{m.name}</h3>
                <p>{m.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS: three numbered steps */}
        <section className="lp-section" id="how-it-works">
          <p className="lp-eyebrow pink">How it works</p>
          <h2>Three steps to liftoff.</h2>
          <ol className="lp-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className={`num ${s.tone}`}>{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {/* FOOTER: targets for the Future Plans and Contact Us nav links. Replace placeholder text */}
      <footer className="lp-foot">
        <section id="future-plans"><h3>Future plans</h3><p>Coming soon.</p></section>
        <section id="contact"><h3>Contact us</h3><p>Add your team contact here.</p></section>
      </footer>
    </div>
  );
}