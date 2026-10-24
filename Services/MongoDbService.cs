using Microsoft.Extensions.Options;
using MongoDB.Driver;
using HueSmartTourism.Backend.Models;

namespace HueSmartTourism.Backend.Services
{
    public class MongoDbService
    {
        private readonly IMongoDatabase _database;

        public MongoDbService(IOptions<MongoDbSettings> mongoDbSettings)
        {
            var client = new MongoClient(mongoDbSettings.Value.ConnectionString);
            _database = client.GetDatabase(mongoDbSettings.Value.DatabaseName);
        }

        // Collection lưu trữ Điểm tham quan
        public IMongoCollection<Poi> Pois => _database.GetCollection<Poi>("pois");

        // Collection lưu trữ Người dùng (User)
        public IMongoCollection<User> Users => _database.GetCollection<User>("users");

        // Collection lưu trữ Đánh giá & Bình luận (Review)
        public IMongoCollection<Review> Reviews => _database.GetCollection<Review>("reviews");

        // Collection lưu trữ Lịch trình (Itinerary)
        public IMongoCollection<Itinerary> Itineraries => _database.GetCollection<Itinerary>("itineraries");
    }
}