using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Services;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/admin")]
    [ApiController]
    [Authorize(Roles = "admin,super_admin")]
    public class AdminController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public AdminController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _mongoDbService.Users.Find(_ => true).ToListAsync();
            foreach (var u in users)
            {
                u.HashedPassword = ""; // Che mật khẩu
            }
            return Ok(users);
        }
    }
}