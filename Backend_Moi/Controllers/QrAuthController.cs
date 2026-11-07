using HueSmartTourism.Backend.Data; // Thêm ApplicationDbContext
using HueSmartTourism.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Thêm EF Core
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.IdentityModel.Tokens;
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
    private readonly ApplicationDbContext _context; // Đổi IMongoCollection thành DbContext

    public QrAuthController(IDistributedCache cache, IConfiguration configuration, ApplicationDbContext context)
    {
        _cache = cache;
        _configuration = configuration;
        _context = context; // Nhận DbContext qua Constructor
    }

    // 1. Khởi tạo phiên QR
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateQrCode()
    {
        var sessionId = Guid.NewGuid().ToString();

        var qrSession = new
        {
            SessionId = sessionId,
            Status = "Pending",
            UserId = (string?)null,
            Token = (string?)null
        };

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(3)
        };

        await _cache.SetStringAsync($"QrSession_{sessionId}", JsonSerializer.Serialize(qrSession), options);

        var response = new QrSessionResponseDto
        {
            SessionId = sessionId,
            QrContent = $"huetourism://login?sessionId={sessionId}",
            ExpiresInSeconds = 180
        };

        return Ok(response);
    }

    // 2. Kiểm tra trạng thái phiên QR
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

        return Ok(new { status = status });
    }

    // 3. Ứng dụng di động quét mã và xác nhận phê duyệt đăng nhập
    [Authorize]
    [HttpPost("scan")]
    public async Task<IActionResult> ScanAndApprove([FromBody] ScanQrRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // Đổi cú pháp truy vấn sang LINQ của EF Core
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

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
                new Claim(ClaimTypes.Role, user.RoleCode)
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