using Microsoft.EntityFrameworkCore;
using Alerts.Models;

namespace Alerts.Data;

public class AlertsDbContext : DbContext
{
    public AlertsDbContext(DbContextOptions<AlertsDbContext> options) : base(options)
    {
    }

    public DbSet<Alert> Alerts => Set<Alert>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Alert>(entity =>
        {
            entity.ToTable("alertas");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).HasColumnName("id");
            entity.Property(a => a.UserId).HasColumnName("usuario_id").IsRequired();
            entity.Property(a => a.ProvinceCode).HasColumnName("codigo_provincia").HasMaxLength(2).IsRequired();
            entity.Property(a => a.Metric).HasColumnName("metrica").HasMaxLength(30).IsRequired();
            entity.Property(a => a.Condition).HasColumnName("condicion").HasMaxLength(20).IsRequired();
            entity.Property(a => a.Threshold).HasColumnName("umbral").HasColumnType("numeric(8,2)");
            entity.Property(a => a.Active).HasColumnName("activa").HasDefaultValue(true);
            entity.Property(a => a.CreatedAt).HasColumnName("fecha_creacion").IsRequired();
            entity.Property(a => a.LastTriggeredAt).HasColumnName("fecha_ultimo_disparo");
            entity.Property(a => a.LastTriggeredPeriod).HasColumnName("periodo_ultimo_disparo").HasColumnType("date");

            entity.HasIndex(a => a.UserId);
            entity.HasIndex(a => new { a.ProvinceCode, a.Active });

            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "ck_alertas_metrica",
                    "metrica IN ('property_score', 'indice_precio', 'indice_tendencia_precio', 'indice_actividad', 'precio_m2')");
                t.HasCheckConstraint("ck_alertas_condicion", "condicion IN ('mayor_que', 'menor_que')");
            });
        });
    }
}