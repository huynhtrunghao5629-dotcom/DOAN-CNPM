import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePoiStore } from '../../stores/poiStore';
import { getApiToken } from '../services/api';
import './Dashboard.css';

const LANGUAGES = ['Tiếng Việt', 'English', '中文', '日本語', '한국어'];

// Không giả định định dạng response khi Backend chưa bàn giao JSON mẫu.
// Chỉ hiện con số khi API thực sự trả về trường đếm có ý nghĩa rõ ràng.
function parsePresence(payload) {
  const obj = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  if (!obj || typeof obj !== 'object') throw new Error('API Presence trả dữ liệu không hợp lệ.');

  const rawCount = obj.activeSessionsCount ?? obj.activeSessionCount ??
    obj.activeSessions ?? obj.activeCount ?? obj.onlineCount ??
    obj.totalActive ?? obj.totalOnline ?? obj.count;
  const count = (typeof rawCount === 'number' || (typeof rawCount === 'string' && rawCount.trim() !== ''))
    ? Number(rawCount) : NaN;

  const candidates = [obj.sessions, obj.activeSessions, obj.onlineSessions];
  const sessions = candidates.find(Array.isArray) ?? [];
  const explicitCount = Number.isInteger(count) && count >= 0 ? count : null;
  const activeOnly = sessions.filter(s => s && typeof s === 'object' &&
    (s.isActive === true || String(s.status || '').toLowerCase() === 'active'));
  const hasActiveFlags = sessions.length > 0 && sessions.every(s =>
    typeof s?.isActive === 'boolean' || typeof s?.status === 'string');
  const finalCount = explicitCount ?? (hasActiveFlags ? activeOnly.length : null);

  if (finalCount === null) throw new Error('Chưa nhận diện được trường số phiên từ API. Cần JSON Response body thực tế.');
  return { count: finalCount, sessions: hasActiveFlags ? activeOnly : sessions };
}

async function requestPresence(signal) {
  const token = getApiToken();
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch('/api/v1/admin/presence', {
    method: 'GET', credentials: 'include', headers, signal, cache: 'no-store'
  });
  if (response.status === 401) throw new Error('401: Cần đăng nhập Admin.');
  if (response.status === 403) throw new Error('403: Tài khoản không có quyền Admin.');
  if (!response.ok) throw new Error(`Presence API trả HTTP ${response.status}.`);
  return parsePresence(await response.json());
}


