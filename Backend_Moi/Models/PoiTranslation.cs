using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HueSmartTourism.Backend.Models
{
    [Table("poi_translations")]
    public class PoiTranslation
    {
        [Key]
        [Column("translation_id")]
        public string TranslationId { get; set; } = Guid.NewGuid().ToString(); // Đảm bảo khai báo đúng tên này

        [Column("poi_id")]
        public string PoiId { get; set; } = string.Empty;

        [Column("language_code")]
        public string LanguageCode { get; set; } = "vi";

        [Column("title")]
        public string? Title { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("audio_url")]
        public string? AudioUrl { get; set; }
    }
}