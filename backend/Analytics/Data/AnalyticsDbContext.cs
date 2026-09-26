using Microsoft.EntityFrameworkCore;
using Analytics.Models;

namespace Analytics.Data;

public class AnalyticsDbContext : DbContext
{
    public AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options) : base(options)
    {
    }

    public DbSet<PropertyScore> PropertyScores => Set<PropertyScore>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PropertyScore>(entity =>
        {
            entity.ToTable("property_scores");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).HasColumnName("id");
            entity.Property(p => p.ProvinceCode).HasColumnName("codigo_provincia").HasMaxLength(2).IsRequired();
            entity.Property(p => p.Period).HasColumnName("periodo").HasColumnType("date");
            entity.Property(p => p.PriceIndex).HasColumnName("indice_precio").HasColumnType("decimal(6,2)");
            entity.Property(p => p.PriceIndexNationalRanking).HasColumnName("indice_precio_ranking_nacional").HasColumnType("decimal(6,2)");
            entity.Property(p => p.PriceTrendIndex).HasColumnName("indice_tendencia_precio").HasColumnType("decimal(6,2)");
            entity.Property(p => p.PriceTrendIndexYearOverYear).HasColumnName("indice_tendencia_precio_interanual").HasColumnType("decimal(6,2)");
            entity.Property(p => p.ActivityIndex).HasColumnName("indice_actividad").HasColumnType("decimal(6,2)");
            entity.Property(p => p.ActivityIndexNationalRanking).HasColumnName("indice_actividad_ranking_nacional").HasColumnType("decimal(6,2)");
            entity.Property(p => p.Score).HasColumnName("property_score").HasColumnType("decimal(6,2)");
            entity.Property(p => p.CalculatedAt).HasColumnName("fecha_calculo");

            entity.HasIndex(p => new { p.ProvinceCode, p.Period }).IsUnique();
        });
    }
}