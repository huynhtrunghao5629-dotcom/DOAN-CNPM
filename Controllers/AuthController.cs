using Amazon.Runtime.Internal.Util;
using HueSmartTourism.Backend.Models; // Dùng đúng namespace của bạn
using HueSmartTourism.Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HueSmartTourism.Backend.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMongoCollection<User> _users;
    private readonly IConfiguration _configuration;

    public AuthController(MongoDbService mongoDbService, IConfiguration configuration)
    {
        _users = mongoDbService.Users;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginDto request) // Đổi thành UserLoginDto
    {
        var user = await _users.Find(u => u.Email == request.Email).FirstOrDefaultAsync();

        // Kiểm tra user có tồn tại, có đang Active không, và verify mật khẩu BCrypt
        if (user == null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(request.Password, user.HashedPassword))
        {
            return Unauthorized(new { message = "Email, mật khẩu không chính xác hoặc tài khoản đã bị khóa." });
        }

        var token = GenerateJwtToken(user);

        // Trả về token và thông tin cơ bản cho Frontend
        return Ok(new
        {
            token,
            role = user.RoleCode,
            fullName = user.FullName
        });
    }

    private string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["JwtSettings:SecretKey"]!);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id!),
                new Claim(ClaimTypes.Role, user.RoleCode) // Dùng RoleCode từ Model của bạn
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}