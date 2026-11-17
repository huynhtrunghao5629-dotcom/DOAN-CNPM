// Chỉ gọi khi người dùng bấm "Bật GPS". Cần HTTPS hoặc localhost.
export function startLocationTracking(onPosition, onError) {
  if (!('geolocation' in navigator)) {
    onError('Trình duyệt không hỗ trợ định vị GPS.');
    return () => {};
  }
  let lastUpdate = 0;
  const watchId = navigator.geolocation.watchPosition(
    ({ coords, timestamp }) => {
      if (timestamp - lastUpdate < 5000) return;
      lastUpdate = timestamp;
      onPosition({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, source: 'gps', timestamp });
    },
    (error) => onError(error.code === 1 ? 'Bạn chưa cấp quyền vị trí cho trang web.' : 'Không đọc được vị trí. Kiểm tra GPS hoặc kết nối.'),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
  );
  return () => navigator.geolocation.clearWatch(watchId);
}
