using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore; // Thêm thư viện EF Core thay cho MongoDB.Driver
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Data; // Đổi từ Services sang Data chứa ApplicationDbContext

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/admin")]
    [ApiController]
    [Authorize(Roles = "admin,super_admin")]
    [EnableRateLimiting("fixed")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context; // Đổi biến MongoDbService thành ApplicationDbContext

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Xem thống kê tổng quan (Dashboard Stats)
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            // Thay CountDocumentsAsync(_ => true) thành CountAsync()
            var totalPois = await _context.Pois.CountAsync();
            var totalUsers = await _context.Users.CountAsync();
            var totalReviews = await _context.Reviews.CountAsync();
            var totalItineraries = await _context.Itineraries.CountAsync();

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
            // Thay Find(_ => true).ToListAsync() thành ToListAsync() của EF Core
            var users = await _context.Users.ToListAsync();
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
            // Thay Find(u => u.Id == userId).FirstOrDefaultAsync() thành FirstOrDefaultAsync
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy người dùng." });
            }

            // Entity Framework quản lý trạng thái tự động, chỉ cần gán giá trị mới
            user.IsActive = !user.IsActive;

            // Và gọi SaveChangesAsync() để thực thi lệnh UPDATE xuống MySQL
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = user.IsActive ? "Đã kích hoạt tài khoản thành công!" : "Đã khóa tài khoản thành công!",
                isActive = user.IsActive
            });
        }
    }
}