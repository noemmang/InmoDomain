using Microsoft.EntityFrameworkCore;
using MarketData.Data;
using MarketData.Data.Models;

namespace MarketData.Api.Repositories;

public class ConstructionRepository : IConstructionRepository
{
    private readonly MarketDataDbContext _dbContext;

    public ConstructionRepository(MarketDataDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ConstructionActivity>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var query = _dbContext.ConstructionActivities.AsNoTracking().Where(c => c.ProvinceCode == provinceCode);

        if (from.HasValue)
        {
            query = query.Where(c => c.Period >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(c => c.Period <= to.Value);
        }

        return await query.OrderBy(c => c.Period).ThenBy(c => c.Phase).ThenBy(c => c.Regime).ToListAsync();
    }
}
