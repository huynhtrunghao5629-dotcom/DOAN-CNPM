namespace HueSmartTourism.Backend.Models
{
    public class PoiNarration
    {
        public string PoiId { get; set; } = string.Empty;
        public string LanguageCode { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string? AudioUrl { get; set; }
    }
}
