
/*
===========================================================
 SPACEBYTE - AUTHENTICATION FRONTEND
===========================================================

 This file manages:
 1. Public landing page
 2. Login
 3. Sign-up
 4. Forgot Password
 5. Reset Password
 6. Terms of Service
 7. Privacy Policy
 8. Firebase authentication status
 9. Backend user-profile connection
 10. Signed-in dashboard
 11. NEW: Email verification (verify screen + resend)

 Password requirements:
 - At least 8 characters
 - At least one digit
 - At least one special character
 - At least one uppercase letter
 - At least one lowercase letter

 IMPORTANT:
 The Terms and Privacy Policy are student-project templates.
 Review them before deploying SpaceByte publicly.

 EMAIL VERIFICATION CHANGES (search for "NEW" or "CHANGED"):
 1. Import sendEmailVerification
 2. New state: emailVerified, verifySending
 3. Auth listener also tracks emailVerified
 4. Backend profile only loads once verified
 5. New polling effect that detects when the link was clicked
 6. handleSignUp sends the verification email
 7. New handlers: resend, check now, sign out from verify screen
 8. New "Verify Your Email" screen shown before the dashboard
*/

// =========================================================
//                        IMPORTS
// =========================================================

import { useEffect, useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification, // NEW: sends the verification link
  onAuthStateChanged,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

import { auth } from "./firebase";
import { apiRequest } from "./api";

// Existing authenticated dashboard.
import AppShell from "./components/AppShell";

// NEW: Public landing page.
// This path matches a file at src/components/landingPage.jsx.
// Keep the capitalization consistent with your actual filename.
import LandingPage from "./components/landingPage";

// Existing authentication styles.
import "./auth.css";


// =========================================================
//             PASSWORD VALIDATION HELPER
// =========================================================

function validatePassword(password) {
  return {
    minLength: password.length >= 8,
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
  };
}


// =========================================================
//                  PASSWORD EYE ICONS
// =========================================================

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a14.8 14.8 0 0 1-3.1 3.9" />
      <path d="M6.2 6.2C3.5 8.1 2 12 2 12s3.6 7 10 7a10.4 10.4 0 0 0 4-.8" />
    </svg>
  );
}


// =========================================================
//                      MAIN APP
// =========================================================

