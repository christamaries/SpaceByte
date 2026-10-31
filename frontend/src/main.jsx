

/*
===========================================================
 SPACEBYTE - REACT APPLICATION ENTRY POINT
 File: frontend/src/main.jsx

 PURPOSE:
 This file starts the SpaceByte React frontend application.

 RESPONSIBILITIES:
 1. Import React and its required components.
 2. Import the React DOM rendering function.
 3. Load the global CSS stylesheet.
 4. Import the main App component.
 5. Create an Error Boundary to catch React rendering errors.
 6. Render the application inside the HTML root element.
===========================================================
*/

// Import Component so we can create a class-based Error Boundary.
// Import StrictMode to help identify potential React issues
// during development.
import { Component, StrictMode } from "react";

// Import createRoot to render the React application
// inside the root HTML element.
import { createRoot } from "react-dom/client";

// Import the global stylesheet.
// This provides the basic styling for the entire application.
import "./index.css";

// Import the main SpaceByte application component.
// App.jsx manages authentication, landing page navigation,
// and access to the Crew Dashboard.
import App from "./App.jsx";

// -----------------------------------------------------------
// ERROR BOUNDARY
// -----------------------------------------------------------

// An Error Boundary catches rendering errors in child React
// components so the entire application does not display
// a blank screen when a component crashes.
//
// This is especially useful during development and debugging.
class ErrorBoundary extends Component {

  // Initial state contains no error.
  // The error value becomes populated if a child component crashes.
  state = { error: null };

  // React automatically calls this method when a child component
  // throws an error during rendering.
  //
  // The returned value updates the component state.
  static getDerivedStateFromError(error) {
    return { error };
  }

  // Determines what should be displayed on the screen.
  render() {

    // If a React error was caught, display the error message
    // and stack trace instead of rendering the crashed component.
    if (this.state.error) {
      return (
        <pre
          style={{
            color: "#ff8fb8",
            background: "#111",
            padding: 20,
            whiteSpace: "pre-wrap"
          }}
        >
          {
            "React crashed:\n\n" +
            String(this.state.error?.stack || this.state.error)
          }
        </pre>
      );
    }

    // If no error occurred, render the child components normally.
    return this.props.children;
  }
}

// -----------------------------------------------------------
// RENDER THE SPACEBYTE APPLICATION
// -----------------------------------------------------------

// Find the HTML element with the ID "root".
// React uses this element as the container for the frontend.
createRoot(document.getElementById("root")).render(

  // StrictMode helps identify potential problems in React.
  // In development, it may intentionally run certain lifecycle
  // operations more than once to reveal unsafe behavior.
  <StrictMode>

    
    <ErrorBoundary>

      {/* Render the main SpaceByte application. */}
      <App />

    </ErrorBoundary>

  </StrictMode>
);