export default function Dashboard() {
  const pois = usePoiStore(s => s.pois);
  const fetchPois = usePoiStore(s => s.fetchPois);
  const source = usePoiStore(s => s.source);
  const loading = usePoiStore(s => s.loading);
  const error = usePoiStore(s => s.error);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [presence, setPresence] = useState({ status: 'loading', count: null, sessions: [], message: '', updatedAt: null });
  const [presenceReload, setPresenceReload] = useState(0);

  useEffect(() => {
    let disposed = false;
    let controller = null;
    async function updatePresence() {
      if (document.visibilityState === 'hidden' || controller) return;
      controller = new AbortController();
      const current = controller;
      try {
        const result = await requestPresence(current.signal);
        if (!disposed) setPresence({ status: 'success', count: result.count, sessions: result.sessions, message: '', updatedAt: new Date() });
      } catch (e) {
        if (!disposed && e.name !== 'AbortError') {
          setPresence({ status: 'error', count: null, sessions: [], message: e.message, updatedAt: null });
        }
      } finally {
        if (controller === current) controller = null;
      }
    }
    updatePresence();
    const timer = setInterval(updatePresence, 5000);
    document.addEventListener('visibilitychange', updatePresence);
    return () => {
      disposed = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', updatePresence);
      controller?.abort();
    };
  }, [presenceReload]);

  useEffect(() => {
    let active = true;
    fetchPois({ force: true })
      .then(() => { if (active) setLastRefresh(new Date()); })
      .catch(console.warn);
    return () => { active = false; };
  }, [fetchPois]);

  const active = useMemo(() => pois.filter(p => p.isActive !== false), [pois]);
  const apiOnline = source === 'api' && !error;
  const refresh = () => {
    fetchPois({ force: true }).then(() => setLastRefresh(new Date())).catch(console.warn);
    setPresenceReload(n => n + 1);
  };

  return (
    <div className="hue-admin-dashboard">
      <header className="hue-admin-dash-header">
        <div>
          <span className="hue-admin-eyebrow">HUẾ GO / QUẢN TRỊ</span>
          <h1>Tổng quan hệ thống</h1>
          <p>Quản lý di tích, kiểm tra kết nối và chuẩn bị demo truy cập bằng QR.</p>
        </div>
        <button type="button" className="hue-admin-refresh" onClick={refresh} disabled={loading}>
          {loading ? 'Đang cập nhật…' : '↻ Làm mới dữ liệu'}
        </button>
      </header>

      <section className="hue-admin-stats" aria-label="Số liệu tổng quan">
        <div className="hue-admin-stat"><span className="hue-admin-stat-icon">📍</span><span>Di tích đang hiển thị</span><strong>{active.length}</strong><small>Dữ liệu từ {source === 'api' ? 'API' : source === 'offline' ? 'bộ nhớ ngoại tuyến' : 'nguồn chưa xác định'}</small></div>
        <div className="hue-admin-stat"><span className="hue-admin-stat-icon">🌐</span><span>Ngôn ngữ giao diện</span><strong>{LANGUAGES.length}</strong><small>Giọng đọc tùy thuộc thiết bị</small></div>
        <div className="hue-admin-stat"><span className="hue-admin-stat-icon">📡</span><span>Trạng thái dữ liệu</span><strong className="hue-admin-status-value">{loading ? 'Đang tải' : apiOnline ? 'API OK' : source === 'offline' ? 'Offline' : 'Chưa rõ'}</strong><small>{lastRefresh ? `Kiểm tra: ${lastRefresh.toLocaleTimeString('vi-VN')}` : 'Chưa kiểm tra trong phiên này'}</small></div>
        <div className="hue-admin-stat"><span className="hue-admin-stat-icon">👥</span><span>Phiên đang trực tuyến</span><strong className={presence.status !== 'success' ? 'hue-admin-pending' : ''}>{presence.status === 'success' ? presence.count : '—'}</strong><small>{presence.status === 'success' ? 'Số phiên thật do Backend trả về' : presence.status === 'loading' ? 'Đang kết nối API Presence...' : 'Cần kiểm tra xác thực / phản hồi API'}</small></div>
      </section>

      {error && <p className="hue-admin-warning" role="status">API có vấn đề: {error}. Danh sách bên dưới có thể là dữ liệu ngoại tuyến.</p>}

      <div className="hue-admin-grid">
        <section className="hue-admin-card">
          <div className="hue-admin-card-head"><div><h2>Danh sách di tích</h2><p>POI lấy từ cùng Zustand store với bản đồ người dùng.</p></div><Link to="/admin/pois">Quản lý POI →</Link></div>
          <div className="hue-admin-table-wrap">
            <table><thead><tr><th>Di tích</th><th>Loại</th><th>Bán kính</th><th>Trạng thái</th></tr></thead>
              <tbody>{active.length ? active.map(p => <tr key={String(p.id)}><td><strong>{p.name}</strong></td><td>{p.category || '—'}</td><td>{Number.isFinite(Number(p.radius)) ? `${p.radius} m` : '—'}</td><td><span className="hue-admin-pill">Đang hiển thị</span></td></tr>) : <tr><td colSpan="4">Chưa có dữ liệu di tích.</td></tr>}</tbody>
            </table>
          </div>
        </section>
        <div className="hue-admin-side">
          <section className="hue-admin-card">
            <div className="hue-admin-card-head"><div><h2>Người dùng trực tuyến</h2><p>Gọi dữ liệu thật từ Backend mỗi 5 giây.</p></div><span className="hue-presence-live">{presence.status === 'success' ? '● Đã kết nối' : '○ Chưa kết nối'}</span></div>
            {presence.status === 'success' ? (
              <div className="hue-presence-result" role="status">
                <div className="hue-presence-number">{presence.count}</div>
                <div><strong>Phiên đang hoạt động</strong><p className="hue-admin-muted">Cập nhật lúc {presence.updatedAt?.toLocaleTimeString('vi-VN')}</p></div>
              </div>
            ) : (
              <div className="hue-admin-placeholder" role="status"><span>👥</span><strong>{presence.status === 'loading' ? 'Đang tải số phiên...' : 'Chưa lấy được số liệu'}</strong><p>{presence.message || 'Đang kết nối đến Admin Presence API.'}</p></div>
            )}
            {presence.status === 'success' && presence.sessions.length > 0 && (
              <div className="hue-presence-list">
                <strong>Phiên từ API ({presence.sessions.length})</strong>
                {presence.sessions.slice(0, 10).map((s, i) => <div className="hue-presence-row" key={String(s.sessionId ?? s.id ?? i)}>
                  <span>Thiết bị {i + 1}</span>
                  <span>{s.lastSeen || s.lastActiveAt ? new Date(s.lastSeen ?? s.lastActiveAt).toLocaleTimeString('vi-VN') : 'Đang hoạt động'}</span>
                </div>)}
              </div>
            )}
            <button type="button" className="hue-presence-refresh" onClick={() => setPresenceReload(n => n + 1)}>↻ Cập nhật phiên</button>
            <p className="hue-admin-muted">Đếm phiên truy cập, không xác minh số người khác nhau. Cần JWT Admin hợp lệ để xem dữ liệu.</p>
          </section>
          <section className="hue-admin-card"><h2>Truy cập nhanh</h2><div className="hue-admin-links"><Link to="/map">🗺️ Mở bản đồ du khách <span>↗</span></Link><Link to="/admin/pois">📍 Quản lý POI <span>↗</span></Link></div></section>
          <section className="hue-admin-card"><h2>Demo mã QR</h2><p className="hue-admin-muted">Tạo mã QR để các điện thoại mở trang du khách. Địa chỉ phải truy cập được từ điện thoại.</p><Link to="/admin/qr" className="hue-admin-upcoming">Mở trang tạo QR →</Link></section>
        </div>
      </div>
    </div>
  );
}
