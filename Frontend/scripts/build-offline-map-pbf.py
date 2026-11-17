#!/usr/bin/env python3
"""Convert downloaded Geofabrik Vietnam .osm.pbf into the GeoJSON format used by HueGO.
No Overpass/Backend required. Requires pip install osmium.
"""
import argparse, json, os, sys, pathlib
try:
    import osmium
except ImportError:
    sys.exit('Thiếu thư viện osmium. Chạy: py -m pip install osmium')

DEFAULT_BBOX = (107.30, 16.24, 107.76, 16.68) # West South East North; main Hue heritage areas
MAJOR = {'motorway','trunk','primary','secondary','tertiary','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link'}
ROADS = MAJOR | {'residential','living_street','unclassified','service','pedestrian','footway','path','steps','cycleway','track','bridleway'}

def accept_way(tags):
    hw = tags.get('highway', '')
    if hw in ROADS:
        return 'road-major' if hw in MAJOR else 'road'
    if tags.get('waterway') in {'river','stream','canal','ditch'}:
        return 'water-line'
    if tags.get('natural') == 'water' or tags.get('water') in {'lake','pond','reservoir','river'} or tags.get('landuse') in {'reservoir','basin'}:
        return 'water-area'
    if tags.get('leisure') in {'park','garden','nature_reserve'} or tags.get('landuse') in {'forest','grass','recreation_ground','village_green'}:
        return 'park'
    return None

class GeoHandler(osmium.SimpleHandler):
    def __init__(self, bbox, output):
        super().__init__()
        self.w,self.s,self.e,self.n = bbox
        self.output = output
        self.first = True
        self.counts = {}

    def way(self, way):
        tags = way.tags
        kind = accept_way(tags)
        if not kind:
            return
        pts = []
        try:
            for n in way.nodes:
                if not n.location.valid():
                    return
                pts.append([round(n.lon,7), round(n.lat,7)])
        except (ValueError, RuntimeError):
            return
        if len(pts) < 2 or not any(self.w <= x <= self.e and self.s <= y <= self.n for x,y in pts):
            return
        closed = len(pts) >= 4 and pts[0] == pts[-1]
        typ = 'Polygon' if closed and kind in {'water-area','park'} else 'LineString'
        if kind in {'water-area','park'} and typ != 'Polygon':
            return
        geom = {'type':typ, 'coordinates':[pts] if typ == 'Polygon' else pts}
        feat = {'type':'Feature','properties':{'kind':kind}, 'geometry':geom}
        if not self.first: self.output.write(',')
        self.output.write(json.dumps(feat,ensure_ascii=False,separators=(',',':')))
        self.first = False
        self.counts[kind] = self.counts.get(kind,0)+1


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('pbf',help='Đường dẫn tới vietnam-latest.osm.pbf')
    ap.add_argument('--output',default='public/offline/hue-basemap.geojson')
    ap.add_argument('--bbox',type=float,nargs=4,default=DEFAULT_BBOX,metavar=('WEST','SOUTH','EAST','NORTH'))
    a=ap.parse_args()
    src=pathlib.Path(a.pbf)
    if not src.is_file(): sys.exit(f'Không thấy file nguồn: {src}')
    dst=pathlib.Path(a.output)
    dst.parent.mkdir(parents=True,exist_ok=True)
    tmp=dst.with_name(dst.name+'.tmp')
    print('Đang đọc',src, 'và lọc khu vực Huế:',a.bbox,flush=True)
    try:
        with tmp.open('w',encoding='utf-8') as f:
            f.write('{"type":"FeatureCollection","features":[')
            handler=GeoHandler(a.bbox,f)
            handler.apply_file(str(src),locations=True)
            f.write('],"metadata":{"source":"OpenStreetMap/Geofabrik","bbox":')
            f.write(json.dumps(a.bbox,separators=(',',':')))
            f.write('}}')
        total=sum(handler.counts.values())
        if total == 0:
            tmp.unlink(missing_ok=True)
            sys.exit('Không tìm thấy đường sá trong vùng chọn. Không ghi đè file GeoJSON hiện tại.')
        tmp.replace(dst)
        size=dst.stat().st_size/1024/1024
        print(f'HOÀN THÀNH: {total} đối tượng, {size:.2f} MB -> {dst}')
        print('Phân loại:',handler.counts)
        if size > 70:
            print('CHÚ Ý: GeoJSON lớn hơn 70 MB; nên thu nhỏ --bbox hoặc điều chỉnh giới hạn Workbox.')
    except Exception:
        tmp.unlink(missing_ok=True)
        raise

if __name__=='__main__': main()
