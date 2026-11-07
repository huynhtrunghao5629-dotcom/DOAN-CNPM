/**
 * HUẾ GO - tạo bản đồ đường sá ngoại tuyến từ dữ liệu OSM thông qua Overpass API.
 * Không tải tile từ OSM tile servers. Chạy MỘT LẦN trong lúc có Wi-Fi.
 * Bản đồ dữ liệu thực, không phải dữ liệu địa lý minh họa.
 * © OpenStreetMap contributors, ODbL (https://www.openstreetmap.org/copyright).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const api = process.env.HUEGO_POI_URL || 'http://localhost:5173/api/v1/pois?page=1&pageSize=50';
const overpass = process.env.HUEGO_OVERPASS_URL || 'https://overpass.kumi.systems/api/interpreter';
const dest = resolve('public/offline/hue-basemap.geojson');
const MAX_BYTES = 14 * 1024 * 1024;
const RADIUS = 1400; // mét quanh từng di tích, không tải tràn lan cả tỉnh

function timeoutFetch(url, opts = {}, timeout = 150000) {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(timeout) });
}
function kind(tags, coords) {
  if (tags.highway) {
    return /^(motorway|trunk|primary|secondary|tertiary|.*_link)$/.test(tags.highway) ? 'road-major' : 'road';
  }
  if (tags.waterway) return 'water-line';
  if (tags.natural === 'water') return coords.length > 3 && closed(coords) ? 'water-area' : 'water-line';
  if (tags.leisure === 'park' || tags.leisure === 'garden' || ['forest','grass','meadow','recreation_ground'].includes(tags.landuse)) return 'park';
  return null;
}
function closed(c) { return c.length > 3 && c[0][0] === c.at(-1)[0] && c[0][1] === c.at(-1)[1]; }
async function main() {
  console.log('HUẾ GO: Đang đọc danh sách di tích từ Backend:', api);
  const response = await timeoutFetch(api, {}, 18000);
  if (!response.ok) throw new Error(`API POI HTTP ${response.status}. Hãy chạy Backend và npm run dev trước.`);
  const json = await response.json();
  const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
  const pois = data.map(p => ({ name: p.name, lat: Number(p.latitude ?? p.lat), lng: Number(p.longitude ?? p.lng) }))
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat > 15 && p.lat < 18 && p.lng > 106 && p.lng < 109);
  if (!pois.length) throw new Error('API chưa trả tọa độ di tích hợp lệ. Không tạo dữ liệu bản đồ giả.');
  // Gom theo tọa độ trùng gần nhau để tránh truy vấn dư.
  const centers = [...new Map(pois.map(p => [`${p.lat.toFixed(4)}|${p.lng.toFixed(4)}`,p])).values()];
  console.log(`Có ${centers.length} vị trí POI. Đang tải đường sá, đường đi, công viên và sông hồ trong bán kính ${RADIUS}m quanh từng vị trí.`);
  const makeGroup = p => `(
    way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|footway|path|steps|service|track|cycleway|.*_link)$"](around:${RADIUS},${p.lat},${p.lng});
    way["waterway"~"^(river|canal|stream|ditch)$"](around:${RADIUS},${p.lat},${p.lng});
    way["natural"="water"](around:${RADIUS},${p.lat},${p.lng});
    way["leisure"~"^(park|garden)$"](around:${RADIUS},${p.lat},${p.lng});
    way["landuse"~"^(forest|grass|meadow|recreation_ground)$"](around:${RADIUS},${p.lat},${p.lng});
  );`;
  const seen = new Set(); const features=[];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const batches = [];
  for (let i=0; i<centers.length; i+=2) batches.push(centers.slice(i,i+2));
  for (let bi=0; bi<batches.length; bi++) {
    const query = `[out:json][timeout:90];(${batches[bi].map(makeGroup).join('\n')});out tags geom qt;`;
    const base = overpass.replace(/\?$/, '');
    const url = `${base}?${new URLSearchParams({data: query})}`;
    console.log(`Đang tải nhóm ${bi+1}/${batches.length} (${batches[bi].length} di tích)...`);
    // GET cho truy vấn ngắn: tránh một số reverse proxy trả 406 với POST lớn.
    const r = await timeoutFetch(url, { headers: { Accept: 'application/json' } }, 120000);
    if (!r.ok) {
      const diagnostic = (await r.text()).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,450);
      throw new Error(`Overpass HTTP ${r.status}, nhóm ${bi+1}: ${diagnostic || 'Không có chi tiết'}.\nDừng để tránh gửi yêu cầu liên tục; thử lại lúc khác hoặc dùng endpoint được phép.`);
    }
    const osm = await r.json();
    if (!Array.isArray(osm.elements)) throw new Error(`Overpass nhóm ${bi+1} không trả về mảng elements.`);
  for (const el of osm.elements) {
    if (el.type !== 'way' || seen.has(el.id) || !Array.isArray(el.geometry)) continue;
    seen.add(el.id);
    // Rút gọn tọa độ đến ~1.1 m, bỏ điểm trùng để giảm dung lượng.
    const coords = [];
    for (const pt of el.geometry) {
      const lng = +pt.lon.toFixed(5), lat = +pt.lat.toFixed(5);
      if (!coords.length || coords.at(-1)[0] !== lng || coords.at(-1)[1] !== lat) coords.push([lng,lat]);
    }
    if (coords.length < 2) continue;
    const tags=el.tags || {};
    const k=kind(tags,coords);
    if (!k) continue;
    const polygon = ['park','water-area'].includes(k) && closed(coords);
    features.push({type:'Feature',properties:{kind:polygon?k:(k==='water-area'?'water-line':'road'),name:tags.name||'',osm_id:el.id},
      geometry:polygon ? {type:'Polygon',coordinates:[coords]} : {type:'LineString',coordinates:coords}});
  }
  }
  if (features.length < 25) throw new Error(`Chỉ có ${features.length} tuyến/đối tượng; từ chối ghi file thiếu dữ liệu.`);
  const result={type:'FeatureCollection',metadata:{generatedAt:new Date().toISOString(),source:'© OpenStreetMap contributors (ODbL)',coverage:'1400m quanh các POI HUẾ GO',featureCount:features.length},features};
  const content=JSON.stringify(result);
  if (Buffer.byteLength(content)>MAX_BYTES) throw new Error(`Dữ liệu lớn hơn ${(MAX_BYTES/1048576).toFixed(0)} MiB. Giảm RADIUS trong script và chạy lại.`);
  await mkdir(resolve('public/offline'),{recursive:true});
  await writeFile(dest,content,'utf8');
  console.log(`THÀNH CÔNG: ${features.length} đối tượng OSM; ${(Buffer.byteLength(content)/1048576).toFixed(2)} MiB -> ${dest}`);
  console.log('Tiếp theo: npm run build && npm run preview. Truy cập /map khi online để SW cài dữ liệu, rồi thử Offline.');
}
main().catch(e=>{ console.error('\nLỖI:',e.message);process.exitCode=1; });
