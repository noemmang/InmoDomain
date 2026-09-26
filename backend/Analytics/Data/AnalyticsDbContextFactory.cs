using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Analytics.Data;

public class AnalyticsDbContextFactory : IDesignTimeDbContextFactory<AnalyticsDbContext>
{
    public AnalyticsDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets<AnalyticsDbContextFactory>()
            .Build();

        var connectionString = configuration.GetConnectionString("AnalyticsMigrations")
            ?? throw new InvalidOperationException("Falta ConnectionStrings:AnalyticsMigrations en User Secrets.");

        var optionsBuilder = new DbContextOptionsBuilder<AnalyticsDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new AnalyticsDbContext(optionsBuilder.Options);
    }
}