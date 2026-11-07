import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import './AccessQR.css';

const initialUrl = () => {
  const saved = localStorage.getItem('huego_public_entry_url');
  const configured = import.meta.env.VITE_PUBLIC_APP_URL;
  return saved || (configured ? `${configured.replace(/\/$/, '')}/home` : `${window.location.origin}/home`);
};

function validateDestination(value) {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return 'Chỉ chấp nhận đường dẫn http:// hoặc https://.';
    if (parsed.username || parsed.password) return 'Không đặt thông tin đăng nhập trong đường dẫn.';
    if (parsed.pathname.startsWith('/admin')) return 'QR dành cho du khách, không dẫn đến trang Admin.';
    if (parsed.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) return 'HTTP trên mạng LAN có thể khiến GPS thật bị chặn. Hãy ưu tiên HTTPS.';
    return '';
  } catch {
    return 'Đường dẫn chưa hợp lệ. Ví dụ: https://ten-mien.ngrok-free.app/home';
  }
}

export default function AccessQR() {
  const [url, setUrl] = useState(initialUrl);
  const [copied, setCopied] = useState(false);
  const svgHolder = useRef(null);
  const error = useMemo(() => validateDestination(url), [url]);
  const normalizedUrl = useMemo(() => url.trim(), [url]);
  const isLocal = (() => { try { return ['localhost','127.0.0.1','0.0.0.0'].includes(new URL(normalizedUrl).hostname); } catch { return false; } })();
  const canGenerate = !error && !isLocal;
  function saveCanonicalUrl() {
    if (canGenerate) localStorage.setItem('huego_public_entry_url', normalizedUrl);
  }

  async function copyUrl() {
    try { await navigator.clipboard.writeText(normalizedUrl); setCopied(true); }
    catch { setCopied(false); }
  }

  function downloadQr() {
    const svg = svgHolder.current?.querySelector('svg');
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'huego-qr-truy-cap.svg';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <main className="huego-qr-page">
      <header className="huego-qr-heading">
        <div><span className="huego-qr-eyebrow">HUẾ GO / QUẢN TRỊ</span><h1>QR truy cập ứng dụng</h1><p>Để khách quét mã trên điện thoại và mở trực tiếp giao diện du khách.</p></div>
        <Link to="/admin" className="huego-qr-back">← Trở về Dashboard</Link>
      </header>
      <div className="huego-qr-layout">
        <section className="huego-qr-card">
          <h2>1. Địa chỉ truy cập</h2>
          <label htmlFor="huego-qr-url">URL của Frontend (trang /home)</label>
          <input id="huego-qr-url" type="url" spellCheck="false" value={url} onChange={e => {setUrl(e.target.value);setCopied(false);}} placeholder="https://ten-mien.ngrok-free.app/home" />
          {error && <p className="huego-qr-error" role="alert">{error}</p>}
          {isLocal && <p className="huego-qr-warning" role="status">Bạn đang sử dụng localhost. QR này sẽ không truy cập được từ điện thoại khác. Hãy chạy ứng dụng qua HTTPS và điền đường dẫn đó.</p>}
          {!error && !isLocal && <p className="huego-qr-ok">✓ URL có thể dùng để tạo mã QR. Hãy kiểm tra rằng website thật sự truy cập được từ điện thoại.</p>}
          <div className="huego-qr-actions">
            <button type="button" onClick={saveCanonicalUrl} disabled={!canGenerate}>Lưu URL QR chung</button>
            <button type="button" onClick={copyUrl} disabled={Boolean(error)}>{copied ? '✓ Đã sao chép' : 'Sao chép liên kết'}</button>
            <a href={canGenerate ? normalizedUrl : undefined} target="_blank" rel="noopener noreferrer" className={!canGenerate ? 'disabled' : ''} onClick={e => {if(!canGenerate) e.preventDefault();}}>Kiểm tra liên kết ↗</a>
          </div>
          <div className="huego-qr-tip"><strong>Lưu ý khi demo:</strong> Chạy Backend ở cổng 7151, Frontend ở cổng 5173, rồi cung cấp HTTPS truy cập vào Frontend. Vite proxy sẽ chuyển tiếp yêu cầu /api tới Backend. Không công khai Admin khi chưa có đăng nhập an toàn.</div>
        </section>
        <section className="huego-qr-card huego-qr-preview">
          <h2>2. Mã QR cho du khách</h2>
          {canGenerate ? <>
            <div className="huego-qr-image" ref={svgHolder}><QRCodeSVG value={normalizedUrl} size={256} level="M" includeMargin={true} title="QR truy cập HUẾ GO" /></div>
            <p className="huego-qr-caption">Mở Camera trên điện thoại → Quét QR → Truy cập HUẾ GO.</p>
            <button type="button" className="huego-qr-download" onClick={downloadQr}>↓ Tải mã QR (SVG)</button>
          </> : <div className="huego-qr-empty"><span>▦</span><strong>Chưa sẵn sàng tạo QR</strong><p>Nhập URL HTTP(S) hợp lệ, không dùng localhost, ưu tiên HTTPS.</p></div>}
        </section>
      </div>
      <p className="huego-qr-footer">Một QR chung mở website. URL lưu trên trình duyệt Admin này; nếu thay domain, QR đã in không tự cập nhật. Cần hosting/HTTPS ổn định để dùng lâu dài.</p>
    </main>
  );
}
