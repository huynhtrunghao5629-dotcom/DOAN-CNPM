import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Hướng camera vào mã QR tại cổng để bắt đầu...');

  useEffect(() => {
    // Khởi tạo bộ quét QR
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { fps: 10, qrbox: { width: 250, height: 250 } }, 
      false
    );

    // Hàm xử lý khi quét THÀNH CÔNG
    const onScanSuccess = (decodedText) => {
      // Giả sử mã QR hợp lệ phải chứa chữ "tour_hue" hoặc gì đó (bạn có thể đổi)
      if (decodedText.includes("tour_hue") || decodedText.trim() !== "") {
        setStatus('✅ Quét thành công! Đang vào tour...');
        
        // Dừng camera lại ngay lập tức
        scanner.clear();
        
        // Lưu trạng thái đã kích hoạt tour vào localStorage
        localStorage.setItem('isTourActive', 'true');
        
        // Chuyển hướng sang trang bản đồ sau 1 giây
        setTimeout(() => {
          navigate('/map');
        }, 1000);
      } else {
        setStatus('❌ Mã QR không hợp lệ. Vui lòng quét lại!');
      }
    };

    // Hàm xử lý lỗi quét (thường bỏ qua vì camera liên tục tìm lỗi)
    const onScanFailure = (error) => {
      // console.warn(error);
    };

    scanner.render(onScanSuccess, onScanFailure);

    // Cleanup khi component bị hủy (ví dụ user chuyển trang)
    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <h2 style={{ color: '#0288d1', marginBottom: '20px' }}>Bắt đầu Tour Du Lịch Huế</h2>
      
      {/* KHUNG HIỂN THỊ CAMERA QUÉT MÃ QR */}
      <div id="reader" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}></div>
      
      <p style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '20px', textAlign: 'center' }}>
        {status}
      </p>

      {/* Nút giả lập (Giữ lại phòng hờ lúc báo cáo thầy cô mà máy bị hư camera) */}
      <button 
        onClick={() => {
          localStorage.setItem('isTourActive', 'true');
          navigate('/home');
        }}
        style={{ marginTop: '30px', padding: '10px 20px', backgroundColor: '#757575', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        Bỏ qua (Giả lập quét xong)
      </button>
    </div>
  );
}