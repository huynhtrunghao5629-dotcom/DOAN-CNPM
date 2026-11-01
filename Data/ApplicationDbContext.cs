using HueSmartTourism.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HueSmartTourism.Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // Khai báo các bảng sẽ xuất hiện trong MySQL
        public DbSet<Poi> Pois { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Itinerary> Itineraries { get; set; }
    }
}