using Microsoft.EntityFrameworkCore;
using Notifications.Models;

namespace Notifications.Data;

public class NotificationsDbContext : DbContext
{
    public NotificationsDbContext(DbContextOptions<NotificationsDbContext> options) : base(options)
    {
    }

    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notificaciones");
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Id).HasColumnName("id");
            entity.Property(n => n.UserId).HasColumnName("usuario_id").IsRequired();
            entity.Property(n => n.Type).HasColumnName("tipo").HasMaxLength(30).IsRequired();
            entity.Property(n => n.Title).HasColumnName("titulo").HasMaxLength(150).IsRequired();
            entity.Property(n => n.Message).HasColumnName("mensaje").HasMaxLength(500).IsRequired();
            entity.Property(n => n.ProvinceCode).HasColumnName("codigo_provincia").HasMaxLength(2);
            entity.Property(n => n.Read).HasColumnName("leida").HasDefaultValue(false);
            entity.Property(n => n.Hidden).HasColumnName("oculta").HasDefaultValue(false);
            entity.Property(n => n.SentAt).HasColumnName("fecha_envio").IsRequired();
            entity.Property(n => n.DeduplicationKey).HasColumnName("clave_deduplicacion").HasMaxLength(100);

            entity.HasIndex(n => new { n.UserId, n.Hidden, n.SentAt });
            entity.HasIndex(n => n.DeduplicationKey).IsUnique();

            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "ck_notificaciones_tipo",
                    "tipo IN ('bienvenida', 'alerta', 'precio_actualizado', 'contrasena_cambiada')");
            });
        });
    }
}