
import React, { useEffect, useState } from 'react';
import { usePoiStore } from '../../stores/poiStore';
import { adminApi } from '../services/adminApi';

const initialForm = {
  name: '',
  description: '',
  lat: '',
  lng: '',
  radius: 150,
  isActive: true,
  images: [],
  narrations: {},
};

export default function POIManager() {
  const pois = usePoiStore((state) => state.pois);
  const fetchPois = usePoiStore((state) => state.fetchPois);
  const loading = usePoiStore((state) => state.loading);
  const error = usePoiStore((state) => state.error);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  useEffect(() => { fetchPois().catch(console.warn); }, [fetchPois]);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const filteredPois = pois.filter((poi) =>
    poi.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({ ...initialForm });
    setEditingId(null);
    setShowForm(true);
    setSelectedImage(null);
    setMessage('');
  };

  const openEdit = (poi) => {
    setForm({
      name: poi.name,
      description: poi.description || '',
      lat: poi.lat,
      lng: poi.lng,
      radius: poi.radius,
      isActive: poi.isActive ?? true,
      images: Array.isArray(poi.images) ? [...poi.images] : [],
      narrations: poi.narrations || (poi.narration ? { vi: { text: poi.narration, audioUrl: '' } } : {}),
    });

    setEditingId(poi.id);
    setSelectedImage(null);
    setShowForm(true);
    setMessage('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setNarrationValue = (lang, key, value) => {
    setForm(prev => ({ ...prev, narrations: { ...prev.narrations, [lang]: { ...prev.narrations?.[lang], [key]: value } } }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const lat = Number(form.lat), lng = Number(form.lng), radius = Number(form.radius);
    if (!form.name.trim() || form.lat === '' || form.lng === '' ||
        !Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180 || radius <= 0) {
      setMessage('Vui lòng kiểm tra tên, tọa độ và bán kính.'); return;
    }
    const payload = { ...form, lat, lng, radius, category: 'Di tích lịch sử' };
    setSaving(true);
    try {
      let saved;
      if (editingId !== null) saved = await adminApi.updatePoi(editingId, payload);
      else saved = await adminApi.createPoi(payload);
      const poiId = editingId ?? saved?.id ?? saved?.data?.id;
      if (selectedImage) {
        if (!poiId) throw new Error('Đã lưu POI nhưng không đọc được ID để tải ảnh. Mở lại POI và tải ảnh riêng.');
        await adminApi.uploadPoiImage(poiId, selectedImage);
      }
      await fetchPois({ force: true });
      setShowForm(false); setEditingId(null); setSelectedImage(null); setForm({ ...initialForm });
      setMessage('Đã lưu vào backend thành công.');
    } catch (e) { setMessage(`Không lưu được: ${e.message}`); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa điểm này trên backend?')) return;
    setSaving(true);
    try {
      await adminApi.deletePoi(id);
      await fetchPois({ force: true });
      setMessage('Đã xóa khỏi backend.');
    } catch (e) { setMessage(`Không xóa được: ${e.message}`); }
    finally { setSaving(false); }
  };

  return (
    <div className="poi-admin">
      <div className="poi-header">
        <div>
          <h1>Quản lý địa điểm</h1>
          <p>
            Quản lý các điểm tham quan và vùng Geofence
            tại Huế
          </p>
        </div>

        <button
          className="poi-btn-primary"
          onClick={openAdd}
        >
          + Thêm địa điểm
        </button>
      </div>

      {(loading || error) && (
        <div style={{ padding: 14, marginBottom: 20, background: '#fff9e8', borderRadius: 10 }}>
          {loading && <p style={{ margin: 0 }}>Đang tải dữ liệu địa điểm...</p>}
          {error && <p role="alert" style={{ margin: 0 }}>{error}</p>}
        </div>
      )}
      <div className="poi-stats">
        <div className="poi-stat-card">
          <span>Tổng địa điểm</span>
          <strong>{pois.length}</strong>
        </div>

        <div className="poi-stat-card">
          <span>Địa điểm có Geofence</span>
          <strong>
            {pois.filter((p) => p.radius > 0).length}
          </strong>
        </div>
      </div>

      {message && (
        <div className="poi-message" role="status">
          {message}
        </div>
      )}

      <div className="poi-panel">
        <div className="poi-toolbar">
          <h2>Danh sách địa điểm</h2>

          <input
            type="search"
            placeholder="Tìm kiếm địa điểm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="poi-table-wrap">
          <table className="poi-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên địa điểm</th>
                <th>Tọa độ GPS</th>
                <th>Bán kính</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredPois.map((poi, index) => (
                <tr key={poi.id}>
                  <td>{index + 1}</td>

                  <td>
                    <strong>{poi.name}</strong>
                    <small>
                      {poi.description || 'Chưa có mô tả'}
                    </small>
                  </td>

                  <td>
                    {poi.lat}, {poi.lng}
                  </td>

                  <td>{poi.radius} m</td>

                  <td>
                    <div className="poi-actions">
                      <button
                        className="poi-btn-edit"
                        disabled={saving}
                        onClick={() => openEdit(poi)}
                      >
                        Sửa
                      </button>

                      <button
                        className="poi-btn-delete"
                        disabled={saving}
                        onClick={() =>
                          handleDelete(poi.id)
                        }
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPois.length === 0 && (
                <tr>
                  <td colSpan="5" className="poi-empty">
                    Chưa có địa điểm phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="poi-modal-overlay">
          <div
            className="poi-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="poi-form-title"
          >
            <div className="poi-modal-header">
              <h2 id="poi-form-title">
                {editingId !== null
                  ? 'Chỉnh sửa địa điểm'
                  : 'Thêm địa điểm mới'}
              </h2>

              <button
                type="button"
                className="poi-close"
                onClick={() => setShowForm(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <label>Tên địa điểm</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ví dụ: Lăng Khải Định"
                required
              />

              <label>Mô tả địa điểm</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Nhập mô tả..."
                rows="3"
              />

              <fieldset style={{ border:'1px solid #dce3eb', borderRadius: 10, padding: 12, marginTop: 12 }}>
                <legend style={{ fontWeight: 700 }}>Hình ảnh di tích</legend>
                <p style={{fontSize:12,color:'#667085'}}>Ảnh ưu tiên JPG, PNG hoặc WEBP (tối đa 5MB). Ảnh sẽ lưu trên Backend, đường dẫn được ghi vào MongoDB.</p>
                {Array.isArray(form.images) && form.images.length > 0 && (
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
                    {form.images.map((src,i) => (
                      <div key={`${src}-${i}`} style={{position:'relative'}}>
                        <img alt={`Ảnh di tích ${i+1}`} src={src} style={{width:130,height:95,objectFit:'cover',borderRadius:8}} />
                        <button type="button" onClick={()=>setForm(old=>({...old,images:old.images.filter((_,j)=>i!==j)}))} style={{display:'block',padding:'4px 8px',fontSize:12}}>Bỏ ảnh khỏi POI</button>
                      </div>
                    ))}
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type))) {
                    setMessage('Ảnh phải là JPG/PNG/WEBP và không quá 5 MB.');
                    e.target.value = ''; setSelectedImage(null); return;
                  }
                  setSelectedImage(file);
                }}/>
                {selectedImage && <p style={{fontSize:12}}>Ảnh chờ tải: {selectedImage.name} — nhấn Lưu địa điểm</p>}
              </fieldset>

              <fieldset style={{ border: '1px solid #dce3eb', borderRadius: 10, padding: 12, marginTop: 10 }}>
              <legend style={{fontWeight: 700}}>Thuyết minh theo ngôn ngữ (lưu MongoDB)</legend>
              <p style={{fontSize: 12, color:'#667085'}}>Không tự tạo nội dung. Nhập thông tin đã kiểm chứng; ngôn ngữ chưa có sẽ hiển thị trạng thái đang cập nhật.</p>
              {Object.entries({vi:'Tiếng Việt', en:'English', zh:'中文', ja:'日本語', ko:'한국어'}).map(([lang, label]) => (
                <div key={lang} style={{marginBottom: 14}}>
                  <label htmlFor={`narration-${lang}`}>Nội dung — {label}</label>
                  <textarea id={`narration-${lang}`} rows={5} value={form.narrations?.[lang]?.text || ''}
                    onChange={e => setNarrationValue(lang, 'text', e.target.value)}
                    placeholder={`Viết bài thuyết minh ${label} (có thể dài nhiều đoạn)`} />
                  <label htmlFor={`audio-${lang}`}>Đường dẫn bản ghi âm — {label} (không bắt buộc)</label>
                  <input id={`audio-${lang}`} type="text" value={form.narrations?.[lang]?.audioUrl || ''}
                    onChange={e => setNarrationValue(lang, 'audioUrl', e.target.value)}
                    placeholder="/static/audio/...mp3 hoặc HTTPS" />
                </div>
              ))}
            </fieldset>
            <div className="poi-form-grid">
                <div>
                  <label>Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    name="lat"
                    value={form.lat}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label>Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    name="lng"
                    value={form.lng}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <label>Bán kính Geofence (mét) — lưu trong MongoDB</label>
              <input
                type="number"
                min="1"
                name="radius"
                value={form.radius}
                onChange={handleChange}
                required
              />

              <div className="poi-modal-footer">
                <button
                  type="button"
                  className="poi-btn-cancel"
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="poi-btn-primary"
                >
                  {saving ? 'Đang lưu...' : 'Lưu địa điểm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .poi-admin {
          padding: 30px;
          min-height: 100vh;
          box-sizing: border-box;
          background: #f4f7fb;
          font-family: Arial, sans-serif;
          color: #26364a;
        }

        .poi-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 25px;
        }

        .poi-header h1 {
          margin: 0 0 10px;
          font-size: 28px;
        }

        .poi-header p {
          margin: 0;
          color: #718096;
          line-height: 1.6;
        }

        .poi-btn-primary {
          background: #176b57;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
        }

        .poi-btn-primary:hover {
          background: #105441;
        }

        .poi-stats {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .poi-stat-card {
          background: white;
          padding: 24px;
          border-radius: 14px;
          box-shadow: 0 5px 20px rgba(0,0,0,.04);
        }

        .poi-stat-card span {
          display: block;
          color: #718096;
          margin-bottom: 12px;
        }

        .poi-stat-card strong {
          font-size: 32px;
          color: #176b57;
        }

        .poi-panel {
          background: white;
          padding: 24px;
          border-radius: 14px;
          box-shadow: 0 5px 20px rgba(0,0,0,.04);
        }

        .poi-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
        }

        .poi-toolbar h2 {
          margin: 0;
          font-size: 19px;
        }

        .poi-toolbar input {
          padding: 12px;
          width: 280px;
          max-width: 100%;
          border: 1px solid #dce3eb;
          border-radius: 8px;
        }

        .poi-table-wrap {
          overflow-x: auto;
        }

        .poi-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .poi-table th {
          padding: 15px;
          background: #f8fafc;
          color: #64748b;
          font-size: 13px;
        }

        .poi-table td {
          padding: 15px;
          border-bottom: 1px solid #edf0f4;
          vertical-align: middle;
        }

        .poi-table td small {
          display: block;
          margin-top: 7px;
          color: #94a3b8;
          max-width: 300px;
          line-height: 1.5;
        }

        .poi-actions {
          display: flex;
          gap: 8px;
        }

        .poi-btn-edit,
        .poi-btn-delete,
        .poi-btn-cancel {
          padding: 8px 14px;
          border-radius: 7px;
          cursor: pointer;
          border: 1px solid #e2e8f0;
        }

        .poi-btn-edit {
          color: #176b57;
          background: #e9f5ef;
        }

        .poi-btn-delete {
          color: #be123c;
          background: #fff1f2;
        }

        .poi-btn-cancel {
          background: white;
        }

        .poi-empty {
          text-align: center;
          padding: 35px !important;
          color: #94a3b8;
        }

        .poi-message {
          background: #e5f5ed;
          color: #176b57;
          padding: 14px;
          border-radius: 9px;
          margin-bottom: 20px;
        }

        .poi-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
          box-sizing: border-box;
        }

        .poi-modal {
          background: white;
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 28px;
          border-radius: 16px;
          box-sizing: border-box;
        }

        .poi-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .poi-modal-header h2 {
          margin: 0;
          font-size: 22px;
        }

        .poi-close {
          border: none;
          background: transparent;
          font-size: 28px;
          cursor: pointer;
        }

        .poi-modal form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .poi-modal label {
          font-size: 14px;
          font-weight: 600;
          margin-top: 10px;
        }

        .poi-modal input,
        .poi-modal textarea {
          padding: 12px;
          border: 1px solid #dce3eb;
          border-radius: 8px;
          font: inherit;
          box-sizing: border-box;
          width: 100%;
        }

        .poi-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .poi-form-grid > div {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .poi-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 22px;
        }

        @media (max-width: 600px) {
          .poi-admin { padding: 16px; }
          .poi-form-grid { grid-template-columns: 1fr; }
          .poi-modal { padding: 20px; }
        }
      `}</style>
    </div>
  );    
}
