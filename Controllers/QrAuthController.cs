using Microsoft.AspNetCore.Mvc;
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
    private readonly IConfiguration _configuration; // Thêm IConfiguration để đọc appsettings.json

    // Tiêm IConfiguration vào constructor
    public QrAuthController(IDistributedCache cache, IConfiguration configuration)
    {
        _cache = cache;
        _configuration = configuration;
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
    [HttpPost("scan")]
    public async Task<IActionResult> ScanAndApprove([FromBody] ScanQrRequestDto dto, [FromQuery] string userId)
    {
        var cacheKey = $"QrSession_{dto.SessionId}";
        var json = await _cache.GetStringAsync(cacheKey);

        if (string.IsNullOrEmpty(json))
        {
            return BadRequest(new { message = "Mã QR không tồn tại hoặc đã hết hạn." });
        }

        // --- TẠO JWT TOKEN CHUẨN XÁC ---
        var tokenHandler = new JwtSecurityTokenHandler();

        // Đọc SecretKey từ file cấu hình (appsettings.json)
        var secretKey = _configuration["JwtSettings:SecretKey"];
        if (string.IsNullOrEmpty(secretKey))
        {
            return StatusCode(500, new { message = "Lỗi cấu hình Backend: Chưa khai báo JwtSettings:SecretKey" });
        }

        var key = Encoding.ASCII.GetBytes(secretKey);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, "admin") // Gắn quyền admin vào Token
            }),
            Expires = DateTime.UtcNow.AddDays(7), // Token có hạn 7 ngày
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var securityToken = tokenHandler.CreateToken(tokenDescriptor);
        var jwtToken = tokenHandler.WriteToken(securityToken);
        // ---------------------------------

        var updatedSession = new
        {
            SessionId = dto.SessionId,
            Status = "Approved",
            UserId = userId,
            Token = jwtToken // Lưu token chuẩn vào Redis
        };

        // Cập nhật lại trạng thái thành Approved trên Redis (giữ trong 1 phút để trình duyệt kịp lấy token)
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(updatedSession), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1)
        });

        return Ok(new { message = "Xác nhận đăng nhập thành công trên Web qua mã QR!" });
    }
}