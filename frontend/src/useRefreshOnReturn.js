/*
===========================================================
 SPACEBYTE - REFRESH WHEN RETURNING TO THE PAGE
 File: frontend/src/useRefreshOnReturn.js

 PURPOSE:
 Reloads a page's data when the user comes back to the
 browser tab or window, so changes made elsewhere (for
 example, a teammate updating the shared inventory) appear
 without a Refresh button.

 USED BY:
 - dashboard.jsx
 - Inventory.jsx
 - Nutrition.jsx
 - mealPlanner.jsx
===========================================================
*/

import { useEffect, useRef } from "react";


// Ignore returns that happen within this many milliseconds
// of the last refresh, so quickly switching windows does
// not send a burst of requests.
const MIN_INTERVAL_MS = 5000;


// Calls refresh() whenever the page becomes visible again
// or the browser window regains focus.
//
// @param {Function} refresh - Reloads the page's data.
//        It should refresh quietly (without a loading screen).
export function useRefreshOnReturn(refresh) {

  // Keep the latest refresh function without re-adding listeners.
  const refreshRef = useRef(refresh);
  const lastRunRef = useRef(0);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    // The page has just loaded its data, so count that as a refresh.
    lastRunRef.current = Date.now();

    function handleReturn() {
      // Only refresh when the tab is actually visible.
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastRunRef.current < MIN_INTERVAL_MS) return;

      lastRunRef.current = now;
      refreshRef.current();
    }

    document.addEventListener("visibilitychange", handleReturn);
    window.addEventListener("focus", handleReturn);

    return () => {
      document.removeEventListener("visibilitychange", handleReturn);
      window.removeEventListener("focus", handleReturn);
    };
  }, []);
}
