using Microsoft.EntityFrameworkCore;
using Property.Models;

namespace Property.Data;

public class PropertyDbContext : DbContext
{
    public PropertyDbContext(DbContextOptions<PropertyDbContext> options) : base(options)
    {
    }

    public DbSet<Province> Provinces => Set<Province>();
    public DbSet<Favorite> Favorites => Set<Favorite>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Province>(entity =>
        {
            entity.ToTable("provincias");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).HasColumnName("id");
            entity.Property(p => p.CodeIne).HasColumnName("codigo_ine").HasMaxLength(2).IsRequired();
            entity.HasIndex(p => p.CodeIne).IsUnique();
            entity.Property(p => p.Name).HasColumnName("nombre").IsRequired();
            entity.Property(p => p.AutonomousCommunity).HasColumnName("comunidad_autonoma").IsRequired();
            entity.Property(p => p.Population).HasColumnName("poblacion").IsRequired();
        });

        modelBuilder.Entity<Favorite>(entity =>
        {
            entity.ToTable("favoritos");
            entity.HasKey(f => f.Id);
            entity.Property(f => f.Id).HasColumnName("id");
            entity.Property(f => f.UserId).HasColumnName("usuario_id").IsRequired();
            entity.Property(f => f.ProvinceCode).HasColumnName("codigo_provincia").HasMaxLength(2).IsRequired();
            entity.Property(f => f.CreatedAt).HasColumnName("fecha_creacion").IsRequired();

            entity.HasIndex(f => new { f.UserId, f.ProvinceCode }).IsUnique();

            entity.HasOne<Province>()
                .WithMany()
                .HasForeignKey(f => f.ProvinceCode)
                .HasPrincipalKey(p => p.CodeIne)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}