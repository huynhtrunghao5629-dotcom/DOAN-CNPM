using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HueSmartTourism.Backend.Models
{
    public class Poi
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; } = null!; // Tên địa điểm (VD: Đại Nội Huế)

        [BsonElement("category")]
        public string Category { get; set; } = null!; // Danh mục: "Di tích", "Ẩm thực", "Khách sạn"...

        [BsonElement("description")]
        public string Description { get; set; } = null!; // Mô tả chi tiết

        [BsonElement("address")]
        public string Address { get; set; } = null!; // Địa chỉ

        [BsonElement("latitude")]
        public double Latitude { get; set; } // Tọa độ Vĩ độ

        [BsonElement("longitude")]
        public double Longitude { get; set; } // Tọa độ Kinh độ

        [BsonElement("images")]
        public List<string> Images { get; set; } = new(); // Danh sách link hình ảnh

        [BsonElement("is_active")]
        public bool IsActive { get; set; } = true;

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreatePoiDto
    {
        public string Name { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Address { get; set; } = null!;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public List<string>? Images { get; set; }
    }
}