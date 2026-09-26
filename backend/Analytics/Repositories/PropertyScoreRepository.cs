using Microsoft.EntityFrameworkCore;
using Analytics.Data;
using Analytics.Models;

namespace Analytics.Repositories;

public class PropertyScoreRepository : IPropertyScoreRepository
{
    private readonly AnalyticsDbContext _context;

    public PropertyScoreRepository(AnalyticsDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PropertyScore>> GetHistoryAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var query = _context.PropertyScores.AsNoTracking().Where(p => p.ProvinceCode == provinceCode);

        if (from is not null)
        {
            query = query.Where(p => p.Period >= from);
        }

        if (to is not null)
        {
            query = query.Where(p => p.Period <= to);
        }

        return await query.OrderBy(p => p.Period).ToListAsync();
    }

    public async Task<PropertyScore?> GetByProvinceAndPeriodAsync(string provinceCode, DateOnly period)
    {
        return await _context.PropertyScores
            .FirstOrDefaultAsync(p => p.ProvinceCode == provinceCode && p.Period == period);
    }

    public async Task<PropertyScore?> GetLatestAsync(string provinceCode)
    {
        return await _context.PropertyScores.AsNoTracking()
            .Where(p => p.ProvinceCode == provinceCode)
            .OrderByDescending(p => p.Period)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<PropertyScore>> GetByProvincesAndPeriodAsync(IReadOnlyCollection<string> provinceCodes, DateOnly period)
    {
        return await _context.PropertyScores.AsNoTracking()
            .Where(p => provinceCodes.Contains(p.ProvinceCode) && p.Period == period)
            .ToListAsync();
    }

    public async Task UpsertAsync(PropertyScore propertyScore)
    {
        var existing = await _context.PropertyScores
            .FirstOrDefaultAsync(p => p.ProvinceCode == propertyScore.ProvinceCode && p.Period == propertyScore.Period);

        if (existing is null)
        {
            await _context.PropertyScores.AddAsync(propertyScore);
        }
        else
        {
            existing.PriceIndex = propertyScore.PriceIndex;
            existing.PriceIndexNationalRanking = propertyScore.PriceIndexNationalRanking;
            existing.PriceTrendIndex = propertyScore.PriceTrendIndex;
            existing.PriceTrendIndexYearOverYear = propertyScore.PriceTrendIndexYearOverYear;
            existing.ActivityIndex = propertyScore.ActivityIndex;
            existing.ActivityIndexNationalRanking = propertyScore.ActivityIndexNationalRanking;
            existing.Score = propertyScore.Score;
            existing.CalculatedAt = propertyScore.CalculatedAt;
        }

        await _context.SaveChangesAsync();
    }
}