
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "./firebase";
import "./App.css";

function App() {
  // Store whether the visitor is logging in or signing up.
  const [isSignup, setIsSignup] = useState(false);

  // Store the form input values.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Store the authenticated Firebase user.
  const [user, setUser] = useState(null);

  // Store messages displayed to the visitor.
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Listen for Firebase login/logout changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Stop listening when the component is removed.
    return () => unsubscribe();
  }, []);

  // Create an account or sign in.
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        setMessage("Your SpaceByte account was created!");
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      }
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email already has an account. Please log in.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/weak-password":
          setError("Please choose a stronger password.");
          break;
        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;
        default:
          setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Log the user out.
  async function handleLogout() {
    setError("");
    setMessage("");

    try {
      await signOut(auth);
      setEmail("");
      setPassword("");
    } catch {
      setError("Unable to log out. Please try again.");
    }
  }

  // Show the dashboard after successful authentication.
  if (user) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <a className="brand" href="/">
            <span className="brand-icon">✦</span>
            SpaceByte
          </a>
          <button className="secondary-button" onClick={handleLogout}>
            Log Out
          </button>
        </header>

        <section className="dashboard">
          <div className="dashboard-icon">🚀</div>
          <p className="eyebrow">MISSION CONTROL</p>
          <h1>Welcome to SpaceByte!</h1>
          <p className="subtitle">
            You're signed in and ready to manage your food inventory.
          </p>

          <div className="user-card">
            <span className="status-dot"></span>
            <div>
              <strong>Account authenticated</strong>
              <p>{user.email}</p>
            </div>
          </div>

          <p className="dashboard-note">
            Your login is working. Food inventory and nutrition
            features can be connected next.
          </p>
        </section>
      </main>
    );
  }

  // Show the login or signup form.
  return (
    <main className="app-shell">
      <section className="auth-layout">
        <div className="welcome-panel">
          <a className="brand" href="/">
            <span className="brand-icon">✦</span>
            SpaceByte
          </a>

          <div className="welcome-content">
            <div className="planet-art" aria-hidden="true">
              <span className="planet">◉</span>
              <span className="orbit orbit-one"></span>
              <span className="orbit orbit-two"></span>
              <span className="star star-one">✦</span>
              <span className="star star-two">✧</span>
            </div>

            <p className="eyebrow">YOUR FOOD. YOUR MISSION.</p>
            <h1>Make every bite count.</h1>
            <p className="welcome-description">
              Keep track of your food inventory, monitor nutrition,
              and make smarter choices with SpaceByte.
            </p>
          </div>

          <p className="panel-footer">
            SPACEBYTE · FOOD MANAGEMENT REIMAGINED
          </p>
        </div>

        <div className="form-panel">
          <div className="form-container">
            <p className="eyebrow">
              {isSignup ? "JOIN THE MISSION" : "WELCOME BACK"}
            </p>

            <h2>
              {isSignup ? "Create your account" : "Log in to SpaceByte"}
            </h2>

            <p className="subtitle">
              {isSignup
                ? "Set up your account to get started."
                : "Enter your details to continue your journey."}
            </p>

            <div className="form-tabs">
              <button
                type="button"
                className={!isSignup ? "tab active" : "tab"}
                onClick={() => {
                  setIsSignup(false);
                  setError("");
                  setMessage("");
                }}
              >
                Log In
              </button>

              <button
                type="button"
                className={isSignup ? "tab active" : "tab"}
                onClick={() => {
                  setIsSignup(true);
                  setError("");
                  setMessage("");
                }}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  isSignup ? "new-password" : "current-password"
                }
                minLength={6}
                required
              />

              {error && (
                <p className="feedback error" role="alert">
                  {error}
                </p>
              )}

              {message && (
                <p className="feedback success" role="status">
                  {message}
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isSignup
                  ? "Create Account"
                  : "Log In"}
              </button>
            </form>

            <p className="switch-text">
              {isSignup
                ? "Already have an account?"
                : "New to SpaceByte?"}{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                  setMessage("");
                }}
              >
                {isSignup ? "Log in" : "Create an account"}
              </button>
            </p>

            <p className="security-note">
              Secure sign-in powered by Firebase Authentication.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;