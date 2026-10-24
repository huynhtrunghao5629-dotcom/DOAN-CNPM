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

        // 1. Lấy danh sách điểm tham quan (Hỗ trợ Search từ khóa, Lọc category, và Phân trang)
        [HttpGet]
        public async Task<IActionResult> GetAllPois(
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var filterBuilder = Builders<Poi>.Filter;
            var filter = filterBuilder.Eq(p => p.IsActive, true);

            // Tìm kiếm theo từ khóa (Khớp trong Tên hoặc Mô tả, không phân biệt hoa thường)
            if (!string.IsNullOrEmpty(search))
            {
                var searchFilter = filterBuilder.Regex(p => p.Name, new MongoDB.Bson.BsonRegularExpression(search, "i")) |
                                   filterBuilder.Regex(p => p.Description, new MongoDB.Bson.BsonRegularExpression(search, "i"));
                filter &= searchFilter;
            }

            // Lọc theo danh mục
            if (!string.IsNullOrEmpty(category))
            {
                filter &= filterBuilder.Eq(p => p.Category, category);
            }

            // Đếm tổng số lượng bản ghi thỏa mãn điều kiện
            var totalItems = await _mongoDbService.Pois.CountDocumentsAsync(filter);

            // Thực hiện phân trang (Skip & Limit)
            var skip = (page - 1) * pageSize;
            var pois = await _mongoDbService.Pois.Find(filter)
                .Skip(skip)
                .Limit(pageSize)
                .ToListAsync();

            // Trả về kết quả kèm thông tin phân trang
            return Ok(new
            {
                totalItems = totalItems,
                page = page,
                pageSize = pageSize,
                totalPages = (int)Math.Ceiling((double)totalItems / pageSize),
                data = pois
            });
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

        // 6. Upload hình ảnh cho POI (POST /api/v1/pois/{id}/upload-image)
        [HttpPost("{id}/upload-image")]
        [Authorize(Roles = "admin,super_admin,poi_owner")]
        public async Task<IActionResult> UploadImage(string id, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn một tệp hình ảnh hợp lệ." });
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Chỉ chấp nhận các định dạng ảnh (.jpg, .jpeg, .png, .webp)." });
            }

            var filter = Builders<Poi>.Filter.Eq(p => p.Id, id);
            var existingPoi = await _mongoDbService.Pois.Find(filter).FirstOrDefaultAsync();
            if (existingPoi == null)
            {
                return NotFound(new { message = "Không tìm thấy điểm tham quan." });
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "pois");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/pois/{fileName}";

            existingPoi.Images ??= new List<string>();
            existingPoi.Images.Add(imageUrl);

            await _mongoDbService.Pois.ReplaceOneAsync(filter, existingPoi);

            return Ok(new
            {
                message = "Tải ảnh lên thành công!",
                imageUrl = imageUrl,
                data = existingPoi
            });
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