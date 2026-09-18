using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace MarketData.Data;

public class MarketDataDbContextFactory : IDesignTimeDbContextFactory<MarketDataDbContext>
{
    public MarketDataDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets<MarketDataDbContextFactory>()
            .Build();

        var connectionString = configuration.GetConnectionString("MarketDataMigrations");

        var optionsBuilder = new DbContextOptionsBuilder<MarketDataDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new MarketDataDbContext(optionsBuilder.Options);
    }
}