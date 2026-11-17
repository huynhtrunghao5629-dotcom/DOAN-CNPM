
import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'hue_admin_users_v1';

const DEMO_USERS = [
  {
    id: 'U001',
    name: 'Nguyễn Văn An',
    email: 'an@example.com',
    phone: '0901234567',
    role: 'Du khách',
    status: 'active',
    createdAt: '2026-09-12',
  },
  {
    id: 'U002',
    name: 'Trần Thị Bình',
    email: 'binh@example.com',
    phone: '0912345678',
    role: 'Du khách',
    status: 'active',
    createdAt: '2026-09-18',
  },
  {
    id: 'U003',
    name: 'Lê Minh Khoa',
    email: 'khoa@example.com',
    phone: '0987654321',
    role: 'Du khách',
    status: 'locked',
    createdAt: '2026-10-01',
  },
  {
    id: 'U004',
    name: 'Phạm Thanh Hà',
    email: 'ha@example.com',
    phone: '0934567890',
    role: 'Du khách',
    status: 'active',
    createdAt: '2026-10-10',
  },
];

function loadUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      return DEMO_USERS;
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : DEMO_USERS;
  } catch (error) {
    console.error('Không đọc được dữ liệu người dùng:', error);
    return DEMO_USERS;
  }
}

function formatDate(date) {
  if (!date) return 'Chưa cập nhật';

  const [year, month, day] = date.split('-');

  return day && month && year
    ? `${day}/${month}/${year}`
    : date;
}

