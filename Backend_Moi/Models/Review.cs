using System.ComponentModel.DataAnnotations;

namespace HueSmartTourism.Backend.Models
{
    public class Review
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string PoiId { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public int Rating { get; set; }
        public string Comment { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateReviewDto
    {
        public int Rating { get; set; }
        public string Comment { get; set; } = null!;
    }
}