function App() {

  // NEW: Start at the public landing page.
  //
  // Available page values:
  // landing, login, signup, forgot, reset, terms, privacy.
  //
  // Firebase authentication determines whether the user
  // sees this public page or the authenticated dashboard.
  const [page, setPage] = useState("landing");


  // =======================================================
  //                   FORM STATE
  // =======================================================

  // Login and sign-up fields.
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Firebase user and feedback messages.
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // NEW: Email verification state.
  // Firebase changes user.emailVerified IN PLACE after reload(),
  // which does not trigger a React re-render by itself. This
  // separate state value makes the screen update.
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifySending, setVerifySending] = useState(false);

  // Terms and Privacy Policy checkbox.
  const [agreed, setAgreed] = useState(false);

  // Password visibility settings.
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] =
    useState(false);

  // Live password checklist for sign-up.
  const passwordRules = validatePassword(password);

  // Backend profile information.
  const [backendProfile, setBackendProfile] = useState(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState("");

  // Password reset information.
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetCodeValid, setResetCodeValid] = useState(false);


  // =======================================================
  //          MONITOR FIREBASE AUTHENTICATION
  // =======================================================

  // Firebase tells React when the user signs in or out.
  // This also restores an existing Firebase session.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // NEW: Remember whether this user has verified their email.
      setEmailVerified(currentUser?.emailVerified ?? false);
    });

    return () => unsubscribe();
  }, []);


  // =======================================================
  //      LOAD THE SIGNED-IN USER'S BACKEND PROFILE
  // =======================================================

  useEffect(() => {
    // CHANGED: Also wait for email verification. An unverified
    // user should not call the backend (the backend should
    // reject them anyway).
    if (!user || !emailVerified) {
      setBackendProfile(null);
      setBackendError("");
      setBackendLoading(false);
      return;
    }

    let cancelled = false;

    async function loadBackendProfile() {
      setBackendLoading(true);
      setBackendError("");

      try {
        // Firebase provides the token used by the Express backend.
        const token = await user.getIdToken();

        // This endpoint must require Firebase authentication.
        const profile = await apiRequest("/users/profile", token);

        if (!cancelled) {
          setBackendProfile(profile);
        }
      } catch (err) {
        if (!cancelled) {
          setBackendError(
            err.message || "Unable to load your user profile."
          );
          setBackendProfile(null);
        }
      } finally {
        if (!cancelled) {
          setBackendLoading(false);
        }
      }
    }

    loadBackendProfile();

    return () => {
      cancelled = true;
    };
  }, [user, emailVerified]); // CHANGED: added emailVerified


  // =======================================================
  //    NEW: DETECT WHEN THE USER VERIFIES THEIR EMAIL
  // =======================================================

  // While a signed-in user is unverified, check Firebase every
  // 5 seconds. When they click the link in their email (even
  // in another tab or on another device), this screen moves on
  // to the dashboard automatically.
  //
  // IMPORTANT: This effect must stay above every early
  // "return" in the component (React hooks rule).
  useEffect(() => {
    if (!user || emailVerified) return;

    const intervalId = setInterval(async () => {
      try {
        await user.reload();

        if (auth.currentUser?.emailVerified) {
          // Refresh the token so the backend sees
          // email_verified: true on the next request.
          await auth.currentUser.getIdToken(true);
          setEmailVerified(true);
        }
      } catch (err) {
        console.error("Verification check failed:", err);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user, emailVerified]);


  // =======================================================
  //      VERIFY A FIREBASE PASSWORD RESET LINK
  // =======================================================

  // IMPORTANT:
  // A Firebase reset link must take priority over the
  // landing page when the URL contains mode=resetPassword.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const code = params.get("oobCode");

    // Do nothing if this is not a Firebase password reset link.
    if (mode !== "resetPassword") {
      return;
    }

    setPage("reset");
    setMessage("");
    setError("");
    setResetCodeValid(false);

    if (!code) {
      setError(
        "This reset link is missing its security code. " +
        "Please request a new link."
      );
      return;
    }

    let active = true;

    async function verifyResetLink() {
      setLoading(true);

      try {
        const accountEmail = await verifyPasswordResetCode(auth, code);

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
          setError("This reset link has expired. Please request a new one.");
        } else if (err.code === "auth/invalid-action-code") {
          setError(
            "This reset link is invalid or has already been used. " +
            "Please request a new one."
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

    return () => {
      active = false;
    };
  }, []);


  // =======================================================
  //                    CHANGE SCREENS
  // =======================================================

  // Reuse this function for navigation between existing forms.
  function changePage(nextPage) {
    setPage(nextPage);
    setMessage("");
    setError("");

    // Clear passwords when switching forms.
    setPassword("");
    setConfirmPassword("");

    // Hide passwords when switching forms.
    setShowLoginPassword(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  }

  // Return from the legal pages to sign-up.
  // Preserve the agreement checkbox state.
  function returnToSignUp() {
    setPage("signup");
    setMessage("");
    setError("");
  }


  // =======================================================
  //            LANDING PAGE CALLBACKS
  // =======================================================

  // The LandingPage component receives these functions
  // through its props. This keeps the landing page independent
  // of the authentication implementation.

  // Header: "Sign in"
  function handleLandingSignIn() {
    changePage("login");
  }

  // Header: "Create account"
  function handleLandingCreateAccount() {
    changePage("signup");
  }

  // Hero: "Start planning"
  // Signed-out visitors must sign in before accessing the
  // authenticated dashboard and its planning functionality.
  function handleStartPlanning() {
    changePage("login");
  }

  // Hero: "Tour the galley"
  // Scroll to the meal planner preview on the landing page.
  function handleTourGalley() {
    document.getElementById("meal-planner")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }


  // =======================================================
  //                CREATE A NEW ACCOUNT
  // =======================================================

  async function handleSignUp(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    // Recheck all password requirements before Firebase.
    const rules = validatePassword(password);
    const allRulesPass = Object.values(rules).every(Boolean);

    if (!allRulesPass) {
      setError(
        "Your password must contain at least 8 characters, " +
        "one digit, one special character, one uppercase letter, " +
        "and one lowercase letter."
      );
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

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

      // Save the user's name to their Firebase Auth profile.
      await updateProfile(credential.user, {
        displayName: fullName.trim(),
      });

      // NEW: Send the verification email.
      // The "url" is where Firebase's "Continue" button sends the
      // user after they verify. It must match a domain listed in
      // Firebase Console > Authentication > Settings > Authorized
      // domains. Change it to your real domain when you deploy.
      await sendEmailVerification(credential.user, {
        url: "http://localhost:5173",
      });

      // CHANGED: Previously this said "Your account was created
      // successfully!". The Verify Your Email screen now replaces
      // the form, so no message is needed here.
      setMessage("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }


  // =======================================================
  //                      LOG IN
  // =======================================================

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // The Firebase auth listener updates the user state.
      // The authenticated-dashboard condition below then
      // renders AppShell.
      //
      // NEW: If the email is not verified yet, the Verify Your
      // Email screen is shown instead of AppShell.
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }


  // =======================================================
  //     NEW: EMAIL VERIFICATION HANDLERS
  // =======================================================

  // "Resend verification email" button.
  async function handleResendVerification() {
    setMessage("");
    setError("");

    try {
      setVerifySending(true);

      await sendEmailVerification(auth.currentUser, {
        url: "http://localhost:5173",
      });

      setMessage(
        "Verification email sent. Check your inbox and spam folder."
      );
    } catch (err) {
      // getFriendlyError already handles auth/too-many-requests.
      setError(getFriendlyError(err));
    } finally {
      setVerifySending(false);
    }
  }

  // "I've Verified My Email" button: check right now instead of
  // waiting for the 5-second automatic check.
  async function handleCheckVerified() {
    setMessage("");
    setError("");

    try {
      setLoading(true);

      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        // Refresh the token so the backend sees email_verified: true.
        await auth.currentUser.getIdToken(true);
        setEmailVerified(true);
      } else {
        setError(
          "Your email isn't verified yet. Click the link in the " +
          "email we sent, then try again."
        );
      }
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // "Use a different account" button on the verify screen.
  async function handleVerifySignOut() {
    try {
      await signOut(auth);
      setMessage("");
      setError("");
      setPage("login");
    } catch (err) {
      setError(getFriendlyError(err));
    }
  }


  // =======================================================
  //            SEND PASSWORD RESET EMAIL
  // =======================================================

  async function handleForgotPassword(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, email.trim(), {
        url: "http://localhost:5173",
        handleCodeInApp: false,
      });

      setMessage(
        "If an account exists for this email, a password reset email " +
        "has been requested. Check your inbox and spam folder."
      );
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }


  // =======================================================
  //                SAVE THE NEW PASSWORD
  // =======================================================

  async function handleResetPasswordSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!resetCodeValid || !resetCode) {
      setError(
        "This reset link is not valid. Please request a new password reset email."
      );
      return;
    }

    const resetRules = validatePassword(newPassword);
    const resetPasswordIsValid = Object.values(resetRules).every(Boolean);

    if (!resetPasswordIsValid) {
      setError(
        "Your new password must contain at least 8 characters, " +
        "one digit, one special character, one uppercase letter, " +
        "and one lowercase letter."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Your new passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await confirmPasswordReset(auth, resetCode, newPassword);

      setEmail(resetEmail);
      setNewPassword("");
      setConfirmNewPassword("");
      setResetCode("");
      setResetCodeValid(false);

      // Remove reset parameters from the address bar.
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      setPage("login");
      setMessage(
        "Your password has been reset successfully. " +
        "Please sign in with your new password."
      );
    } catch (err) {
      console.error("Password reset failed:", err);

      if (err.code === "auth/expired-action-code") {
        setError("This reset link has expired. Please request a new one.");
      } else if (err.code === "auth/invalid-action-code") {
        setError(
          "This reset link is invalid or has already been used. " +
          "Please request a new one."
        );
      } else if (err.code === "auth/weak-password") {
        setError("Please choose a stronger password.");
      } else {
        setError(
          err.message || "We couldn't reset your password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }


  // =======================================================
  //        FRIENDLY FIREBASE ERROR MESSAGES
  // =======================================================

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


  // =======================================================
  //     NEW: VERIFY YOUR EMAIL SCREEN
  // =======================================================

  // A user who is signed in but has NOT verified their email
  // sees this screen instead of the dashboard.
  //
  // This block MUST stay above the signed-in dashboard block
  // below, so unverified users never reach AppShell.
  //
  // Exception: keep the password reset form available.
  if (user && !emailVerified && page !== "reset") {
    return (
      <main className="auth-page">
        <div className="auth-shell">

          {/* LEFT SIDE: SPACEBYTE BRANDING */}
          <aside className="auth-hero hero-login">
            <div className="auth-logo">
              <span className="auth-logo-mark">✦</span>
              <span className="auth-logo-text">
                Space<b>Byte</b>
              </span>
            </div>
          </aside>

          {/* RIGHT SIDE: VERIFY INSTRUCTIONS */}
          <section className="auth-panel">
            <h2 className="auth-title">Verify Your Email</h2>

            <p className="auth-caption">
              We sent a verification link to <b>{user.email}</b>.
              Click it to activate your account. This page will
              continue automatically. Check your spam folder if
              you don't see it.
            </p>

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className="success-message" role="status">
                {message}
              </p>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={handleCheckVerified}
              disabled={loading}
            >
              {loading ? "Checking..." : "I've Verified My Email"}
            </button>

            <p className="switch-page">
              <button
                type="button"
                className="text-button"
                onClick={handleResendVerification}
                disabled={verifySending}
              >
                {verifySending ? "Sending..." : "Resend verification email"}
              </button>
            </p>

            <p className="switch-page">
              <button
                type="button"
                className="text-button"
                onClick={handleVerifySignOut}
              >
                Use a different account
              </button>
            </p>
          </section>
        </div>
      </main>
    );
  }


  // =======================================================
  //                  SIGNED-IN DASHBOARD
  // =======================================================

  // Authenticated users see the existing dashboard.
  //
  // NEW: Because the verify screen above returns first,
  // only VERIFIED users reach this block. No change needed.
  //
  // Exception: if the page is "reset", keep the reset form
  // available even when a Firebase user session exists.
  if (user && page !== "reset") {
    return (
      <>
        {backendLoading && (
          <p className="backend-status">
            Connecting to your SpaceByte profile...
          </p>
        )}

        {backendError && (
          <p className="error-message backend-error">
            Backend profile: {backendError}
          </p>
        )}

        <AppShell
          user={user}
          onSignOut={async () => {
            try {
              // Sign the user out of Firebase.
              await signOut(auth);

              // Clear old feedback and profile information.
              setMessage("");
              setError("");
              setBackendProfile(null);
              setBackendError("");

              // NEW: Return to the public landing page.
              setPage("landing");
            } catch (err) {
              setError(getFriendlyError(err));
            }
          }}
        />
      </>
    );
  }


  // =======================================================
  //               PUBLIC LANDING PAGE
  // =======================================================

  // Display the landing page only when:
  // 1. There is no signed-in Firebase user.
  // 2. The selected page is "landing".
  //
  // This condition comes AFTER the authenticated dashboard
  // condition, so signed-in users still reach AppShell.
  if (!user && page === "landing") {
    return (
      <LandingPage
        // Connect the landing page's Sign in button.
        onSignIn={handleLandingSignIn}

        // Connect the landing page's Create account button.
        onCreateAccount={handleLandingCreateAccount}

        // Connect the landing page's Start planning button.
        onStartPlanning={handleStartPlanning}

        // Connect the landing page's Tour the galley button.
        onTourGalley={handleTourGalley}
      />
    );
  }


  // =======================================================
  //               AUTHENTICATION PAGE
  // =======================================================

  // These values control the existing authentication layout.
  const isSignup = page === "signup";
  const isLegalPage = page === "terms" || page === "privacy";

  return (
    <main className="auth-page">
      <div className="auth-shell">

        {/* LEFT SIDE: SPACEBYTE BRANDING */}
        <aside
          className={`auth-hero ${
            isSignup ? "hero-signup" : "hero-login"
          }`}
        >
          <div className="auth-logo">
            <span className="auth-logo-mark">✦</span>
            <span className="auth-logo-text">
              Space<b>Byte</b>
            </span>
          </div>

          {!isSignup && !isLegalPage && (
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


        {/* RIGHT SIDE: FORMS OR LEGAL PAGES */}
        <section
          className={`auth-panel ${
            isLegalPage ? "legal-panel" : ""
          }`}
        >

          {/* ================================================
                       TERMS OF SERVICE PAGE
             ================================================ */}

          {page === "terms" && (
            <article className="legal-content">
              <h1 className="auth-title">Terms of Service</h1>
              <p className="legal-updated">
                Last updated: October 19, 2026
              </p>

              <p>
                Welcome to SpaceByte. SpaceByte is a food inventory and
                nutrition-planning project designed to demonstrate how
                users can track food supplies, expiration dates, meals,
                and estimated nutrition information.
              </p>

              <h2>1. Acceptance of These Terms</h2>
              <p>
                By creating an account or using SpaceByte, you acknowledge
                that you have read these Terms. If you do not agree, do not
                create an account or use the application.
              </p>

              <h2>2. Intended Use</h2>
              <p>
                SpaceByte is intended to support food inventory tracking,
                meal planning, and educational demonstrations. You agree
                to use the application lawfully and not to attempt to
                access another person's account or data.
              </p>

              <h2>3. Accounts and Security</h2>
              <p>
                You are responsible for providing accurate account
                information and protecting access to your account.
                Contact the project team if you believe your account
                has been accessed without your permission.
              </p>

              <h2>4. Food and Nutrition Information</h2>
              <p>
                Food quantities, expiration dates, calorie totals, and
                nutrition estimates may be incomplete or inaccurate.
                Do not rely on SpaceByte as the sole source for food
                safety, allergy decisions, medical needs, or nutritional
                treatment. SpaceByte does not replace advice from a
                qualified healthcare professional or food-safety expert.
              </p>

              <h2>5. Availability and Changes</h2>
              <p>
                Features may change as the project is developed.
                SpaceByte may be unavailable during maintenance or
                development. We cannot guarantee that every feature
                or record will always be available.
              </p>

              <h2>6. Project Status</h2>
              <p>
                SpaceByte is a developing project. Do not use it as
                the only record of important inventory, dietary, or
                operational information.
              </p>

              <h2>7. Limitation</h2>
              <p>
                To the extent permitted by applicable law, SpaceByte is
                provided for educational and informational use without
                a guarantee that all information will be complete,
                current, or error-free.
              </p>

              <h2>8. Updates to These Terms</h2>
              <p>
                These Terms may be revised as the application changes.
                The date at the top indicates when this page was last
                updated.
              </p>

              <h2>9. Contact</h2>
              <p>
                For questions about these Terms, contact the SpaceByte
                project team through the contact method provided by
                your project or course.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={returnToSignUp}
              >
                Back to Create Account
              </button>
            </article>
          )}


          {/* ================================================
                         PRIVACY POLICY PAGE
             ================================================ */}

          {page === "privacy" && (
            <article className="legal-content">
              <h1 className="auth-title">Privacy Policy</h1>
              <p className="legal-updated">
                Last updated: October 19, 2026
              </p>

              <p>
                This Privacy Policy explains how SpaceByte may handle
                information when you use its food inventory, meal-planning,
                and nutrition features. Review this policy and update it
                to match the actual services and data practices used by
                your deployed application.
              </p>

              <h2>1. Information You Provide</h2>
              <p>
                Depending on the features you use, SpaceByte may process
                your name and email address, account identifier, food
                inventory entries, expiration dates, meal-planning
                information, and nutrition or consumption records you enter.
              </p>

              <h2>2. How Information Is Used</h2>
              <p>
                Information may be used to authenticate your account,
                display your profile, manage inventory, calculate or
                display nutrition estimates, support meal planning,
                troubleshoot errors, and improve the project.
              </p>

              <h2>3. Service Providers</h2>
              <p>
                SpaceByte uses Firebase Authentication for account
                authentication and an Express backend for application
                requests. Depending on your configuration, Firebase
                services may also store profile or application data.
                Review your actual Firebase and hosting configuration
                before publishing this policy.
              </p>

              <h2>4. Sharing of Information</h2>
              <p>
                Information may be processed by the services required
                to operate the application or disclosed when required
                by law. Update this section if the application shares
                data with additional services, collaborators, or other
                recipients.
              </p>

              <h2>5. Data Security</h2>
              <p>
                SpaceByte uses the security controls configured for its
                authentication, backend, database, and hosting services.
                No online system can be guaranteed to be completely
                secure. Never place service-account credentials, private
                API secrets, or passwords in frontend source code.
              </p>

              <h2>6. Data Retention and Deletion</h2>
              <p>
                Information may be retained while an account or project
                record remains active. Before publishing, document how
                users can request account or data deletion and make sure
                the process is implemented in the application and its
                connected services.
              </p>

              <h2>7. Children's Privacy</h2>
              <p>
                SpaceByte is not intended to collect personal information
                from children in violation of applicable privacy laws.
                If the project is made available to children, review the
                legal requirements that apply before collecting their data.
              </p>

              <h2>8. Changes to This Policy</h2>
              <p>
                This policy may be updated as SpaceByte's features,
                data storage, or service providers change. The date at
                the top indicates when this page was last updated.
              </p>

              <h2>9. Contact</h2>
              <p>
                For privacy questions, contact the SpaceByte project
                team through the contact method provided by your
                project or course.
              </p>

              <p className="legal-note">
                Student-project note: Do not enter real sensitive personal,
                medical, or dietary information into a demonstration
                environment unless the project has been reviewed and
                configured to handle that information appropriately.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={returnToSignUp}
              >
                Back to Create Account
              </button>
            </article>
          )}


          {/* ================================================
                              LOGIN SCREEN
             ================================================ */}

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

                <div className="password-input-wrapper">
                  <input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowLoginPassword((previous) => !previous)
                    }
                    aria-label={
                      showLoginPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showLoginPassword}
                  >
                    {showLoginPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {error && (
                  <p className="error-message" role="alert">
                    {error}
                  </p>
                )}

                {message && (
                  <p className="success-message" role="status">
                    {message}
                  </p>
                )}

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

              {/* NEW: Allow visitors to return to the homepage. */}
              <p className="switch-page">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => changePage("landing")}
                >
                  Back to Home
                </button>
              </p>
            </>
          )}


          {/* ================================================
                             SIGN-UP SCREEN
             ================================================ */}

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

                <div className="password-input-wrapper">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {/* Live password requirement checklist. */}
                <div className="password-requirements" aria-live="polite">
                  <p className="password-requirements-title">
                    Your password must contain:
                  </p>

                  <p className={passwordRules.minLength ? "rule-valid" : "rule-invalid"}>
                    {passwordRules.minLength ? "✓" : "○"} At least 8 characters
                  </p>

                  <p className={passwordRules.hasNumber ? "rule-valid" : "rule-invalid"}>
                    {passwordRules.hasNumber ? "✓" : "○"} At least one digit (0–9)
                  </p>

                  <p className={passwordRules.hasSpecial ? "rule-valid" : "rule-invalid"}>
                    {passwordRules.hasSpecial ? "✓" : "○"} At least one special character (!@#$)
                  </p>

                  <p className={passwordRules.hasUppercase ? "rule-valid" : "rule-invalid"}>
                    {passwordRules.hasUppercase ? "✓" : "○"} At least one uppercase letter (A–Z)
                  </p>

                  <p className={passwordRules.hasLowercase ? "rule-valid" : "rule-invalid"}>
                    {passwordRules.hasLowercase ? "✓" : "○"} At least one lowercase letter (a–z)
                  </p>
                </div>

                <label htmlFor="confirm-password">Confirm Password</label>

                <div className="password-input-wrapper">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {/* Legal links open the existing in-app pages. */}
                <label className="terms-row" htmlFor="agree-terms">
                  <input
                    id="agree-terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                  />

                  <span>
                    I agree to the{" "}
                    <a
                      href="#terms"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage("terms");
                        setMessage("");
                        setError("");
                      }}
                    >
                      Terms
                    </a>{" "}
                    and{" "}
                    <a
                      href="#privacy"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage("privacy");
                        setMessage("");
                        setError("");
                      }}
                    >
                      Privacy Policy
                    </a>
                  </span>
                </label>

                {error && (
                  <p className="error-message" role="alert">
                    {error}
                  </p>
                )}

                {message && (
                  <p className="success-message" role="status">
                    {message}
                  </p>
                )}

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

              {/* NEW: Return to the public landing page. */}
              <p className="switch-page">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => changePage("landing")}
                >
                  Back to Home
                </button>
              </p>
            </>
          )}


          {/* ================================================
                         FORGOT PASSWORD SCREEN
             ================================================ */}

          {page === "forgot" && (
            <>
              <h2 className="auth-title">Reset Password</h2>

              <p className="auth-caption">
                Enter the email address for your account and we'll
                send a reset link.
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

                {error && (
                  <p className="error-message" role="alert">
                    {error}
                  </p>
                )}

                {message && (
                  <p className="success-message" role="status">
                    {message}
                  </p>
                )}

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


          {/* ================================================
                          RESET PASSWORD SCREEN
             ================================================ */}

          {page === "reset" && (
            <>
              <h2 className="auth-title">New Password</h2>

              <p className="auth-caption">
                {resetEmail
                  ? `Choose a new password for ${resetEmail}.`
                  : "Verifying your password reset link..."}
              </p>

              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}

              {message && (
                <p className="success-message" role="status">
                  {message}
                </p>
              )}

              {loading && !resetCodeValid && (
                <p className="auth-caption">
                  Verifying your reset link...
                </p>
              )}

              {resetCodeValid && (
                <form onSubmit={handleResetPasswordSubmit}>
                  <label htmlFor="new-password">New Password</label>

                  <div className="password-input-wrapper">
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(event.target.value)
                      }
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowNewPassword((previous) => !previous)
                      }
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showNewPassword}
                    >
                      {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  <label htmlFor="confirm-new-password">
                    Confirm New Password
                  </label>

                  <div className="password-input-wrapper">
                    <input
                      id="confirm-new-password"
                      type={
                        showConfirmNewPassword ? "text" : "password"
                      }
                      autoComplete="new-password"
                      placeholder="Enter your new password again"
                      value={confirmNewPassword}
                      onChange={(event) =>
                        setConfirmNewPassword(event.target.value)
                      }
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmNewPassword((previous) => !previous)
                      }
                      aria-label={
                        showConfirmNewPassword
                          ? "Hide confirmation password"
                          : "Show confirmation password"
                      }
                      aria-pressed={showConfirmNewPassword}
                    >
                      {showConfirmNewPassword
                        ? <EyeOffIcon />
                        : <EyeIcon />}
                    </button>
                  </div>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Saving Password..." : "Save New Password"}
                  </button>
                </form>
              )}

              {/* Offer a new reset email if verification failed. */}
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


// =========================================================
//                    EXPORT APP
// =========================================================

export default App;
