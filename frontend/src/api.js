// Thin wrapper around fetch for the backend API (proxied at /api).

const TOKEN_KEY = 'ohm.token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode): the session lasts until reload.
  }
};

export class ApiError extends Error {
  constructor(status, message, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const fallbackMessage = (status) => {
  if (status === 401) return 'Your session has ended. Sign in again.';
  if (status === 403) return "Your account doesn't have access to this.";
  if (status === 404) return 'That item no longer exists.';
  if (status >= 500) return 'The store server ran into a problem. Try again in a moment.';
  return 'The request could not be completed.';
};

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the store server. Check that the API is running.");
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const fields = {};
    for (const err of data?.errors || []) {
      const key = err.path || err.param;
      if (key && !fields[key]) fields[key] = err.msg;
    }
    const message = data?.message || data?.errors?.[0]?.msg || fallbackMessage(res.status);
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event('ohm:signed-out'));
    }
    throw new ApiError(res.status, message, fields);
  }
  return data;
}
