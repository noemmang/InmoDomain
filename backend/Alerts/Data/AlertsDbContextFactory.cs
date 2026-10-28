using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Alerts.Data;

public class AlertsDbContextFactory : IDesignTimeDbContextFactory<AlertsDbContext>
{
    public AlertsDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets<AlertsDbContextFactory>()
            .Build();

        var connectionString = configuration.GetConnectionString("AlertsMigrations")
            ?? throw new InvalidOperationException("Falta ConnectionStrings:AlertsMigrations en User Secrets.");

        var optionsBuilder = new DbContextOptionsBuilder<AlertsDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new AlertsDbContext(optionsBuilder.Options);
    }
}