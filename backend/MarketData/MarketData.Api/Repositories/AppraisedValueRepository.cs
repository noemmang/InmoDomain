using Microsoft.EntityFrameworkCore;
using MarketData.Data;
using MarketData.Data.Models;

namespace MarketData.Api.Repositories;

public class AppraisedValueRepository : IAppraisedValueRepository
{
    private readonly MarketDataDbContext _dbContext;

    public AppraisedValueRepository(MarketDataDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<AppraisedValue>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var query = _dbContext.AppraisedValues.AsNoTracking().Where(a => a.ProvinceCode == provinceCode);

        if (from.HasValue)
        {
            query = query.Where(a => a.Period >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(a => a.Period <= to.Value);
        }

        return await query.OrderBy(a => a.Period).ToListAsync();
    }
}