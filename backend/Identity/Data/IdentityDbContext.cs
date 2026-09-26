using Microsoft.EntityFrameworkCore;
using Identity.Models;

namespace Identity.Data;

public class IdentityDbContext : DbContext
{
    public IdentityDbContext(DbContextOptions<IdentityDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("usuarios");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).HasColumnName("id");
            entity.Property(u => u.Name).HasColumnName("nombre").IsRequired();
            entity.Property(u => u.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            entity.Property(u => u.PasswordHash).HasColumnName("password_hash");
            entity.Property(u => u.AuthProvider).HasColumnName("proveedor_auth").HasMaxLength(20).IsRequired();
            entity.Property(u => u.RegisteredAt).HasColumnName("fecha_registro").IsRequired();
            entity.Property(u => u.LastAccessAt).HasColumnName("fecha_ultimo_acceso").IsRequired();
            entity.Property(u => u.RecoveryTokenHash).HasColumnName("token_recuperacion").HasMaxLength(64);
            entity.Property(u => u.RecoveryTokenExpiresAt).HasColumnName("token_recuperacion_expira");

            entity.HasIndex(u => u.Email).IsUnique();

            entity.ToTable(t => t.HasCheckConstraint("ck_usuarios_proveedor_auth", "proveedor_auth IN ('local')"));
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Id).HasColumnName("id");
            entity.Property(r => r.UserId).HasColumnName("usuario_id").IsRequired();
            entity.Property(r => r.TokenHash).HasColumnName("token_hash").HasMaxLength(64).IsRequired();
            entity.Property(r => r.CreatedAt).HasColumnName("fecha_creacion").IsRequired();
            entity.Property(r => r.ExpiresAt).HasColumnName("fecha_expiracion").IsRequired();
            entity.Property(r => r.RevokedAt).HasColumnName("fecha_revocado");

            entity.HasIndex(r => r.TokenHash).IsUnique();
            entity.HasIndex(r => r.UserId);

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}