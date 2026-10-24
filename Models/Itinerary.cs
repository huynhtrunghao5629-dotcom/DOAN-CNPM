using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HueSmartTourism.Backend.Models
{
    public class ItineraryItem
    {
        public int DayNumber { get; set; } // Ngày thứ mấy trong chuyến đi (1, 2, 3...)

        [BsonRepresentation(BsonType.ObjectId)]
        public string PoiId { get; set; } = null!;

        public string Note { get; set; } = string.Empty; // Ghi chú riêng cho địa điểm này
        public string VisitTime { get; set; } = string.Empty; // Ví dụ: "08:00 AM"
    }

    public class Itinerary
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = null!;

        public string Title { get; set; } = null!; // Ví dụ: "Khám phá Huế 3 ngày 2 đêm"
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public List<ItineraryItem> Items { get; set; } = new List<ItineraryItem>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // --- DTOs ---

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