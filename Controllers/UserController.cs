using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Services;
using System.Security.Claims;
using BCrypt.Net;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/users")]
    [ApiController]
    [Authorize] // Yêu cầu đăng nhập token
    public class UserController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public UserController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
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

            var user = await _mongoDbService.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
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

            var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
            var update = Builders<User>.Update
                .Set(u => u.FullName, dto.FullName)
                .Set(u => u.PhoneNumber, dto.PhoneNumber ?? string.Empty);

            var result = await _mongoDbService.Users.UpdateOneAsync(filter, update);

            if (result.MatchedCount == 0)
            {
                return NotFound(new { message = "Người dùng không tồn tại." });
            }

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

            var user = await _mongoDbService.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
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
            string newPasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            var update = Builders<User>.Update.Set(u => u.HashedPassword, newPasswordHash);

            await _mongoDbService.Users.UpdateOneAsync(u => u.Id == userId, update);

            return Ok(new { message = "Đổi mật khẩu thành công!" });
        }
    }
}