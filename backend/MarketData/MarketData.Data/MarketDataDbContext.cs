using Microsoft.EntityFrameworkCore;
using MarketData.Data.Models;

namespace MarketData.Data;

public class MarketDataDbContext : DbContext
{
    public MarketDataDbContext(DbContextOptions<MarketDataDbContext> options) : base(options)
    {
    }

    public DbSet<HousingSale> HousingSales => Set<HousingSale>();
    public DbSet<AppraisedValue> AppraisedValues => Set<AppraisedValue>();
    public DbSet<CacheEntry> CacheEntries => Set<CacheEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<HousingSale>(entity =>
        {
            entity.ToTable("compraventas_vivienda");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProvinceCode).HasColumnName("codigo_provincia");
            entity.Property(e => e.Period).HasColumnName("periodo").HasColumnType("date");
            entity.Property(e => e.Regime).HasColumnName("regimen");
            entity.Property(e => e.HousingStatus).HasColumnName("estado_vivienda");
            entity.Property(e => e.OperationsCount).HasColumnName("numero_operaciones");
            entity.HasIndex(e => new { e.ProvinceCode, e.Period, e.Regime, e.HousingStatus }).IsUnique();
            entity.ToTable(t => t.HasCheckConstraint("ck_compraventas_regimen", "regimen IN ('libre', 'protegida')"));
            entity.ToTable(t => t.HasCheckConstraint("ck_compraventas_estado_vivienda", "estado_vivienda IN ('nueva', 'segunda_mano')"));
        });

        modelBuilder.Entity<AppraisedValue>(entity =>
        {
            entity.ToTable("valores_tasados");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProvinceCode).HasColumnName("codigo_provincia");
            entity.Property(e => e.Period).HasColumnName("periodo").HasColumnType("date");
            entity.Property(e => e.Age).HasColumnName("antiguedad_vivienda");
            entity.Property(e => e.PricePerSquareMeter).HasColumnName("precio_m2").HasColumnType("decimal(10,2)");
            entity.HasIndex(e => new { e.ProvinceCode, e.Period, e.Age }).IsUnique();
            entity.ToTable(t => t.HasCheckConstraint("ck_valores_tasados_antiguedad", "antiguedad_vivienda IN ('<=5', '>5')"));
        });

        modelBuilder.Entity<CacheEntry>(entity =>
        {
            entity.ToTable("datos_cache");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CacheKey).HasColumnName("clave_cache");
            entity.Property(e => e.Content).HasColumnName("contenido").HasColumnType("jsonb");
            entity.Property(e => e.ExpiresAt).HasColumnName("fecha_expiracion");
            entity.Property(e => e.CreatedAt).HasColumnName("fecha_creacion");
            entity.HasIndex(e => e.CacheKey).IsUnique();
        });
    }
}