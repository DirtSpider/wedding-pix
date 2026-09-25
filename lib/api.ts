// The deploy tool rewrites __PORT_3000__ to a proxy path (e.g. "port/3000")
// that forwards API calls to the backend server on port 3000.
// In local dev, the placeholder stays intact and we use same-origin (empty string).
const placeholder = "__PORT_3000__";
export const API_BASE = placeholder.startsWith("__") ? "" : placeholder;
