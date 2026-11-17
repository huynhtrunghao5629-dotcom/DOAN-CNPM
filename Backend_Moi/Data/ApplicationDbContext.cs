using HueSmartTourism.Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;

namespace HueSmartTourism.Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // Khai báo các bảng sẽ xuất hiện trong MySQL
        public DbSet<Poi> Pois { get; set; }
        public DbSet<PoiTranslation> PoiTranslations { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Itinerary> Itineraries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Bộ so sánh cho List<string> để EF Core phát hiện thay đổi phần tử chính xác
            var stringListComparer = new ValueComparer<List<string>>(
                (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
                c => c == null ? 0 : c.Aggregate(0, (a, v) => HashCode.Combine(a, v != null ? v.GetHashCode() : 0)),
                c => c == null ? new List<string>() : c.ToList()
            );

            // Cấu hình ánh xạ cho bảng Pois và chuyển đổi thuộc tính Images (List<string>) an toàn tuyệt đối
            modelBuilder.Entity<Poi>(entity =>
            {
                entity.ToTable("pois");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Images)
                    .HasColumnType("longtext") // Ép EF Core hiểu đây là cột text thông thường, không dùng Native JSON mapping
                    .HasConversion(
                        v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
                        v => string.IsNullOrEmpty(v) ? new List<string>() :
                             (v.TrimStart().StartsWith('[')
                                 ? (JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
                                 : new List<string> { v }) // Dự phòng an toàn nếu gặp chuỗi thường không phải mảng JSON
                    )
                    .Metadata.SetValueComparer(stringListComparer);
            });

            // Cấu hình bảng poitranslations khớp chuẩn trong database
            modelBuilder.Entity<PoiTranslation>(entity =>
            {
                entity.ToTable("poitranslations");
                entity.HasKey(x => x.TranslationId);

                // Ánh xạ chính xác tên các cột viết hoa
                entity.Property(x => x.TranslationId).HasColumnName("TranslationId").HasMaxLength(255);
                entity.Property(x => x.PoiId).HasColumnName("PoiId").HasMaxLength(255).IsRequired();
                entity.Property(x => x.LanguageCode).HasColumnName("LanguageCode").HasMaxLength(8).IsRequired();
                entity.Property(x => x.Title).HasColumnName("Title");
                entity.Property(x => x.Description).HasColumnName("Description").HasColumnType("longtext");
                entity.Property(x => x.AudioUrl).HasColumnName("AudioUrl").HasColumnType("longtext");
            });
        }
    }
}