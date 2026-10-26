using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace tuan1_2_tv2_cnpm.Controllers;

[ApiController]
[Route("api/v1")]
public class PresenceController : ControllerBase
{
    // Lưu trữ session theo dạng Key-Value (SessionId - Thời điểm cập nhật cuối)
    private static readonly ConcurrentDictionary<string, DateTime> _activeSessions = new();

    [HttpPost("presence/heartbeat")]
    public IActionResult Heartbeat([FromBody] HeartbeatRequestDto request)
    {
        if (string.IsNullOrEmpty(request.SessionId)) return BadRequest();

        // Cập nhật hoặc thêm mới thời gian hoạt động của SessionId
        _activeSessions.AddOrUpdate(request.SessionId, DateTime.UtcNow, (key, oldValue) => DateTime.UtcNow);

        return Ok(new { success = true });
    }

    [Authorize(Roles = "admin")]
    [HttpGet("admin/presence")]
    public IActionResult GetOnlinePresence()
    {
        var cutoffTime = DateTime.UtcNow.AddSeconds(-90);

        // Lọc các phiên có hoạt động trong 90s qua
        var activeUsers = _activeSessions
            .Where(x => x.Value >= cutoffTime)
            .Select(x => new { sessionId = x.Key, lastActive = x.Value })
            .ToList();

        // (Tùy chọn) Dọn dẹp rác bộ nhớ cho các phiên đã out quá lâu
        var expiredKeys = _activeSessions.Where(x => x.Value < cutoffTime).Select(x => x.Key).ToList();
        foreach (var key in expiredKeys) _activeSessions.TryRemove(key, out _);

        return Ok(new
        {
            totalOnline = activeUsers.Count,
            sessions = activeUsers
        });
    }
}

public class HeartbeatRequestDto
{
    public string SessionId { get; set; } = null!;
}