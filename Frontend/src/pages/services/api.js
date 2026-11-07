// /api được Vite proxy sang https://localhost:7151 khi chạy npm run dev.
const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const TOKEN_KEY = 'hue_dev_bearer_token';
export function getApiToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}
export function setApiToken(value) {
  const token = (value || '').replace(/^Bearer\s+/i, '').trim();
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}
export async function apiRequest(path, { auth = false, body, headers = {}, ...options } = {}) {
  const token = getApiToken();
  if (auth && !token) throw new Error('Chưa có Bearer token quản trị.');
  const requestHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined && !(body instanceof FormData)) requestHeaders['Content-Type'] = 'application/json';
  if (auth) requestHeaders.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      headers: requestHeaders,
      ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }),
    });
  } catch {
    throw new Error('Không kết nối được backend. Kiểm tra API, chứng chỉ HTTPS và Vite proxy.');
  }
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 401) throw new Error('401: Chưa đăng nhập hoặc Bearer token không hợp lệ.');
    if (response.status === 403) throw new Error('403: Tài khoản không có quyền quản trị.');
    throw new Error(`API ${response.status}: ${detail.slice(0, 300)}`);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('json') ? response.json() : response.text();
}
