using System.ComponentModel.DataAnnotations;
// Xóa bỏ hoàn toàn using MongoDB.Bson và MongoDB.Bson.Serialization.Attributes

namespace HueSmartTourism.Backend.Models
{
    public class Poi
    {
        [Key] // Đánh dấu đây là Khóa chính (Primary Key) cho MySQL
        public string Id { get; set; } = Guid.NewGuid().ToString(); // Tự động sinh ID duy nhất thay vì dùng ObjectId của Mongo

        [Required]
        public string Name { get; set; } = null!; // Tên địa điểm (VD: Đại Nội Huế)

        [Required]
        public string Category { get; set; } = null!; // Danh mục: "Di tích", "Ẩm thực", "Khách sạn"...

        public string Description { get; set; } = null!; // Mô tả chi tiết

        public string Address { get; set; } = null!; // Địa chỉ

        public double Latitude { get; set; } // Tọa độ Vĩ độ

        public double Longitude { get; set; } // Tọa độ Kinh độ

        // Với .NET 8, Entity Framework sẽ tự động ánh xạ List<string> thành cột định dạng JSON trong MySQL
        public List<string> Images { get; set; } = new(); // Danh sách link hình ảnh

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public double? Radius { get; set; } = 50; // Mặc định 50m

        public string? Narration { get; set; }

        public double AverageRating { get; set; } = 0;
        public int TotalReviews { get; set; } = 0;
    }
}