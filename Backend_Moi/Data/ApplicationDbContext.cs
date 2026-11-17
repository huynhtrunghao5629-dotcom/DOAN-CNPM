using HueSmartTourism.Backend.Models;
using Microsoft.EntityFrameworkCore;

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

    // Cấu hình ánh xạ cho bảng Pois và chuyển đổi thuộc tính Images (List<string>) an toàn tuyệt đối
    modelBuilder.Entity<Poi>(entity =>
{
    entity.ToTable("pois");
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Images)
        .HasColumnType("longtext") // Ép EF Core hiểu đây là cột text thông thường, không dùng Native JSON mapping
        .HasConversion(
            v => System.Text.Json.JsonSerializer.Serialize(v ?? new List<string>(), (System.Text.Json.JsonSerializerOptions?)null),
            v => string.IsNullOrEmpty(v) ? new List<string>() : 
                 (v.TrimStart().StartsWith('[') 
                     ? (System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()) 
                     : new List<string> { v }) // Dự phòng an toàn nếu gặp chuỗi thường không phải mảng JSON
        );
});

    // Cấu hình bảng poitranslations khớp chuẩn trong database
modelBuilder.Entity<PoiTranslation>(entity =>
{
    entity.ToTable("poitranslations"); // Hoặc "poitranslations" tùy theo tên bảng thực tế trong DB của bạn
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