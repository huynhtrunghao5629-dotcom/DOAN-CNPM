using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MongoDB.Driver;
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;
        private readonly IConfiguration _configuration;

        public AuthController(MongoDbService mongoDbService, IConfiguration configuration)
        {
            _mongoDbService = mongoDbService;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto dto)
        {
            var existingUser = await _mongoDbService.Users.Find(u => u.Email == dto.Email).FirstOrDefaultAsync();
            if (existingUser != null)
            {
                return BadRequest(new { message = "Email này đã được đăng ký" });
            }

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var newUser = new User
            {
                Email = dto.Email,
                FullName = dto.FullName,
                HashedPassword = hashedPassword,
                RoleCode = "user"
            };

            await _mongoDbService.Users.InsertOneAsync(newUser);
            newUser.HashedPassword = ""; // Ẩn mật khẩu khi trả về
            return StatusCode(201, newUser);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto dto)
        {
            var user = await _mongoDbService.Users.Find(u => u.Email == dto.Email).FirstOrDefaultAsync();
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.HashedPassword))
            {
                return BadRequest(new { message = "Email hoặc mật khẩu không đúng" });
            }

            var accessToken = GenerateJwtToken(user, "access");
            var refreshToken = GenerateJwtToken(user, "refresh");

            // Lưu JWT vào httpOnly Cookie
            Response.Cookies.Append("access_token", accessToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // Đổi thành true khi chạy Production (HTTPS)
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddMinutes(30)
            });

            Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(new { message = "Đăng nhập thành công", role_code = user.RoleCode });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("access_token");
            Response.Cookies.Delete("refresh_token");
            return Ok(new { message = "Đăng xuất thành công" });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _mongoDbService.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            user.HashedPassword = "";
            return Ok(user);
        }

        private string GenerateJwtToken(User user, string type)
        {
            var secretKey = _configuration["JwtSettings:SecretKey"]!;
            var key = Encoding.ASCII.GetBytes(secretKey);
            var expireMinutes = type == "access" ? int.Parse(_configuration["JwtSettings:AccessTokenExpireMinutes"]!) : 10080;

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id!),
                    new Claim(ClaimTypes.Role, user.RoleCode),
                    new Claim("type", type)
                }),
                Expires = DateTime.UtcNow.AddMinutes(expireMinutes),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}