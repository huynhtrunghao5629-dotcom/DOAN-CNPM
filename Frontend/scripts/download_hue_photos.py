import truststore
truststore.inject_into_ssl()
import json, urllib.request, urllib.parse, pathlib, time
root=pathlib.Path(__file__).resolve().parents[1]
photos=json.loads((root/'public/images/heritage/DANH_SACH_NGUON_ANH.json').read_text(encoding='utf-8'))
headers={'User-Agent':'HueGO-class-project/1.0 (education, provenance in manifest)'}
for p in photos:
    query=urllib.parse.urlencode({'action':'query','format':'json','prop':'imageinfo','titles':'File:'+p['commons_file'],'iiprop':'url','iiurlwidth':'1000'})
    req=urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+query,headers=headers)
    try:
        data=json.load(urllib.request.urlopen(req,timeout=30))
        page=next(iter(data['query']['pages'].values()))
        url=page['imageinfo'][0].get('thumburl') or page['imageinfo'][0]['url']
        raw=urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=45).read()
        path=root/'public/images/heritage'/f"{p['slug']}.jpg"
        try:
            from io import BytesIO
            from PIL import Image
            im=Image.open(BytesIO(raw)).convert('RGB');im.thumbnail((1200,900))
            im.save(path,'JPEG',quality=83,optimize=True)
        except ImportError:
            # Ảnh Commons ban đầu là JPEG, nếu không có Pillow giữ nguyên ảnh thumbnail.
            path.write_bytes(raw)
        print('OK:',p['place'],len(raw),'bytes')
        time.sleep(1)
    except Exception as e:
        print('LỖI:',p['place'],type(e).__name__,e)
print('Hoàn thành. Xem giấy phép trong DANH_SACH_NGUON_ANH.json rồi chạy npm run build.')
