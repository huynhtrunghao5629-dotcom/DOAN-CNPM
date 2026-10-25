import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Menu của Admin */}
      <div style={{ width: '250px', backgroundColor: '#1e1e2f', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h2 style={{ color: '#4facfe', textAlign: 'center', borderBottom: '1px solid #444', paddingBottom: '15px' }}>Admin Panel</h2>
        
        <button onClick={() => navigate('/admin')} style={menuStyle}>📊 Dashboard</button>
        <button onClick={() => navigate('/admin/pois')} style={menuStyle}>📍 Quản lý POI</button>
        
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => navigate('/admin/login')} style={{...menuStyle, backgroundColor: '#d32f2f'}}>Đăng xuất</button>
        </div>
      </div>

      {/* Nội dung chính bên phải */}
      <div style={{ flex: 1, backgroundColor: '#f4f7f6', padding: '30px', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

const menuStyle = {
  padding: '12px 15px', backgroundColor: 'transparent', color: '#fff', border: 'none', 
  borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '16px', transition: '0.3s'
};