using HueSmartTourism.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace HueSmartTourism.Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // Khai báo các bảng sẽ xuất hiện trong MySQL
        public DbSet<Poi> Pois { get; set; }
        public DbSet<PoiNarration> PoiNarrations { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Itinerary> Itineraries { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<PoiNarration>(entity =>
            {
                entity.ToTable("PoiNarrations");
                entity.HasKey(x => new { x.PoiId, x.LanguageCode });
                entity.Property(x => x.PoiId).HasMaxLength(255).IsRequired();
                entity.Property(x => x.LanguageCode).HasMaxLength(8).IsRequired();
                entity.Property(x => x.Text).HasColumnType("longtext").IsRequired();
                entity.Property(x => x.AudioUrl).HasColumnType("longtext");
                // No FK constraint yet: existing tables have different collations.
            });
        }
    }
}