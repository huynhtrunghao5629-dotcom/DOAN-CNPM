using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Thêm EF Core
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Data; // Thêm ApplicationDbContext
using System.Security.Claims;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/pois/{poiId}/reviews")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly ApplicationDbContext _context; // Đổi MongoDbService thành ApplicationDbContext

        public ReviewController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách đánh giá của một POI (Ai cũng xem được)
        [HttpGet]
        public async Task<IActionResult> GetReviewsByPoiId(string poiId)
        {
            // Đổi cú pháp truy vấn
            var reviews = await _context.Reviews
                .Where(r => r.PoiId == poiId)
                .OrderByDescending(r => r.CreatedAt) // Đổi SortByDescending thành OrderByDescending
                .ToListAsync();

            return Ok(reviews);
        }

        // 2. Gửi đánh giá & bình luận mới (Cần đăng nhập)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReview(string poiId, [FromBody] CreateReviewDto dto)
        {
            if (dto.Rating < 1 || dto.Rating > 5)
            {
                return BadRequest(new { message = "Số sao đánh giá phải từ 1 đến 5." });
            }

            // Đổi cú pháp truy vấn EF Core
            var poi = await _context.Pois.FirstOrDefaultAsync(p => p.Id == poiId);
            if (poi == null)
            {
                return NotFound(new { message = "Không tìm thấy điểm tham quan." });
            }

            // Lấy thông tin user từ JWT Token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value ?? "Người dùng";

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            // Tạo review mới
            var review = new Review
            {
                PoiId = poiId,
                UserId = userId,
                UserName = userName,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            // Dùng Add thay cho InsertOneAsync
            _context.Reviews.Add(review);

            // Cập nhật điểm cho Poi
            var allReviews = await _context.Reviews.Where(r => r.PoiId == poiId).ToListAsync();
            // Cộng thêm review hiện tại vì nó chưa được lưu vào DB (SaveChanges chưa chạy)
            allReviews.Add(review);

            poi.TotalReviews = allReviews.Count;
            poi.AverageRating = Math.Round(allReviews.Average(r => r.Rating), 1);

            // Chỉ cần gọi 1 lệnh SaveChangesAsync để lưu cả Review và Poi cùng lúc
            await _context.SaveChangesAsync();

            return StatusCode(201, new
            {
                message = "Đánh giá thành công!",
                data = review
            });
        }
    }
}