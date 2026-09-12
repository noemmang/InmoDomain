using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Property.Data;

public class PropertyDbContextFactory : IDesignTimeDbContextFactory<PropertyDbContext>
{
    public PropertyDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets<PropertyDbContextFactory>()
            .Build();

        var connectionString = configuration.GetConnectionString("PropertyMigrations")
            ?? throw new InvalidOperationException("Falta ConnectionStrings:PropertyMigrations en User Secrets.");

        var optionsBuilder = new DbContextOptionsBuilder<PropertyDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new PropertyDbContext(optionsBuilder.Options);
    }
}