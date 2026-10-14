using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HueSmartTourism.Backend.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("email")]
        public string Email { get; set; } = null!;

        [BsonElement("full_name")]
        public string FullName { get; set; } = null!;

        [BsonElement("hashed_password")]
        public string HashedPassword { get; set; } = null!;

        [BsonElement("role_code")]
        public string RoleCode { get; set; } = "user"; // user, admin, super_admin, poi_owner

        [BsonElement("is_active")]
        public bool IsActive { get; set; } = true;

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class UserRegisterDto
    {
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class UserLoginDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}