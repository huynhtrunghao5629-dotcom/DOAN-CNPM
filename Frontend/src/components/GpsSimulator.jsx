import React from 'react';
import { usePoiStore } from '../stores/poiStore';

// Phục vụ demo tại nhà; KHÔNG dùng làm dữ liệu GPS thực.
export default function GpsSimulator({ onSimulate, onDisable }) {
  const pois = usePoiStore(s => s.pois);
  return (
    <div style={{background:'#fff',padding:12,borderRadius:12,boxShadow:'0 4px 16px #0002',maxWidth:300}}>
      <strong style={{display:'block',marginBottom:8}}>🧪 GPS giả lập (Demo)</strong>
      <select aria-label="Chọn điểm giả lập" defaultValue="" onChange={e => {
        const p = pois.find(p => String(p.id) === e.target.value);
        if (p) onSimulate({lat:p.lat,lng:p.lng,accuracy:5,source:'simulator',timestamp:Date.now()});
      }} style={{width:'100%',padding:8}}>
        <option value="">Chọn một di tích</option>
        {pois.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button type="button" onClick={onDisable} style={{marginTop:8}}>Tắt giả lập</button>
      <small style={{display:'block',marginTop:6,color:'#666'}}>Chọn điểm để mô phỏng bạn đang đứng tại đó.</small>
    </div>
  );
}
