// SpaceByte - Authentication Frontend
  // This file manages:
  // 1. Login
  // 2. Sign-up
  // 3. Forgot Password
  // 4. Reset Password
  // 5. Signed-in user dashboard

  // React manages the screens and form inputs.
  // Firebase Authentication manages user accounts and passwords.

// ===================================================
//                    IMPORTS
// ===================================================

// Import React hooks for managing state and effects.
import { useEffect, useState } from "react";

// Helper for communicating with the Express backend.
import { apiRequest } from "./api";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

// Firebase Authentication instance from src/firebase.js.
import { auth } from "./firebase";

// Signed-in layout: Crew Galley dashboard + Meal Planner.
import AppShell from "./components/AppShell";

// Styles for SpaceByte authentication screens.
import "./auth.css";

function App() {
  
  // ===================================================
  //                    REACT STATE
  // ===================================================

  // Track the screen currently displayed.
  // Possible values: login, signup, forgot, reset.
  const [page, setPage] = useState("login");

  // Store registration and login form values.
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Store the signed-in Firebase user.
  const [user, setUser] = useState(null);

  // Store success messages and error messages.
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Prevent repeated submissions while loading.
  const [loading, setLoading] = useState(false);

  // "I agree to the Terms and Privacy Policy" checkbox on sign-up.
  const [agreed, setAgreed] = useState(false);

  // ===========================================
  //       BACKEND CONNECTION STATE
  // ===========================================

  // Stores the profile returned by the backend.
  const [backendProfile, setBackendProfile] = useState(null);

  // Tracks whether the backend request is in progress.
  const [backendLoading, setBackendLoading] = useState(false);

  // Stores backend connection or authentication errors.
  const [backendError, setBackendError] = useState("");

  // ===================================================
  //                PASSWORD RESET STATE
  // ===================================================

  // Store the new password and its confirmation.
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  // Store the email associated with the reset request.
  const [resetEmail, setResetEmail] = useState("");

  // Store the one-time Firebase password reset code.
  const [resetCode, setResetCode] = useState("");

  // Only true after Firebase verifies the reset code.
  const [resetCodeValid, setResetCodeValid] = useState(false);

  // ===================================================
  //          MONITOR FIREBASE LOGIN STATUS
  // ===================================================

  useEffect(() => {
    // Listen for login, logout, and authentication changes.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Remove the listener when the component unmounts.
    return () => unsubscribe();
  }, []);

// ===================================================
//       CONNECT FIREBASE USER TO BACKEND
// ===================================================

// When Firebase identifies a signed-in user, request that user's profile from the backend.
useEffect(() => {
  // If nobody is signed in, clear backend information.
  if (!user) {
    setBackendProfile(null);
    setBackendError("");
    setBackendLoading(false);
    return;
  }

  // Prevent an old request from updating the UI
  // if the user signs out or changes accounts.
  let cancelled = false;

  async function loadBackendProfile() {
    setBackendLoading(true);
    setBackendError("");

    try {
      // Obtain a Firebase ID token for this user.
      const token = await user.getIdToken();

      // Request the protected profile endpoint.
      const profile = await apiRequest("/users/profile", token);

      // Update state only if this request is still active.
      if (!cancelled) {
        setBackendProfile(profile);
      }
    } catch (error) {
      if (!cancelled) {
        setBackendError(error.message);
        setBackendProfile(null);
      }
    } finally {
      if (!cancelled) {
        setBackendLoading(false);
      }
    }
  }

  loadBackendProfile();

  // Clean up if the authenticated user changes.
  return () => {
    cancelled = true;
  };
}, [user]);

  // ===================================================
  //       DETECT AND VERIFY A RESET LINK
  // ===================================================

  useEffect(() => {
    // Read Firebase's password-reset parameters from the URL.
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const code = params.get("oobCode");

    // Do nothing when this is not a password-reset link.
    if (mode !== "resetPassword") {
      return;
    }

    // Open the reset screen immediately.
    setPage("reset");
    setMessage("");
    setError("");
    setResetCodeValid(false);

    // A reset code is required.
    if (!code) {
      setError(
        "This reset link is missing its security code. Please request a new link."
      );
      return;
    }

    let active = true;

    // Verify the code before displaying the new-password form.
    async function verifyResetLink() {
      setLoading(true);

      try {
        // Firebase validates the code and returns the account email.
        const accountEmail = await verifyPasswordResetCode(
          auth,
          code
        );

        // Avoid updating state if the component has unmounted.
        if (!active) return;

        setResetCode(code);
        setResetEmail(accountEmail);
        setEmail(accountEmail);
        setResetCodeValid(true);
        setError("");
      } catch (err) {
        if (!active) return;

        console.error("Password reset verification failed:", err);

        setResetCodeValid(false);

        if (err.code === "auth/expired-action-code") {
          setError(
            "This reset link has expired. Please request a new one."
          );
        } else if (err.code === "auth/invalid-action-code") {
          setError(
            "This reset link is invalid or has already been used. Please request a new one."
          );
        } else {
          setError(
            "We couldn't verify this reset link. Please request a new one."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    verifyResetLink();

    // Prevent state updates after the component unmounts.
    return () => {
      active = false;
    };
  }, []);

  // ===================================================
  //       SWITCH BETWEEN AUTHENTICATION SCREENS
  // ===================================================

  function changePage(nextPage) {
    // Display the requested screen.
    setPage(nextPage);

    // Clear messages from the previous screen.
    setMessage("");
    setError("");

    // Clear login and signup password fields.
    setPassword("");
    setConfirmPassword("");
  }

  // ===================================================
  //             CREATE A NEW USER ACCOUNT
  // ===================================================

  async function handleSignUp(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    // Require the user's full name.
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    // Check the minimum password length.
    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    // The user must accept the Terms and Privacy Policy.
    if (!agreed) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    // Make sure the passwords match.
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Create the Firebase Authentication account.
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Save the user's full name to their Firebase profile.
      await updateProfile(credential.user, {
        displayName: fullName.trim(),
      });

      setMessage("Your account was created successfully!");

      // Clear password fields after registration.
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  //              LOG IN AN EXISTING USER
  // ===================================================

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      setLoading(true);

      // Authenticate the user with Firebase.
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // The authentication listener updates the user state.
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  //             SEND A PASSWORD RESET EMAIL
  // ===================================================

  async function handleForgotPassword(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    // Require an email address.
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    try {
      setLoading(true);

      // Firebase sends the password reset email.
      await sendPasswordResetEmail(auth, email.trim(), {
        url: "http://localhost:5174",
        handleCodeInApp: false,
      });

      // Use neutral wording to protect account privacy.
      setMessage(
        "If an account exists for this email, a password reset email has been requested. Check your inbox and spam folder."
      );
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  //          SAVE THE USER'S NEW PASSWORD
  // ===================================================

  async function handleResetPasswordSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    // Require a verified Firebase reset code.
    if (!resetCodeValid || !resetCode) {
      setError(
        "This reset link is not valid. Please request a new password reset email."
      );
      return;
    }

    // Check the minimum password length.
    if (newPassword.length < 6) {
      setError(
        "Your new password must contain at least 6 characters."
      );
      return;
    }

    // Ensure the password confirmation matches.
    if (newPassword !== confirmNewPassword) {
      setError("Your new passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Update the password using Firebase's verified reset code.
      await confirmPasswordReset(
        auth,
        resetCode,
        newPassword
      );

      // Preserve the account email for the next login.
      setEmail(resetEmail);

      // Clear passwords and the one-time reset code.
      setNewPassword("");
      setConfirmNewPassword("");
      setResetCode("");
      setResetCodeValid(false);

      // Remove the reset code from the address bar.
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      // Return to login after the password is successfully changed.
      setPage("login");

      setMessage(
        "Your password has been reset successfully. Please sign in with your new password."
      );
    } catch (err) {
      console.error("Password reset failed:", err);

      if (err.code === "auth/expired-action-code") {
        setError(
          "This reset link has expired. Please request a new one."
        );
      } else if (err.code === "auth/invalid-action-code") {
        setError(
          "This reset link is invalid or has already been used. Please request a new one."
        );
      } else if (err.code === "auth/weak-password") {
        setError("Please choose a stronger password.");
      } else {
        setError(
          err.message ||
            "We couldn't reset your password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  //      CONVERT FIREBASE ERRORS INTO MESSAGES
  // ===================================================

  function getFriendlyError(err) {
    switch (err.code) {
      case "auth/email-already-in-use":
        return "An account already exists with this email. Please log in.";

      case "auth/invalid-email":
        return "Please enter a valid email address.";

      case "auth/weak-password":
        return "Please choose a stronger password.";

      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "The email or password is incorrect.";

      case "auth/too-many-requests":
        return "Too many attempts. Please wait and try again.";

      case "auth/api-key-not-valid":
      case "auth/invalid-api-key":
        return "Firebase rejected the API key. Check your Firebase configuration.";

      case "auth/network-request-failed":
        return "Network error. Check your internet connection.";

      default:
        console.error("Firebase error:", err);
        return err.message || "Something went wrong. Please try again.";
    }
  }

  // ===================================================
  //             SIGNED-IN USER DASHBOARD
  // ===================================================

  // Show the dashboard + meal planner to signed-in users,
  // except when they are processing a password-reset link.
  if (user && page !== "reset") {
    return (
      <AppShell
        user={user}
        onSignOut={async () => {
          try {
            await signOut(auth);
            setMessage("");
            setError("");
          } catch (err) {
            setError(getFriendlyError(err));
          }
        }}
      />
    );
  }

  // ===================================================
  //             AUTHENTICATION PAGE LAYOUT
  // ===================================================

  // Sign-up uses a different hero panel than the other screens.
  const isSignup = page === "signup";

  return (
    <main className="auth-page">
      <div className="auth-shell">

        {/* ---------- LEFT: hero panel ---------- */}
        <aside className={`auth-hero ${isSignup ? "hero-signup" : "hero-login"}`}>
          <div className="auth-logo">
            <span className="auth-logo-mark">✦</span>
            <span className="auth-logo-text">
              Space<b>Byte</b>
            </span>
          </div>

          {!isSignup && (
            <div className="auth-tagline">
              <h2>Fuel your mission.</h2>
              <p>
                Personalized nutrition for wherever
                <br />
                your mission takes you.
              </p>
              <small>EARTH · ISS · MOON</small>
            </div>
          )}
        </aside>

        {/* ---------- RIGHT: form panel ---------- */}
        <section className="auth-panel">

          {/* ===========================================
              LOGIN SCREEN
          =========================================== */}

          {page === "login" && (
            <>
              <p className="auth-caption">
                Sign in to continue to SpaceByte
              </p>

              <form onSubmit={handleLogin}>
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>

                <div className="forgot-row">
                  <button
                    type="button"
                    className="text-button muted"
                    onClick={() => changePage("forgot")}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>

              <p className="switch-page">
                New to SpaceByte?{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => changePage("signup")}
                >
                  Create account
                </button>
              </p>
            </>
          )}

          {/* ===========================================
              SIGN-UP SCREEN
          =========================================== */}

          {page === "signup" && (
            <>
              <h2 className="auth-title">Create Account</h2>

              <form onSubmit={handleSignUp}>
                <label htmlFor="signup-name">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />

                <label htmlFor="signup-email">Email Address</label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />

                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={6}
                  required
                />

                <label className="terms-row" htmlFor="agree-terms">
                  <input
                    id="agree-terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                  />
                  <span>
                    I agree to the{" "}
                    <a href="#terms" onClick={(e) => e.preventDefault()}>Terms</a>{" "}
                    and{" "}
                    <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                  </span>
                </label>

                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <p className="switch-page">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => changePage("login")}
                >
                  Sign In
                </button>
              </p>
            </>
          )}

          {/* ===========================================
              FORGOT PASSWORD SCREEN
          =========================================== */}

          {page === "forgot" && (
            <>
              <h2 className="auth-title">Reset Password</h2>

              <p className="auth-caption">
                Enter the email address for your account and we'll send a
                reset link.
              </p>

              <form onSubmit={handleForgotPassword}>
                <label htmlFor="reset-email">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <p className="switch-page">
                Remember your password?{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => changePage("login")}
                >
                  Back to Login
                </button>
              </p>
            </>
          )}

          {/* ===========================================
              RESET PASSWORD SCREEN
          =========================================== */}

          {page === "reset" && (
            <>
              <h2 className="auth-title">New Password</h2>

              <p className="auth-caption">
                {resetEmail
                  ? `Choose a new password for ${resetEmail}.`
                  : "Verifying your password reset link..."}
              </p>

              {error && <p className="error-message">{error}</p>}
              {message && <p className="success-message">{message}</p>}

              {loading && !resetCodeValid && (
                <p className="auth-caption">Verifying your reset link...</p>
              )}

              {resetCodeValid && (
                <form onSubmit={handleResetPasswordSubmit}>
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={6}
                    required
                  />

                  <label htmlFor="confirm-new-password">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter your new password again"
                    value={confirmNewPassword}
                    onChange={(event) =>
                      setConfirmNewPassword(event.target.value)
                    }
                    minLength={6}
                    required
                  />

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Saving Password..." : "Save New Password"}
                  </button>
                </form>
              )}

              {!loading && !resetCodeValid && error && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    window.history.replaceState(
                      {},
                      document.title,
                      window.location.pathname
                    );
                    setResetCode("");
                    setResetCodeValid(false);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setEmail(resetEmail || email);
                    changePage("forgot");
                  }}
                >
                  Request a New Reset Link
                </button>
              )}

              <p className="switch-page">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    window.history.replaceState(
                      {},
                      document.title,
                      window.location.pathname
                    );
                    setResetCode("");
                    setResetCodeValid(false);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    changePage("login");
                  }}
                >
                  Back to Login
                </button>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

// Export App so main.jsx can render it.
export default App;

