using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Dùng EF Core thay MongoDB
using HueSmartTourism.Backend.Models;
using HueSmartTourism.Backend.Data; // Thêm ApplicationDbContext
using System.Security.Claims;

namespace HueSmartTourism.Backend.Controllers
{
    [Route("api/v1/itineraries")]
    [ApiController]
    [Authorize]
    public class ItineraryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ItineraryController(ApplicationDbContext context)
        {
            _context = context;
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

            _context.Itineraries.Add(itinerary);
            await _context.SaveChangesAsync();

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

            var itineraries = await _context.Itineraries
                .Where(i => i.UserId == userId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(itineraries);
        }

        // 3. Lấy chi tiết 1 lịch trình (kèm thông tin POI chi tiết)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetItineraryById(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var itinerary = await _context.Itineraries.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (itinerary == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch trình." });
            }

            // Lấy thông tin chi tiết của các POI có trong lịch trình
            var poiIds = itinerary.Items.Select(item => item.PoiId).Distinct().ToList();
            var pois = await _context.Pois.Where(p => poiIds.Contains(p.Id)).ToListAsync();

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
            var itinerary = await _context.Itineraries.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (itinerary == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch trình." });
            }

            var poiExists = await _context.Pois.AnyAsync(p => p.Id == dto.PoiId && p.IsActive);
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

            itinerary.Items.Add(newItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã thêm điểm tham quan vào lịch trình thành công!" });
        }

        // 5. Xóa lịch trình
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItinerary(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var itinerary = await _context.Itineraries.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (itinerary == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch trình hoặc bạn không có quyền xóa." });
            }

            _context.Itineraries.Remove(itinerary);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa lịch trình thành công!" });
        }
    }
}