export default function UserManager() {
  const [users, setUsers] = useState(loadUsers);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    locked: users.filter((u) => u.status === 'locked').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    const q = keyword.toLowerCase().trim();

    return users.filter((user) => {
      const matchesKeyword =
        `${user.name} ${user.email} ${user.phone || ''}`
          .toLowerCase()
          .includes(q);

      const matchesStatus =
        filter === 'all' || user.status === filter;

      return matchesKeyword && matchesStatus;
    });
  }, [users, keyword, filter]);

  const toggleLock = (user) => {
    const isLocked = user.status === 'locked';

    const confirmed = window.confirm(
      isLocked
        ? `Bạn muốn mở khóa tài khoản ${user.name}?`
        : `Bạn muốn khóa tài khoản ${user.name}?`
    );

    if (!confirmed) return;

    const nextStatus = isLocked ? 'active' : 'locked';

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? { ...item, status: nextStatus }
          : item
      )
    );

    setSelectedUser((current) =>
      current?.id === user.id
        ? { ...current, status: nextStatus }
        : current
    );

    setMessage(
      `Đã ${isLocked ? 'mở khóa' : 'khóa'} tài khoản ${user.name}.`
    );
  };

  return (
    <main className="hue-users-page">
      {/* HEADER */}
      <div className="hue-users-header">
        <div>
          <span className="hue-users-kicker">
            HỆ THỐNG QUẢN TRỊ DU LỊCH HUẾ
          </span>
          <h1>Quản lý người dùng</h1>
          <p>
            Theo dõi và quản lý tài khoản du khách
            sử dụng hệ thống.
          </p>
        </div>

        <div className="hue-users-header-icon">
          ♙
        </div>
      </div>

      {/* STATISTICS */}
      <div className="hue-users-stats">
        <div className="hue-users-stat">
          <div className="hue-users-stat-icon blue">👥</div>
          <span>Tổng tài khoản</span>
          <strong>{stats.total}</strong>
          <small>Người dùng trong hệ thống</small>
        </div>

        <div className="hue-users-stat">
          <div className="hue-users-stat-icon green">✓</div>
          <span>Đang hoạt động</span>
          <strong>{stats.active}</strong>
          <small>Tài khoản đang mở</small>
        </div>

        <div className="hue-users-stat">
          <div className="hue-users-stat-icon red">🔒</div>
          <span>Đã khóa</span>
          <strong>{stats.locked}</strong>
          <small>Tài khoản bị hạn chế</small>
        </div>
      </div>

      {message && (
        <div className="hue-users-message" role="status">
          ✓ {message}
          <button
            aria-label="Đóng thông báo"
            onClick={() => setMessage('')}
          >
            ×
          </button>
        </div>
      )}

      {/* TABLE SECTION */}
      <section className="hue-users-panel">
        <div className="hue-users-toolbar">
          <div>
            <h2>Danh sách tài khoản</h2>
            <p>{filteredUsers.length} tài khoản được tìm thấy</p>
          </div>

          <div className="hue-users-tools">
            <input
              type="search"
              placeholder="Tìm tên, email, số điện thoại..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="Tìm kiếm người dùng"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Lọc trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>
        </div>

        <div className="hue-users-table-wrapper">
          <table className="hue-users-table">
            <thead>
              <tr>
                <th>NGƯỜI DÙNG</th>
                <th>SỐ ĐIỆN THOẠI</th>
                <th>NGÀY THAM GIA</th>
                <th>VAI TRÒ</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="hue-users-profile">
                      <div className="hue-users-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                  </td>

                  <td>{user.phone || 'Chưa cập nhật'}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <span className="hue-users-role">
                      {user.role}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`hue-users-status ${
                        user.status === 'active'
                          ? 'active'
                          : 'locked'
                      }`}
                    >
                      <span className="hue-users-dot" />
                      {user.status === 'active'
                        ? 'Hoạt động'
                        : 'Đã khóa'}
                    </span>
                  </td>

                  <td>
                    <div className="hue-users-actions">
                      <button
                        className="view"
                        onClick={() => setSelectedUser(user)}
                      >
                        Chi tiết
                      </button>

                      <button
                        className={
                          user.status === 'active'
                            ? 'lock'
                            : 'unlock'
                        }
                        onClick={() => toggleLock(user)}
                      >
                        {user.status === 'active'
                          ? 'Khóa'
                          : 'Mở khóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="hue-users-empty">
                    Không tìm thấy tài khoản phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div
          className="hue-users-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="hue-users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hue-users-modal-header">
              <h2 id="user-detail-title">Chi tiết người dùng</h2>
              <button
                onClick={() => setSelectedUser(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="hue-users-modal-profile">
              <div className="hue-users-avatar large">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <h3>{selectedUser.name}</h3>
              <p>{selectedUser.email}</p>
            </div>

            <div className="hue-users-details">
              <div>
                <span>Mã người dùng</span>
                <strong>{selectedUser.id}</strong>
              </div>
              <div>
                <span>Họ và tên</span>
                <strong>{selectedUser.name}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selectedUser.email}</strong>
              </div>
              <div>
                <span>Số điện thoại</span>
                <strong>
                  {selectedUser.phone || 'Chưa cập nhật'}
                </strong>
              </div>
              <div>
                <span>Ngày tham gia</span>
                <strong>{formatDate(selectedUser.createdAt)}</strong>
              </div>
              <div>
                <span>Trạng thái</span>
                <strong>
                  {selectedUser.status === 'active'
                    ? 'Hoạt động'
                    : 'Đã khóa'}
                </strong>
              </div>
            </div>

            <div className="hue-users-modal-footer">
              <button
                onClick={() => setSelectedUser(null)}
              >
                Đóng
              </button>

              <button
                className="primary"
                onClick={() => toggleLock(selectedUser)}
              >
                {selectedUser.status === 'active'
                  ? 'Khóa tài khoản'
                  : 'Mở khóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hue-users-page {
          min-height: 100vh;
          background: #f5f7fb;
          color: #26364a;
          padding: 30px;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }

        .hue-users-page * {
          box-sizing: border-box;
        }

        .hue-users-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          gap: 20px;
        }

        .hue-users-kicker {
          color: #16806a;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .hue-users-header h1 {
          font-size: 29px;
          margin: 10px 0;
        }

        .hue-users-header p {
          color: #84909e;
          font-size: 14px;
        }

        .hue-users-header-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 35px;
          color: #176b57;
          background: #e0f2e9;
        }

        .hue-users-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }

        .hue-users-stat {
          background: #fff;
          border: 1px solid #edf1f5;
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 5px 22px rgba(30, 50, 70, .03);
        }

        .hue-users-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          font-size: 20px;
          margin-bottom: 15px;
        }

        .hue-users-stat-icon.blue {
          background: #e8f0ff;
          color: #3b82f6;
        }

        .hue-users-stat-icon.green {
          background: #e3f7ea;
          color: #16a34a;
        }

        .hue-users-stat-icon.red {
          background: #fff0f0;
          color: #ef4444;
        }

        .hue-users-stat > span {
          display: block;
          color: #738295;
          font-size: 13px;
        }

        .hue-users-stat > strong {
          display: block;
          font-size: 32px;
          margin: 8px 0;
        }

        .hue-users-stat > small {
          font-size: 11px;
          color: #9ca8b6;
        }

        .hue-users-panel {
          background: #fff;
          border: 1px solid #edf1f5;
          border-radius: 15px;
          padding: 23px;
          overflow: hidden;
        }

        .hue-users-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 18px;
          margin-bottom: 25px;
        }

        .hue-users-toolbar h2 {
          margin: 0 0 6px;
          font-size: 19px;
        }

        .hue-users-toolbar p {
          margin: 0;
          font-size: 12px;
          color: #97a3b2;
        }

        .hue-users-tools {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hue-users-tools input,
        .hue-users-tools select {
          padding: 12px 14px;
          border: 1px solid #e0e6ee;
          border-radius: 8px;
          outline: none;
          background: white;
          color: #344054;
        }

        .hue-users-tools input {
          width: 280px;
          max-width: 100%;
        }

        .hue-users-tools input:focus {
          border-color: #176b57;
        }

        .hue-users-table-wrapper {
          overflow-x: auto;
        }

        .hue-users-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 850px;
        }

        .hue-users-table th {
          background: #f8fafc;
          color: #8290a1;
          font-size: 10px;
          letter-spacing: .6px;
          padding: 16px;
        }

        .hue-users-table td {
          border-bottom: 1px solid #f0f2f5;
          padding: 17px 16px;
          font-size: 13px;
          color: #546275;
        }

        .hue-users-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hue-users-avatar {
          display: grid;
          place-items: center;
          background: #e5f3ed;
          color: #176b57;
          border-radius: 50%;
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          font-size: 17px;
          font-weight: bold;
        }

        .hue-users-profile strong {
          display: block;
          color: #344054;
          margin-bottom: 5px;
        }

        .hue-users-profile small {
          display: block;
          color: #98a2b3;
          font-size: 11px;
        }

        .hue-users-role {
          background: #f1f5f9;
          color: #64748b;
          padding: 6px 11px;
          border-radius: 20px;
          font-size: 11px;
        }

        .hue-users-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .hue-users-status.active {
          background: #e8f8ed;
          color: #15803d;
        }

        .hue-users-status.locked {
          background: #fff1f2;
          color: #be123c;
        }

        .hue-users-dot {
          width: 6px;
          height: 6px;
          background: currentColor;
          border-radius: 50%;
        }

        .hue-users-actions {
          display: flex;
          gap: 8px;
        }

        .hue-users-actions button {
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
        }

        .hue-users-actions .view {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
        }

        .hue-users-actions .lock {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
        }

        .hue-users-actions .unlock {
          background: #eaf8ee;
          border: 1px solid #bbf7d0;
          color: #15803d;
        }

        .hue-users-empty {
          text-align: center;
          padding: 45px !important;
          color: #94a3b8 !important;
        }

        .hue-users-message {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          margin-bottom: 20px;
          background: #e8f8ed;
          color: #176b57;
          border-radius: 9px;
          font-size: 13px;
        }

        .hue-users-message button {
          background: none;
          border: none;
          font-size: 20px;
          color: inherit;
          cursor: pointer;
        }

        /* MODAL */
        .hue-users-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15,23,42,.55);
          padding: 20px;
        }

        .hue-users-modal {
          width: 100%;
          max-width: 510px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 70px rgba(0,0,0,.15);
        }

        .hue-users-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 25px;
          border-bottom: 1px solid #edf0f4;
        }

        .hue-users-modal-header h2 {
          margin: 0;
          font-size: 19px;
        }

        .hue-users-modal-header button {
          border: none;
          background: transparent;
          font-size: 27px;
          cursor: pointer;
          color: #64748b;
        }

        .hue-users-modal-profile {
          text-align: center;
          padding: 26px;
          background: #f8fafc;
        }

        .hue-users-avatar.large {
          width: 65px;
          height: 65px;
          margin: auto;
          font-size: 27px;
        }

        .hue-users-modal-profile h3 {
          margin: 14px 0 6px;
        }

        .hue-users-modal-profile p {
          margin: 0;
          color: #94a3b8;
          font-size: 13px;
        }

        .hue-users-details {
          padding: 12px 26px;
        }

        .hue-users-details > div {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
        }

        .hue-users-details span {
          color: #94a3b8;
        }

        .hue-users-details strong {
          text-align: right;
          color: #334155;
          overflow-wrap: anywhere;
        }

        .hue-users-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px 26px;
        }

        .hue-users-modal-footer button {
          padding: 11px 17px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
        }

        .hue-users-modal-footer .primary {
          background: #176b57;
          color: white;
          border-color: #176b57;
        }

        @media (max-width: 800px) {
          .hue-users-page {
            padding: 16px;
          }

          .hue-users-stats {
            grid-template-columns: 1fr;
          }

          .hue-users-toolbar {
            align-items: stretch;
          }

          .hue-users-tools {
            flex-direction: column;
          }

          .hue-users-tools input,
          .hue-users-tools select {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
