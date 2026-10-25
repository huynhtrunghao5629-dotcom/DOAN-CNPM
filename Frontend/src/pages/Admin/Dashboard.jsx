import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalPois: 0
  });

  useEffect(() => {
    // Demo: Giả lập gọi API lấy thống kê từ Backend C#
    // Thực tế sẽ gọi axios.get('/api/v1/analytics/active-users')
    const fetchStats = () => {
      setStats({
        activeUsers: Math.floor(Math.random() * 50) + 10, // Giả lập 10-60 người
        totalPois: 12
      });
    };
    
    fetchStats();
    // Cập nhật real-time mỗi 5 giây
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Tổng quan hệ thống (Dashboard)</h2>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Thẻ thống kê số người truy cập */}
        <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderLeft: '6px solid #1976d2', borderRadius: '8px', minWidth: '200px' }}>
          <h3 style={{ margin: 0, color: '#1976d2' }}>Đang truy cập</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0 0 0' }}>
            {stats.activeUsers} <span style={{fontSize: '14px', fontWeight: 'normal'}}>khách</span>
          </p>
        </div>

        {/* Thẻ thống kê tổng điểm POI */}
        <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderLeft: '6px solid #2e7d32', borderRadius: '8px', minWidth: '200px' }}>
          <h3 style={{ margin: 0, color: '#2e7d32' }}>Điểm tham quan (POI)</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0 0 0' }}>
            {stats.totalPois} <span style={{fontSize: '14px', fontWeight: 'normal'}}>điểm</span>
          </p>
        </div>
      </div>
    </div>
  );
}