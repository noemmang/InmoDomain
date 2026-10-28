using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Notifications.Data;

public class NotificationsDbContextFactory : IDesignTimeDbContextFactory<NotificationsDbContext>
{
    public NotificationsDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets<NotificationsDbContextFactory>()
            .Build();

        var connectionString = configuration.GetConnectionString("NotificationsMigrations")
            ?? throw new InvalidOperationException("Falta ConnectionStrings:NotificationsMigrations en User Secrets.");

        var optionsBuilder = new DbContextOptionsBuilder<NotificationsDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new NotificationsDbContext(optionsBuilder.Options);
    }
}