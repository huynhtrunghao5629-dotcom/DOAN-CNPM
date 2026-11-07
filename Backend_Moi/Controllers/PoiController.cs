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

        private static readonly HashSet<string> SupportedLanguages =
            new(StringComparer.OrdinalIgnoreCase) { "vi", "en", "zh", "ja", "ko" };

        // Keep API response compatible with React: each POI has narrations.{vi,en,zh,ja,ko}.
        // Query texts separately: avoids JOIN collation mismatch of existing MySQL schema.
        private async Task<object[]> WithNarrationsAsync(IEnumerable<Poi> items)
        {
            var list = items.ToList();
            if (list.Count == 0) return Array.Empty<object>();
            var ids = list.Select(p => p.Id).ToArray();
            var texts = await _context.PoiNarrations.AsNoTracking()
                .Where(n => ids.Contains(n.PoiId)).ToListAsync();
            var lookup = texts.GroupBy(n => n.PoiId).ToDictionary(g => g.Key, g =>
                g.ToDictionary(n => n.LanguageCode, n => new { text = n.Text, audioUrl = n.AudioUrl },
                    StringComparer.OrdinalIgnoreCase));

            return list.Select(p => (object)new
            {
                p.Id, p.Name, p.Category, p.Description, p.Address,
                p.Latitude, p.Longitude, p.Images, p.IsActive, p.CreatedAt,
                p.Radius, p.Narration, p.AverageRating, p.TotalReviews,
                narrations = lookup.TryGetValue(p.Id, out var values) ? values :
                    new Dictionary<string, object>() as object
            }).ToArray();
        }

        private async Task SaveNarrationsAsync(string poiId,
            Dictionary<string, PoiNarrationDto> narrations)
        {
            foreach (var (rawLang, content) in narrations)
            {
                var lang = rawLang.Trim().ToLowerInvariant();
                if (!SupportedLanguages.Contains(lang) || content == null) continue;
                var current = await _context.PoiNarrations.FindAsync(poiId, lang);
                if (current == null)
                {
                    _context.PoiNarrations.Add(new PoiNarration
                    {
                        PoiId = poiId, LanguageCode = lang,
                        Text = content.Text ?? string.Empty,
                        AudioUrl = content.AudioUrl
                    });
                }
                else
                {
                    if (content.Text != null) current.Text = content.Text;
                    if (content.AudioUrl != null) current.AudioUrl = content.AudioUrl;
                }
            }
            await _context.SaveChangesAsync();
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

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);
            var totalItems = await query.CountAsync();
            var skip = (page - 1) * pageSize;

            var pois = await query
                .Skip(skip)
                .Take(pageSize) // Dùng Take thay cho Limit
                .AsNoTracking()
                .ToListAsync();

            var data = await WithNarrationsAsync(pois);
            return Ok(new
            {
                totalItems = totalItems,
                page = page,
                pageSize = pageSize,
                totalPages = (int)Math.Ceiling((double)totalItems / pageSize),
                data = data
            });
        }

        // 2. Xem chi tiết 1 điểm tham quan
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPoiById(string id)
        {
            var poi = await _context.Pois.FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
            if (poi == null) return NotFound(new { message = "Không tìm thấy điểm tham quan" });
            return Ok((await WithNarrationsAsync(new[] { poi })).First());
        }

        // 3. Tạo mới POI (Chỉ Admin hoặc Poi Owner mới được tạo)
        [HttpPost]
        [Authorize(Roles = "admin,super_admin")]
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
                Images = dto.Images ?? new List<string>(),
                Radius = dto.Radius,
                Narration = dto.Narration
            };

            _context.Pois.Add(newPoi);
            await _context.SaveChangesAsync();
            if (dto.Narrations != null)
                await SaveNarrationsAsync(newPoi.Id, dto.Narrations);
            return StatusCode(201, (await WithNarrationsAsync(new[] { newPoi })).First());
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
            if (dto.Radius.HasValue) existingPoi.Radius = dto.Radius;
            if (dto.Narration != null) existingPoi.Narration = dto.Narration;

            await _context.SaveChangesAsync();
            if (dto.Narrations != null)
                await SaveNarrationsAsync(existingPoi.Id, dto.Narrations);

            return Ok(new
            {
                message = "Cập nhật điểm tham quan thành công",
                data = (await WithNarrationsAsync(new[] { existingPoi })).First()
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

            // Clean up multilingual texts before deleting the POI.
            var texts = await _context.PoiNarrations.Where(n => n.PoiId == id).ToListAsync();
            _context.PoiNarrations.RemoveRange(texts);
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
                data = (await WithNarrationsAsync(new[] { existingPoi })).First()
            });
        }
    }
}