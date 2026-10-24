using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting; // Bổ sung namespace này
using MongoDB.Driver;
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Services;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/admin")]
    [ApiController]
    [Authorize(Roles = "admin,super_admin")] // Chỉ cho phép admin hoặc super_admin truy cập
    [EnableRateLimiting("fixed")] // Áp dụng giới hạn tần suất gọi API
    public class AdminController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public AdminController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        // 1. Xem thống kê tổng quan (Dashboard Stats)
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalPois = await _mongoDbService.Pois.CountDocumentsAsync(_ => true);
            var totalUsers = await _mongoDbService.Users.CountDocumentsAsync(_ => true);
            var totalReviews = await _mongoDbService.Reviews.CountDocumentsAsync(_ => true);
            var totalItineraries = await _mongoDbService.Itineraries.CountDocumentsAsync(_ => true);

            return Ok(new
            {
                totalPois,
                totalUsers,
                totalReviews,
                totalItineraries,
                updatedAt = DateTime.UtcNow
            });
        }

        // 2. Lấy danh sách toàn bộ người dùng (Đã giấu HashedPassword)
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _mongoDbService.Users.Find(_ => true).ToListAsync();
            foreach (var u in users)
            {
                u.HashedPassword = ""; // Che mật khẩu an toàn
            }
            return Ok(users);
        }

        // 3. Khóa / Kích hoạt tài khoản người dùng (Toggle Active Status)
        [HttpPut("users/{userId}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(string userId)
        {
            var user = await _mongoDbService.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy người dùng." });
            }

            // Đảo ngược trạng thái IsActive
            var newStatus = !user.IsActive;
            var update = Builders<User>.Update.Set(u => u.IsActive, newStatus);
            await _mongoDbService.Users.UpdateOneAsync(u => u.Id == userId, update);

            return Ok(new
            {
                message = newStatus ? "Đã kích hoạt tài khoản thành công!" : "Đã khóa tài khoản thành công!",
                isActive = newStatus
            });
        }
    }
}