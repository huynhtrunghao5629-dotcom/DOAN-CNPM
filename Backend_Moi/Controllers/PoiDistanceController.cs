using Microsoft.AspNetCore.Mvc;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/v1/pois")]
    public class PoiDistanceController : ControllerBase
    {
        [HttpGet("distance")]
        public IActionResult CalculateDistance(
            [FromQuery] double lat1,
            [FromQuery] double lon1,
            [FromQuery] double lat2,
            [FromQuery] double lon2)
        {
            if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
                lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180)
            {
                return BadRequest(new { message = "Tọa độ không hợp lệ (Vĩ độ: -90..90, Kinh độ: -180..180)." });
            }

            double distanceKm = Haversine(lat1, lon1, lat2, lon2);

            return Ok(new
            {
                point1 = new { latitude = lat1, longitude = lon1 },
                point2 = new { latitude = lat2, longitude = lon2 },
                distanceKm = Math.Round(distanceKm, 3),
                distanceMeters = Math.Round(distanceKm * 1000, 1)
            });
        }

        private static double Haversine(double lat1, double lon1, double lat2, double lon2)
        {
            const double EarthRadiusKm = 6371.0;

            double dLat = (lat2 - lat1) * (Math.PI / 180.0);
            double dLon = (lon2 - lon1) * (Math.PI / 180.0);

            double rLat1 = lat1 * (Math.PI / 180.0);
            double rLat2 = lat2 * (Math.PI / 180.0);

            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(rLat1) * Math.Cos(rLat2) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            a = Math.Clamp(a, 0.0, 1.0);
            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return EarthRadiusKm * c;
        }
    }
}