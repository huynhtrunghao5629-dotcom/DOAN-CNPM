using System.ComponentModel.DataAnnotations;

namespace HueSmartTourism.Backend.Models
{
    public class User
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string HashedPassword { get; set; } = null!;
        public string PhoneNumber { get; set; } = string.Empty;
        public string RoleCode { get; set; } = "user";
        public bool IsActive { get; set; } = true;
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

    public class UserProfileDto
    {
        public string Id { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PhoneNumber { get; set; } = string.Empty;
        public string RoleCode { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateProfileDto
    {
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}