using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Services;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/pois")]
    [ApiController]
    public class PoiController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public PoiController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        // 1. Lấy danh sách điểm tham quan (Ai cũng xem được)
        [HttpGet]
        public async Task<IActionResult> GetAllPois([FromQuery] string? category)
        {
            var filterBuilder = Builders<Poi>.Filter;
            var filter = filterBuilder.Eq(p => p.IsActive, true);

            if (!string.IsNullOrEmpty(category))
            {
                filter &= filterBuilder.Eq(p => p.Category, category);
            }

            var pois = await _mongoDbService.Pois.Find(filter).ToListAsync();
            return Ok(pois);
        }

        // 2. Xem chi tiết 1 điểm tham quan
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPoiById(string id)
        {
            var poi = await _mongoDbService.Pois.Find(p => p.Id == id && p.IsActive).FirstOrDefaultAsync();
            if (poi == null) return NotFound(new { message = "Không tìm thấy điểm tham quan" });
            return Ok(poi);
        }

        // 3. Tạo mới POI (Chỉ Admin hoặc Poi Owner mới được tạo)
        [HttpPost]
        [Authorize(Roles = "admin,super_admin,poi_owner")]
        public async Task<IActionResult> CreatePoi([FromBody] CreatePoiDto dto)
        {
            var newPoi = new Poi
            {
                Name = dto.Name,
                Category = dto.Category,
                Description = dto.Description,
                Address = dto.Address,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Images = dto.Images ?? new List<string>()
            };

            await _mongoDbService.Pois.InsertOneAsync(newPoi);
            return StatusCode(201, newPoi);
        }

        // 4. Cập nhật POI (PUT /api/v1/pois/{id})
        [HttpPut("{id}")]
        [Authorize(Roles = "admin,super_admin,poi_owner")]
        public async Task<IActionResult> UpdatePoi(string id, [FromBody] UpdatePoiDto dto)
        {
            var filter = Builders<Poi>.Filter.Eq(p => p.Id, id);
            var existingPoi = await _mongoDbService.Pois.Find(filter).FirstOrDefaultAsync();

            if (existingPoi == null)
            {
                return NotFound(new { message = "Không tìm thấy điểm tham quan" });
            }

            // Cập nhật các trường dữ liệu nếu được truyền lên
            if (!string.IsNullOrEmpty(dto.Name)) existingPoi.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.Category)) existingPoi.Category = dto.Category;
            if (!string.IsNullOrEmpty(dto.Description)) existingPoi.Description = dto.Description;
            if (!string.IsNullOrEmpty(dto.Address)) existingPoi.Address = dto.Address;
            if (dto.Latitude.HasValue) existingPoi.Latitude = dto.Latitude.Value;
            if (dto.Longitude.HasValue) existingPoi.Longitude = dto.Longitude.Value;
            if (dto.Images != null) existingPoi.Images = dto.Images;
            if (dto.IsActive.HasValue) existingPoi.IsActive = dto.IsActive.Value;

            await _mongoDbService.Pois.ReplaceOneAsync(filter, existingPoi);

            return Ok(new
            {
                message = "Cập nhật điểm tham quan thành công",
                data = existingPoi
            });
        }

        // 5. Xóa POI (DELETE /api/v1/pois/{id})
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,super_admin,poi_owner")]
        public async Task<IActionResult> DeletePoi(string id)
        {
            var result = await _mongoDbService.Pois.DeleteOneAsync(p => p.Id == id);

            if (result.DeletedCount == 0)
            {
                return NotFound(new { message = "Không tìm thấy điểm tham quan để xóa" });
            }

            return Ok(new { message = "Xóa điểm tham quan thành công" });
        }
    }

    // DTO phục vụ cho việc cập nhật POI
    public class UpdatePoiDto
    {
        public string? Name { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string? Address { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public List<string>? Images { get; set; }
        public bool? IsActive { get; set; }
    }
}