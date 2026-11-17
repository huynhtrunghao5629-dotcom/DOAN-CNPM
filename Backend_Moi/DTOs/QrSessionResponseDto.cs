namespace tuan1_2_tv2_cnpm.DTOs;

public class QrSessionResponseDto
{
    public string SessionId { get; set; } = string.Empty;
    public string QrContent { get; set; } = string.Empty;
    public int ExpiresInSeconds { get; set; }
}