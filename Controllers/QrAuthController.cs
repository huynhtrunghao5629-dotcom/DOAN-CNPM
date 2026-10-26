using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using tuan1_2_tv2_cnpm.DTOs;

namespace tuan1_2_tv2_cnpm.Controllers;

[ApiController]
[Route("api/v1/auth/qr")]
public class QrAuthController : ControllerBase
{
    private readonly IDistributedCache _cache;
    private readonly IConfiguration _configuration;

    // THÊM DÒNG NÀY ĐỂ HẾT LỖI _users
    private readonly IMongoCollection<User> _users;

    // Truyền MongoDbService vào constructor
    public QrAuthController(IDistributedCache cache, IConfiguration configuration, MongoDbService mongoDbService)
    {
        _cache = cache;
        _configuration = configuration;

        // Gọi trực tiếp thuộc tính Users mà bạn đã viết sẵn trong MongoDbService
        _users = mongoDbService.Users;
    }

    // 1. Khởi tạo phiên QR (Trình duyệt gọi khi vào trang đăng nhập)
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateQrCode()
    {
        var sessionId = Guid.NewGuid().ToString();

        var qrSession = new
        {
            SessionId = sessionId,
            Status = "Pending", // Trạng thái ban đầu chờ quét
            UserId = (string?)null,
            Token = (string?)null
        };

        // Cấu hình thời hạn lưu trên Redis là 3 phút (180 giây)
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(3)
        };

        // Lưu vào Redis với tiền tố khóa rõ ràng
        await _cache.SetStringAsync($"QrSession_{sessionId}", JsonSerializer.Serialize(qrSession), options);

        var response = new QrSessionResponseDto
        {
            SessionId = sessionId,
            QrContent = $"huetourism://login?sessionId={sessionId}", // Nội dung mã QR để app mobile nhận diện
            ExpiresInSeconds = 180
        };

        return Ok(response);
    }

    // 2. Kiểm tra trạng thái phiên QR (Trình duyệt gọi liên tục - Polling để chờ duyệt)
    [HttpGet("status/{sessionId}")]
    public async Task<IActionResult> CheckQrStatus(string sessionId)
    {
        var json = await _cache.GetStringAsync($"QrSession_{sessionId}");
        if (string.IsNullOrEmpty(json))
        {
            return BadRequest(new { message = "Mã QR đã hết hạn hoặc không tồn tại." });
        }

        var sessionData = JsonSerializer.Deserialize<JsonElement>(json);
        var status = sessionData.GetProperty("Status").GetString();

        if (status == "Approved")
        {
            var token = sessionData.GetProperty("Token").GetString();
            return Ok(new { status = "Approved", token });
        }

        return Ok(new { status = status }); // Trả về trạng thái hiện tại (Pending / Scanned)
    }

    // 3. Ứng dụng di động quét mã và xác nhận phê duyệt đăng nhập
    [Authorize] // Bắt buộc Mobile App phải có Token hợp lệ mới được quét QR đăng nhập Web
    [HttpPost("scan")]
    public async Task<IActionResult> ScanAndApprove([FromBody] ScanQrRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();

        // Kiểm tra IsActive theo Model của bạn
        if (user == null || !user.IsActive) return Unauthorized(new { message = "User không tồn tại hoặc bị khóa." });

        var cacheKey = $"QrSession_{dto.SessionId}";
        var json = await _cache.GetStringAsync(cacheKey);
        if (string.IsNullOrEmpty(json)) return BadRequest(new { message = "Mã QR không tồn tại hoặc đã hết hạn." });

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["JwtSettings:SecretKey"]!);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id!),
                new Claim(ClaimTypes.Role, user.RoleCode) // Ánh xạ RoleCode chuẩn từ DB
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var jwtToken = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor));

        var updatedSession = new
        {
            SessionId = dto.SessionId,
            Status = "Approved",
            UserId = user.Id,
            Token = jwtToken
        };

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(updatedSession), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1)
        });

        return Ok(new { message = "Xác nhận đăng nhập Web thành công!" });
    }
}