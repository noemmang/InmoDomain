using Microsoft.EntityFrameworkCore;
using MarketData.Data;
using MarketData.Data.Models;

namespace MarketData.Api.Repositories;

public class HousingSaleRepository : IHousingSaleRepository
{
    private readonly MarketDataDbContext _dbContext;

    public HousingSaleRepository(MarketDataDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<HousingSale>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var query = _dbContext.HousingSales.AsNoTracking().Where(h => h.ProvinceCode == provinceCode);

        if (from.HasValue)
        {
            query = query.Where(h => h.Period >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(h => h.Period <= to.Value);
        }

        return await query.OrderBy(h => h.Period).ToListAsync();
    }
}