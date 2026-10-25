
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    // Giao diện đăng nhập tạm thời.
    // Chưa xác thực tài khoản với máy chủ.
    setError('Chức năng đăng nhập chưa được kết nối với máy chủ.');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="login-back">
          ← Về trang du khách
        </Link>

        <div className="login-logo">HUẾ</div>

        <h1>Chào mừng trở lại</h1>
        <p className="login-subtitle">
          Đăng nhập hệ thống quản trị Du Lịch Huế
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Tên đăng nhập</label>
          <input
            id="username"
            type="text"
            placeholder="Nhập tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button">
            Đăng nhập quản trị
          </button>
        </form>

        <p className="login-footer">
          HỆ THỐNG QUẢN LÝ DU LỊCH HUẾ
        </p>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          box-sizing: border-box;
          background: linear-gradient(135deg, #edf7f4, #f5f3e9);
          font-family: Arial, sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 36px;
          box-sizing: border-box;
          background: white;
          border-radius: 22px;
          box-shadow: 0 20px 60px rgba(30, 70, 60, 0.12);
        }

        .login-back {
          color: #54766b;
          text-decoration: none;
          font-size: 14px;
        }

        .login-logo {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          margin: 28px 0 22px;
          border-radius: 18px;
          background: #176b57;
          color: white;
          font-size: 21px;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .login-card h1 {
          margin: 0 0 10px;
          color: #203b33;
          font-size: 27px;
        }

        .login-subtitle {
          margin: 0 0 28px;
          color: #788780;
          font-size: 14px;
          line-height: 1.6;
        }

        .login-card label {
          display: block;
          margin: 18px 0 8px;
          color: #344a42;
          font-size: 14px;
          font-weight: 600;
        }

        .login-card input {
          width: 100%;
          padding: 13px 14px;
          box-sizing: border-box;
          border: 1px solid #dce5df;
          border-radius: 10px;
          outline: none;
          font-size: 14px;
        }

        .login-card input:focus {
          border-color: #27856d;
          box-shadow: 0 0 0 3px rgba(39, 133, 109, 0.1);
        }

        .login-button {
          width: 100%;
          margin-top: 24px;
          padding: 14px;
          border: none;
          border-radius: 10px;
          background: #176b57;
          color: white;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }

        .login-button:hover {
          background: #105341;
        }

        .login-error {
          margin-top: 14px;
          color: #bd3434;
          font-size: 13px;
          line-height: 1.5;
        }

        .login-footer {
          margin: 28px 0 0;
          color: #9aa79f;
          text-align: center;
          font-size: 10px;
          letter-spacing: 1.5px;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 26px 22px;
          }
        }
      `}</style>
    </div>
  );
}
