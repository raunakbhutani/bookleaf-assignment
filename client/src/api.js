/**
 * Small API client that consistently sends the auth token and turns non-2xx
 * API responses into useful Error messages for UI feedback.
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/** Calls one REST endpoint using the logged-in demo token when available. */
export async function api(path, options = {}) {
  const token = localStorage.getItem("bookleaf-token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || "Request failed.");
  return body;
}

/** Opens the authenticated event stream used to refresh data after ticket edits. */
export function eventsUrl() {
  return `${API_URL}/events`;
}
