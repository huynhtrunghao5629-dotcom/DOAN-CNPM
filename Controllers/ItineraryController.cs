using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Services;
using System.Security.Claims;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/itineraries")]
    [ApiController]
    [Authorize] // Yêu cầu đăng nhập
    public class ItineraryController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public ItineraryController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        // 1. Tạo chuyến đi mới
        [HttpPost]
        public async Task<IActionResult> CreateItinerary([FromBody] CreateItineraryDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            var itinerary = new Itinerary
            {
                UserId = userId,
                Title = dto.Title,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                CreatedAt = DateTime.UtcNow
            };

            await _mongoDbService.Itineraries.InsertOneAsync(itinerary);

            return StatusCode(201, new { message = "Tạo lịch trình thành công!", data = itinerary });
        }

        // 2. Lấy danh sách lịch trình của tôi
        [HttpGet]
        public async Task<IActionResult> GetMyItineraries()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            var itineraries = await _mongoDbService.Itineraries
                .Find(i => i.UserId == userId)
                .SortByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(itineraries);
        }

        // 3. Lấy chi tiết 1 lịch trình (kèm thông tin POI chi tiết)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetItineraryById(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var itinerary = await _mongoDbService.Itineraries.Find(i => i.Id == id && i.UserId == userId).FirstOrDefaultAsync();

            if (itinerary == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch trình." });
            }

            // Lấy thông tin chi tiết của các POI có trong lịch trình
            var poiIds = itinerary.Items.Select(item => item.PoiId).Distinct().ToList();
            var pois = await _mongoDbService.Pois.Find(p => poiIds.Contains(p.Id)).ToListAsync();

            var poiDictionary = pois.ToDictionary(p => p.Id!);

            var resultItems = itinerary.Items.Select(item => new
            {
                item.DayNumber,
                item.VisitTime,
                item.Note,
                Poi = poiDictionary.ContainsKey(item.PoiId) ? poiDictionary[item.PoiId] : null
            });

            return Ok(new
            {
                itinerary.Id,
                itinerary.Title,
                itinerary.Description,
                itinerary.StartDate,
                itinerary.EndDate,
                Items = resultItems
            });
        }

        // 4. Thêm điểm tham quan vào ngày cụ thể trong lịch trình
        [HttpPost("{id}/items")]
        public async Task<IActionResult> AddPoiToItinerary(string id, [FromBody] AddPoiToItineraryDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var itinerary = await _mongoDbService.Itineraries.Find(i => i.Id == id && i.UserId == userId).FirstOrDefaultAsync();

            if (itinerary == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch trình." });
            }

            // Kiểm tra POI có tồn tại không
            var poiExists = await _mongoDbService.Pois.Find(p => p.Id == dto.PoiId && p.IsActive).AnyAsync();
            if (!poiExists)
            {
                return NotFound(new { message = "Không tìm thấy điểm tham quan." });
            }

            var newItem = new ItineraryItem
            {
                DayNumber = dto.DayNumber,
                PoiId = dto.PoiId,
                Note = dto.Note,
                VisitTime = dto.VisitTime
            };

            var update = Builders<Itinerary>.Update.Push(i => i.Items, newItem);
            await _mongoDbService.Itineraries.UpdateOneAsync(i => i.Id == id, update);

            return Ok(new { message = "Đã thêm điểm tham quan vào lịch trình thành công!" });
        }

        // 5. Xóa lịch trình
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItinerary(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var result = await _mongoDbService.Itineraries.DeleteOneAsync(i => i.Id == id && i.UserId == userId);

            if (result.DeletedCount == 0)
            {
                return NotFound(new { message = "Không tìm thấy lịch trình hoặc bạn không có quyền xóa." });
            }

            return Ok(new { message = "Đã xóa lịch trình thành công!" });
        }
    }
}