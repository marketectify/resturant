// Set VITE_API_URL when the client is hosted separately from the API (e.g. static hosting).
import { demoCall } from './demo.js';

const BASE = import.meta.env?.VITE_API_URL || '';

/**
 * Small fetch wrapper. Throws Error with `.status`.
 * When the API cannot be reached at all (network error, or a non-JSON answer such as a static host's
 * 404 page) the call is answered by the in-browser demo backend (demo.js) instead, so the site still works.
 */
export async function api(url, { method = 'GET', body, token } = {}) {
  let r;
  try {
    r = await fetch(BASE + url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { 'x-token': token }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return demoCall(url, { method, body, token });
  }
  const data = await r.json().catch(() => null);
  if (data === null) return demoCall(url, { method, body, token });
  if (!r.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { status: r.status });
  return data;
}
