using HueSmartTourism.Backend.Data;
using HueSmartTourism.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tuan1_2_tv2_cnpm.DTOs;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/pois")]
    [ApiController]
    public class PoiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PoiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách điểm tham quan (Hỗ trợ Search từ khóa, Lọc category, và Phân trang)
        [HttpGet]
        public async Task<IActionResult> GetAllPois(
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.Pois.Where(p => p.IsActive);

            // Tìm kiếm theo từ khóa (Khớp trong Tên hoặc Mô tả)
            if (!string.IsNullOrEmpty(search))
            {
                // Dùng .Contains thay cho Regex của MongoDB
                query = query.Where(p => p.Name.Contains(search) || p.Description.Contains(search));
            }

            // Lọc theo danh mục
            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(p => p.Category == category);
            }

            var totalItems = await query.CountAsync();
            var skip = (page - 1) * pageSize;

            var pois = await query
                .Skip(skip)
                .Take(pageSize) // Dùng Take thay cho Limit
                .ToListAsync();

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
            var poi = await _context.Pois.FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
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

            _context.Pois.Add(newPoi);
            await _context.SaveChangesAsync();
            return StatusCode(201, newPoi);
        }

        // 4. Cập nhật POI (PUT /api/v1/pois/{id})
        [HttpPut("{id}")]
        [Authorize(Roles = "admin,super_admin,poi_owner")]
        public async Task<IActionResult> UpdatePoi(string id, [FromBody] UpdatePoiDto dto)
        {
            var existingPoi = await _context.Pois.FirstOrDefaultAsync(p => p.Id == id);

            if (existingPoi == null)
            {
                return NotFound(new { message = "Không tìm thấy điểm tham quan" });
            }

            if (!string.IsNullOrEmpty(dto.Name)) existingPoi.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.Category)) existingPoi.Category = dto.Category;
            if (!string.IsNullOrEmpty(dto.Description)) existingPoi.Description = dto.Description;
            if (!string.IsNullOrEmpty(dto.Address)) existingPoi.Address = dto.Address;
            if (dto.Latitude.HasValue) existingPoi.Latitude = dto.Latitude.Value;
            if (dto.Longitude.HasValue) existingPoi.Longitude = dto.Longitude.Value;
            if (dto.Images != null) existingPoi.Images = dto.Images;
            if (dto.IsActive.HasValue) existingPoi.IsActive = dto.IsActive.Value;

            await _context.SaveChangesAsync();

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
            var poi = await _context.Pois.FirstOrDefaultAsync(p => p.Id == id);

            if (poi == null)
            {
                return NotFound(new { message = "Không tìm thấy điểm tham quan để xóa" });
            }

            _context.Pois.Remove(poi);
            await _context.SaveChangesAsync();

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

            var existingPoi = await _context.Pois.FirstOrDefaultAsync(p => p.Id == id);
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

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tải ảnh lên thành công!",
                imageUrl = imageUrl,
                data = existingPoi
            });
        }
    }
}