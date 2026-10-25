namespace tuan1_2_tv2_cnpm.DTOs;

public class CreatePoiDto
{
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Address { get; set; } = null!;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public List<string>? Images { get; set; }
    public bool IsActive { get; set; } = true;

    // 2 trường mới bổ sung cho Frontend
    public double? Radius { get; set; } = 50;
    public string? Narration { get; set; }
}