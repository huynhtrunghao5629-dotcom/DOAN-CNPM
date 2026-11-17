// Đồng bộ token với src/pages/services/api.js (Dashboard/POI Manager dùng khóa này).
const TOKEN_KEY = 'hue_dev_bearer_token';
const ADMIN_INFO_KEY = 'huego_admin_info';
const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const ADMIN_ROLES = new Set(['admin', 'super_admin']);

function readJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
  } catch {
    return null;
  }
}

export function logoutAdmin() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_INFO_KEY);
}

export function isAdminAuthenticated() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const saved = sessionStorage.getItem(ADMIN_INFO_KEY);
  if (!token || !saved) return false;
  try {
    const info = JSON.parse(saved);
    const payload = readJwtPayload(token);
    if (!ADMIN_ROLES.has(info.role) || !payload?.exp || payload.exp * 1000 <= Date.now()) {
      logoutAdmin();
      return false;
    }
    return true;
  } catch {
    logoutAdmin();
    return false;
  }
}

export async function loginAdmin(email, password) {
  let response;
  try {
    response = await fetch(`${API_ROOT}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error('Không kết nối được Backend. Hãy kiểm tra API và Vite proxy.');
  }
  let data = {};
  try { data = await response.json(); } catch { /* response rỗng */ }
  if (!response.ok) {
    throw new Error(data.message || (response.status === 401
      ? 'Email hoặc mật khẩu không đúng.'
      : `Đăng nhập thất bại (HTTP ${response.status}).`));
  }
  // AuthController.cs trả về { token, role, fullName }.
  const { token, role, fullName } = data;
  if (!token || !ADMIN_ROLES.has(role)) {
    logoutAdmin();
    throw new Error(!ADMIN_ROLES.has(role)
      ? 'Tài khoản không có quyền quản trị.'
      : 'Backend không trả JWT hợp lệ.');
  }
  const payload = readJwtPayload(token);
  if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
    throw new Error('JWT thiếu thời hạn hoặc đã hết hạn.');
  }
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(ADMIN_INFO_KEY, JSON.stringify({ role, fullName, email }));
  return { role, fullName };
}
