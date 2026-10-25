namespace tuan1_2_tv2_cnpm.DTOs
{
    public class UpdatePoiDto
    {
        public string? Name { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string? Address { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public List<string>? Images { get; set; }
        public bool? IsActive { get; set; }

        public double? Radius { get; set; }
        public string? Narration { get; set; }
    }
}