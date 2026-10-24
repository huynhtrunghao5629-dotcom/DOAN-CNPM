using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Services;
using System.Security.Claims;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/pois/{poiId}/reviews")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public ReviewController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        // 1. Lấy danh sách đánh giá của một POI (Ai cũng xem được)
        [HttpGet]
        public async Task<IActionResult> GetReviewsByPoiId(string poiId)
        {
            var reviews = await _mongoDbService.Reviews
                .Find(r => r.PoiId == poiId)
                .SortByDescending(r => r.CreatedAt)
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

            // Kiểm tra POI có tồn tại không
            var poiFilter = Builders<Poi>.Filter.Eq(p => p.Id, poiId);
            var poi = await _mongoDbService.Pois.Find(poiFilter).FirstOrDefaultAsync();
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

            await _mongoDbService.Reviews.InsertOneAsync(review);

            // Tính toán lại điểm trung bình (AverageRating) và tổng số review cho POI
            var allReviews = await _mongoDbService.Reviews.Find(r => r.PoiId == poiId).ToListAsync();
            poi.TotalReviews = allReviews.Count;
            poi.AverageRating = Math.Round(allReviews.Average(r => r.Rating), 1);

            await _mongoDbService.Pois.ReplaceOneAsync(poiFilter, poi);

            return StatusCode(201, new
            {
                message = "Đánh giá thành công!",
                data = review
            });
        }
    }
}