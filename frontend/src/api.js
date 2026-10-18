
// SpaceByte API Helper
// Sends requests from React to the Express backend.
// Automatically attaches the Firebase ID token so protected backend routes can verify the signed-in user.


// Backend address.
// You can override this using the frontend .env file.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

// Send an authenticated request to the backend.
// path: API endpoint, such as "/users/profile"
// token: Firebase ID token for the signed-in user
// options: fetch options such as method and body
 
export async function apiRequest(path, token, options = {}) {
  // Start with any headers provided by the caller.
  const headers = { ...(options.headers || {}) };

  // Add JSON content type when sending a request body.
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Attach the Firebase ID token for authentication.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Send the request to the Express backend.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Read the response without assuming it is always JSON.
  const responseText = await response.text();
  let data = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  // Turn failed HTTP responses into useful error messages.
  if (!response.ok) {
    const errorMessage =
      data?.message ||
      data?.error ||
      `Backend request failed: ${response.status}`;

    throw new Error(errorMessage);
  }

  // Return the backend's response to the React component.
  return data;
}
