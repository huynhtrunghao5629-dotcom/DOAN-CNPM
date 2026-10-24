using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using tuan1_2_tv2_cnpm.DTOs;

namespace tuan1_2_tv2_cnpm.Controllers;

[ApiController]
[Route("api/v1/auth/qr")]
public class QrAuthController : ControllerBase
{
    private readonly IDistributedCache _cache;

    public QrAuthController(IDistributedCache cache)
    {
        _cache = cache;
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

        // Tạo JWT Token giả định cho user sau khi quét thành công (hoặc dùng JwtTokenService của bạn)
        var jwtToken = $"Bearer_Token_For_User_{userId}";

        var updatedSession = new
        {
            SessionId = dto.SessionId,
            Status = "Approved",
            UserId = userId,
            Token = jwtToken
        };

        // Cập nhật lại trạng thái thành Approved trên Redis (giữ trong 1 phút để trình duyệt kịp lấy token)
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(updatedSession), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1)
        });

        return Ok(new { message = "Xác nhận đăng nhập thành công trên Web qua mã QR!" });
    }
}