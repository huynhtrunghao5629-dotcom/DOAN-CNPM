import { useMemo } from "react";
import { findOverlappingPois } from "../utils/geofence";

// Bên trong component Form Thêm/Sửa POI (với formData và poisList):
const overlappingPois = useMemo(() => {
  return findOverlappingPois(formData, pois); // Nhớ kiểm tra biến 'pois' có đúng tên state chứa danh sách POI không
}, [formData, pois]);

// Trong hàm xử lý nút Lưu (handleSubmit):
const handleSubmit = async (e) => {
  e.preventDefault();

  if (overlappingPois.length > 0) {
    const names = overlappingPois
      .map((p) => `- ${p.name}: cách ${p.distance}m (giao nhau ${p.overlapMeters}m)`)
      .join("\n");

    const confirmSave = window.confirm(
      `Cảnh báo vùng định vị Geofence bị giao nhau:\n${names}\n\nDu khách đi vào phần giao này có thể bị kích hoạt nhầm thuyết minh. Bạn vẫn muốn lưu?`
    );
    if (!confirmSave) return;
  }

  // Tiếp tục gọi API POST / PUT lưu POI như bình thường...
};