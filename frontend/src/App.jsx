
// SpaceByte - Authentication Frontend
// This file manages the website's:
// 1. Login screen
// 2. Sign-up screen
// 3. Forgot-password screen
// 4. Signed-in user dashboard
 
// React controls the screens and form inputs.
// Firebase Authentication manages user accounts.


// Import React hooks.
// useState stores information that can change.
// useEffect runs code when the component loads or changes lifecycle.
import { useEffect, useState } from "react";

// Import Firebase Authentication functions.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
  confirmPasswordReset
} from "firebase/auth";

// Import the Firebase Authentication instance
// initialized in src/firebase.js.
import { auth } from "./firebase";

// Import the styles for the authentication screens.
import "./App.css";

function App() {

  // ===========================================
  //              REACT STATE
  // ===========================================

  // Track which screen the user currently sees.
  // "login", "signup", or "forgot".
  const [page, setPage] = useState("login");

  // Store the values entered into the form fields.
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Store the currently authenticated Firebase user.
  // null means no user is signed in.
  const [user, setUser] = useState(null);

  // Display success messages and errors on the page.
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Prevent duplicate form submissions while a request is running.
  const [loading, setLoading] = useState(false);

  // ===========================================
  //       PASSWORD RESET STATE
  // ===========================================

  // Store the new password entered on the reset page.
  const [newPassword, setNewPassword] = useState("");

  // Store the confirmation of the new password.
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Store the email address associated with the reset code.
  const [resetEmail, setResetEmail] = useState("");

  // Store Firebase's one-time password reset code.
  const [resetCode, setResetCode] = useState("");

  // Track whether Firebase has verified the reset code.
  const [resetCodeValid, setResetCodeValid] = useState(false);

  // ===============================================
  //        MONITOR FIREBASE LOGIN STATUS
  // ===============================================

  useEffect(() => {
    // Firebase calls this function when the login status changes.
    // For example, after login, signup, or logout.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Stop listening when this component is removed.
    return () => unsubscribe();
  }, []);

  // ===================================================
  //        SWITCH BETWEEN AUTHENTICATION SCREENS
  // ===================================================

  function changePage(nextPage) {
    // Change the screen displayed by React.
    setPage(nextPage);

    // Clear messages from the previous screen.
    setMessage("");
    setError("");

    // Clear password fields when changing screens.
    setPassword("");
    setConfirmPassword("");
  }

  // ===================================================
  //              CREATE A NEW USER ACCOUNT
  // ===================================================

  async function handleSignUp(event) {
    // Prevent the browser from reloading the page on submission.
    event.preventDefault();

    // Clear messages from previous attempts.
    setMessage("");
    setError("");

    // Require a full name.
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    // Firebase Email/Password Authentication requires
    // a password of at least six characters by default.
    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    // Make sure both password fields match.
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      // Show a loading state while Firebase creates the account.
      setLoading(true);

      // Create a Firebase Authentication account using email/password.
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Save the full name in the Firebase Authentication profile.
      // This does not automatically create a Firestore users document.
      await updateProfile(credential.user, {
        displayName: fullName.trim()
      });

      // Show confirmation after both operations succeed.
      setMessage("Your account was created successfully!");

      // Clear password fields after account creation.
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      // Convert the Firebase error into a readable message.
      setError(getFriendlyError(err));
    } finally {
      // Always stop showing the loading state.
      setLoading(false);
    }
  }

  // ===================================================
  //            LOG IN AN EXISTING USER
  // ===================================================

  async function handleLogin(event) {
    // Keep the form from refreshing the entire website.
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      setLoading(true);

      // Ask Firebase to authenticate the supplied credentials.
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // onAuthStateChanged detects the successful login
      // and updates the user state automatically.
    } catch (err) {
      // Display a helpful message if login fails.
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  //            SEND A PASSWORD RESET EMAIL
  // ===================================================

  async function handleForgotPassword(event) {
    // Prevent the default browser form submission.
    event.preventDefault();

    setMessage("");
    setError("");

    // The email address is needed to request a reset link.
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    try {
      setLoading(true);

      // Firebase sends a password reset email.
      // The user follows the link to choose a new password.
      await sendPasswordResetEmail(auth, email.trim());

      // Use neutral wording so the page does not reveal
      // whether a particular email has a registered account.
      setMessage(
        "If an account exists for this email, a password reset email has been requested. Check your inbox and spam folder."
      );
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  //    CONVERT FIREBASE ERRORS INTO READABLE MESSAGES
  // ======================================================

  function getFriendlyError(err) {
    // Firebase provides an error code for most authentication errors.
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
        return "Firebase rejected the API key. Check your Firebase configuration.";

      case "auth/network-request-failed":
        return "Network error. Check your internet connection.";

      default:
        // Log the full error for development troubleshooting.
        console.error("Firebase error:", err);

        // Display a fallback message.
        return err.message || "Something went wrong. Please try again.";
    }
  }

  // ===================================================
  //        SHOW THE DASHBOARD AFTER LOGIN
  //=====================================================

  // If Firebase confirms a signed-in user, show the dashboard
  // instead of the login and registration forms.
  if (user) {
    return (
      <main className="spacebyte-page">
        <section className="auth-card dashboard-card">

          {/* SpaceByte brand heading */}
          <div className="brand">
            <span className="brand-icon">✦</span>
            <h1>SpaceByte</h1>
          </div>

          {/* Show the user's saved display name, if available */}
          <h2>Welcome, {user.displayName || "SpaceByte user"}!</h2>

          <p className="subtitle">
            You are successfully signed in.
          </p>

          {/* Display the email of the authenticated account */}
          <p className="profile-email">{user.email}</p>

          {/* Sign out of Firebase Authentication */}
          <button
            className="primary-button"
            onClick={() => signOut(auth)}
          >
            Sign Out
          </button>
        </section>
      </main>
    );
  }

  // ===================================================
  //         AUTHENTICATION PAGE LAYOUT
  // ===================================================

  return (
    <main className="spacebyte-page">
      <section className="auth-card">

        {/* Brand displayed at the top of each authentication screen */}
        <div className="brand">
          <span className="brand-icon">✦</span>
          <h1>SpaceByte</h1>
        </div>

        <p className="subtitle">
          Smart food tracking for your everyday journey.
        </p>

        {
        
       // ===================================================
       //                 LOGIN SCREEN
       // ===================================================
       
       }

        {page === "login" && (
          <>
            <h2>Welcome Back!</h2>

            <p className="section-description">
              Sign in to your SpaceByte account.
            </p>

            <form onSubmit={handleLogin}>
              {/* Email field */}
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              {/* Password field */}
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

              {/* Open the password recovery screen */}
              <div className="forgot-row">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => changePage("forgot")}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Show errors or confirmation messages */}
              {error && <p className="error-message">{error}</p>}
              {message && <p className="success-message">{message}</p>}

              {/* Submit login credentials to Firebase */}
              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* Navigate to the registration screen */}
            <p className="switch-page">
              Don't have an account?{" "}
              <button
                className="text-button"
                onClick={() => changePage("signup")}
              >
                Sign Up
              </button>
            </p>
          </>
        )}

        {
        
        // ===================================================
        //                  SIGN-UP SCREEN
        // ===================================================
            
            }

        {page === "signup" && (
          <>
            <h2>Create Your Account</h2>

            <p className="section-description">
              Enter your information to get started.
            </p>

            <form onSubmit={handleSignUp}>
              {/* Full name for the user's Firebase profile */}
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

              {/* Email used to sign in and reset the password */}
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              {/* New account password */}
              <label htmlFor="signup-password">Create Password</label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />

              {/* Require the user to enter the password again */}
              <label htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                minLength={6}
                required
              />

              {/* Show registration errors and success messages */}
              {error && <p className="error-message">{error}</p>}
              {message && <p className="success-message">{message}</p>}

              {/* Create the Firebase Authentication account */}
              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Return to the login screen */}
            <p className="switch-page">
              Already have an account?{" "}
              <button
                className="text-button"
                onClick={() => changePage("login")}
              >
                Back to Login
              </button>
            </p>
          </>
        )}

        {
        
        // ===================================================
        //                FORGOT-PASSWORD SCREEN
        // ===================================================
            
            }

        {page === "forgot" && (
          <>
            <h2>Reset Your Password</h2>

            <p className="section-description">
              Enter the email address associated with your account.
              Firebase can send you a password reset link.
            </p>

            <form onSubmit={handleForgotPassword}>
              {/* Email address receiving the reset instructions */}
              <label htmlFor="reset-email">Email Address</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              {/* Display errors or password-reset confirmation */}
              {error && <p className="error-message">{error}</p>}
              {message && <p className="success-message">{message}</p>}

              {/* Request a reset email from Firebase */}
              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            {/* Allow the user to return to login */}
            <p className="switch-page">
              Remember your password?{" "}
              <button
                className="text-button"
                onClick={() => changePage("login")}
              >
                Back to Login
              </button>
            </p>
          </>
        )}

        {/* Footer displayed on all authentication screens */}
        <footer className="auth-footer">
          SpaceByte · Your food journey, simplified.
        </footer>
      </section>
    </main>
  );
}

// Make the App component available to main.jsx.
export default App;