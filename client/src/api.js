// Set VITE_API_URL when the client is hosted separately from the API (e.g. static hosting).
const BASE = import.meta.env?.VITE_API_URL || '';

/**
 * Small fetch wrapper. Throws Error with `.status`.
 * `.offline = true` means the API could not be reached at all (network error or a
 * non-JSON answer such as a static host's 404 page), so callers can fall back to demo data.
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
    throw Object.assign(new Error('Could not reach the server'), { offline: true, status: 0 });
  }
  const data = await r.json().catch(() => null);
  if (data === null) throw Object.assign(new Error('Could not reach the server'), { offline: true, status: r.status });
  if (!r.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { status: r.status });
  return data;
}
