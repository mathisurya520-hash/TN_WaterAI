const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://tn-waterai.onrender.com";

export function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  return fetch(url, options);
}
