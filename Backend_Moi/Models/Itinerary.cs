using System.ComponentModel.DataAnnotations;

namespace HueSmartTourism.Backend.Models
{
    public class ItineraryItem
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public int DayNumber { get; set; }
        public string PoiId { get; set; } = null!;
        public string Note { get; set; } = string.Empty;
        public string VisitTime { get; set; } = string.Empty;
    }

    public class Itinerary
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<ItineraryItem> Items { get; set; } = new List<ItineraryItem>();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateItineraryDto
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class AddPoiToItineraryDto
    {
        public int DayNumber { get; set; }
        public string PoiId { get; set; } = null!;
        public string Note { get; set; } = string.Empty;
        public string VisitTime { get; set; } = string.Empty;
    }
}