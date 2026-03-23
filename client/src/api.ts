export const TOKEN_KEY = "edu_jwt";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function authHeaders(): HeadersInit {
  const token = getStoredToken();
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function authFetch(
  apiBase: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body != null && !headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${apiBase}${path}`, { ...init, headers });
}
