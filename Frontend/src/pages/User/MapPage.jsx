import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import * as turf from '@turf/turf';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from 'react-router-dom';
import { usePoiStore } from '../../stores/poiStore';
import { startLocationTracking } from '../../services/LocationService';
import { createGeofenceWatcher, nearbyPois } from '../../services/GeofenceEngine';
import GpsSimulator from '../../components/GpsSimulator';
import AudioPlayerBar from '../../components/AudioPlayerBar';


maplibregl.setWorkerUrl(workerUrl);

export default function MapPage() {
  const nodeRef = useRef(null), mapRef = useRef(null), markersRef = useRef([]), userMarkerRef = useRef(null);
  const watchStopRef = useRef(null);
  const pois = usePoiStore(s => s.pois), fetchPois = usePoiStore(s => s.fetchPois);
  const activePoi = usePoiStore(s => s.activePoi), setActivePoi = usePoiStore(s => s.setActivePoi);
  const userPosition = usePoiStore(s => s.userPosition), setUserPosition = usePoiStore(s => s.setUserPosition);
  const loading = usePoiStore(s => s.loading), error = usePoiStore(s => s.error);
  const currentLanguage = usePoiStore(s => s.currentLanguage);
  const setCurrentLanguage = usePoiStore(s => s.setCurrentLanguage);
  const [gpsOn,setGpsOn] = useState(false), [gpsError,setGpsError] = useState(''), [simOn,setSimOn] = useState(false), [nearby,setNearby] = useState([]), [entered,setEntered] = useState(null);
  const watcherRef = useRef(null);
  if (!watcherRef.current) watcherRef.current = createGeofenceWatcher(p => setEntered(p));

  useEffect(()=>{fetchPois().catch(console.warn);},[fetchPois]);
  useEffect(() => {
    const map = new maplibregl.Map({container:nodeRef.current,style:{version:8,sources:{osm:{type:'raster',tiles:['https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png','https://b.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm'}]},center:[107.5778,16.4697],zoom:12,minZoom:9,maxZoom:19});
    map.addControl(new maplibregl.NavigationControl(),'top-right'); mapRef.current=map;
    const timer=setTimeout(()=>map.resize(),150);
    return ()=>{clearTimeout(timer);markersRef.current.forEach(m=>m.remove());userMarkerRef.current?.remove();mapRef.current=null;map.remove();};
  },[]);
  useEffect(()=>{
    const map=mapRef.current; if (!map) return;
    const paint=()=>{
      markersRef.current.forEach(m=>m.remove());markersRef.current=[];
      const valid=pois.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));
      const collection=turf.featureCollection(valid.map(p=>turf.circle([p.lng,p.lat],Number(p.radius)>0?Number(p.radius):150,{steps:64,units:'meters',properties:{id:String(p.id)}})));
      if (!map.getSource('geofence')) {
        map.addSource('geofence',{type:'geojson',data:collection});
        map.addLayer({id:'geofence-fill',type:'fill',source:'geofence',paint:{'fill-color':'#e53935','fill-opacity':0.15}});
        map.addLayer({id:'geofence-outline',type:'line',source:'geofence',paint:{'line-color':'#b71c1c','line-width':2}});
      } else map.getSource('geofence').setData(collection);
      valid.forEach(p=>{const btn=document.createElement('button');btn.textContent='📍';btn.title=p.name;btn.setAttribute('aria-label',p.name);btn.style.cssText='background:#fff;border:2px solid #b71c1c;border-radius:50%;width:38px;height:38px;cursor:pointer';btn.onclick=()=>setActivePoi(p);markersRef.current.push(new maplibregl.Marker({element:btn}).setLngLat([p.lng,p.lat]).addTo(map));});
    };
    if(map.isStyleLoaded())paint();else map.once('load',paint);
    return ()=>map.off('load',paint);
  },[pois,setActivePoi]);
  useEffect(()=>{
    if(!userPosition)return;
    const map=mapRef.current;if(!map)return;
    if(!userMarkerRef.current){const el=document.createElement('div');el.style.cssText='height:17px;width:17px;background:#1684d4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px #1684d466';userMarkerRef.current=new maplibregl.Marker({element:el}).setLngLat([userPosition.lng,userPosition.lat]).addTo(map);}
    else userMarkerRef.current.setLngLat([userPosition.lng,userPosition.lat]);
    setNearby(nearbyPois(userPosition,pois));
    // Tick nhờ vị trí cập nhật; xác nhận geofence thêm bằng interval phía dưới.
  },[userPosition,pois]);
  useEffect(()=>{const timer=setInterval(()=>{if(userPosition)watcherRef.current.update(userPosition,pois);},1000);return()=>clearInterval(timer);},[userPosition,pois]);
  useEffect(()=>()=>watchStopRef.current?.(),[]);
  const disableGps=()=>{watchStopRef.current?.();watchStopRef.current=null;setGpsOn(false);};
  const enableGps=()=>{disableGps();setSimOn(false);setEntered(null);setGpsError('');watcherRef.current.reset();watchStopRef.current=startLocationTracking(p=>setUserPosition(p),setGpsError);setGpsOn(true);};
  const simulate=(p)=>{disableGps();setSimOn(true);setGpsError('');setEntered(null);watcherRef.current.reset();setUserPosition(p);mapRef.current?.flyTo({center:[p.lng,p.lat],zoom:16});};
  return <div style={{position:'relative',width:'100%',height:'100vh',minHeight:520}}>
    <div ref={nodeRef} style={{height:'100%',width:'100%'}} />
    <div style={{position:'absolute',top:14,left:14,zIndex:15,display:'flex',flexDirection:'column',gap:8,maxWidth:'min(330px,calc(100% - 80px))'}}>
      <div style={{background:'white',borderRadius:12,padding:12,boxShadow:'0 3px 16px #0002'}}>
        <Link to="/home">← Trang chủ</Link>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
          <button onClick={gpsOn?disableGps:enableGps}>{gpsOn?'Tắt GPS':'📍 Bật GPS thật'}</button>
          <button onClick={()=>{disableGps();setSimOn(v=>!v);}}>🧪 {simOn?'Ẩn':'Thử'} GPS giả lập</button>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:8,marginTop:10,fontSize:13}}>
          🌐 Ngôn ngữ
          <select aria-label="Ngôn ngữ thuyết minh" value={currentLanguage} onChange={e=>setCurrentLanguage(e.target.value)} style={{flex:1,padding:7,borderRadius:8,border:'1px solid #ccc'}}>
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="en">🇬🇧 English</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="ja">🇯🇵 日本語</option>
            <option value="ko">🇰🇷 한국어</option>
          </select>
        </label>
        {gpsError&&<p role="alert" style={{color:'#b00020',fontSize:12}}>{gpsError}</p>}
        {(loading||error)&&<p style={{fontSize:12}}>{loading?'Đang tải POI...':'Không kết nối được API. Đang dùng dữ liệu ngoại tuyến.'}</p>}
        {userPosition&&<p style={{fontSize:12,marginBottom:0}}>Vị trí: {userPosition.source==='simulator'?'Đang giả lập':'GPS thật'} · Gần nhất: {nearby[0]?`${nearby[0].name} (${Math.round(nearby[0].distance)}m)`:'Chưa có POI'}</p>}
      </div>
      {simOn&&<GpsSimulator onSimulate={simulate} onDisable={()=>setSimOn(false)}/>}
    </div>
    {entered&&<div style={{position:'absolute',right:16,bottom:125,zIndex:20,background:'white',padding:14,borderRadius:12,maxWidth:310,boxShadow:'0 3px 20px #0003'}} role="status">
      <strong>📍 Bạn đã vào vùng {entered.name}</strong>
      <p style={{fontSize:13}}>Bạn có muốn nghe thuyết minh không?</p>
      <button onClick={()=>{setActivePoi(entered);setEntered(null);}}>Mở thuyết minh</button>{' '}
      <button onClick={()=>setEntered(null)}>Để sau</button>
    </div>}
    {!entered&&activePoi&&<AudioPlayerBar/>}
  </div>;
}
