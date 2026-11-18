import * as turf from "@turf/turf";

function extractCoordsAndRadius(obj) {
  if (!obj) return null;
  const lat = Number(obj.latitude ?? obj.Latitude ?? obj.lat ?? obj.Lat);
  const lng = Number(obj.longitude ?? obj.Longitude ?? obj.lng ?? obj.Lng);
  const radius = Number(
    obj.radius ?? obj.Radius ?? obj.triggerRadius ?? obj.geofenceRadius ?? 50
  );

  if (Number.isNaN(lat) || Number.isNaN(lng) || lat === 0 || lng === 0) {
    return null;
  }
  return { lat, lng, radius: Number.isNaN(radius) ? 50 : radius };
}

export function findOverlappingPois(targetPoi, existingPois) {
  if (!Array.isArray(existingPois) || existingPois.length === 0) return [];

  const target = extractCoordsAndRadius(targetPoi);
  if (!target) return [];

  const targetId = targetPoi.id ?? targetPoi.Id;
  const point1 = turf.point([target.lng, target.lat]);
  const overlaps = [];

  for (const poi of existingPois) {
    const poiId = poi.id ?? poi.Id;
    if (targetId && poiId === targetId) continue;

    const current = extractCoordsAndRadius(poi);
    if (!current) continue;

    const point2 = turf.point([current.lng, current.lat]);
    const distance = turf.distance(point1, point2, { units: "meters" });
    const totalRadius = target.radius + current.radius;

    if (distance <= totalRadius) {
      overlaps.push({
        id: poiId,
        name: poi.name ?? poi.Name ?? "Địa điểm",
        radius: current.radius,
        distance: Math.round(distance),
        overlapMeters: Math.round(totalRadius - distance),
      });
    }
  }

  return overlaps;
}