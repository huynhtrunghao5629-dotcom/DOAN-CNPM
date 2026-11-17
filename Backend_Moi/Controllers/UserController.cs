using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Thêm EF Core
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Data; // Thêm ApplicationDbContext
using System.Security.Claims;
using BCrypt.Net;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/users")]
    [ApiController]
    [Authorize] // Yêu cầu đăng nhập token
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context; // Đổi MongoDbService thành ApplicationDbContext

        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Lấy thông tin cá nhân (Profile)
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(new { message = "Người dùng không tồn tại." });
            }

            var profile = new UserProfileDto
            {
                Id = user.Id!,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                RoleCode = user.RoleCode,
                CreatedAt = user.CreatedAt
            };

            return Ok(profile);
        }

        // 2. Cập nhật thông tin cá nhân (Họ tên, SĐT)
        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(new { message = "Người dùng không tồn tại." });
            }

            // Gán giá trị mới
            user.FullName = dto.FullName;
            user.PhoneNumber = dto.PhoneNumber ?? string.Empty;

            // EF Core sẽ tự ghi nhận thay đổi và thực thi lệnh UPDATE trong MySQL
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thông tin cá nhân thành công!" });
        }

        // 3. Đổi mật khẩu
        [HttpPost("me/change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(new { message = "Người dùng không tồn tại." });
            }

            // Kiểm tra mật khẩu hiện tại
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.HashedPassword);
            if (!isPasswordValid)
            {
                return BadRequest(new { message = "Mật khẩu hiện tại không chính xác." });
            }

            // Hash mật khẩu mới và lưu vào DB
            user.HashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đổi mật khẩu thành công!" });
        }
    }
}