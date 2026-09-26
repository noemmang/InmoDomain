using Analytics.Dtos;
using Analytics.Repositories;

namespace Analytics.Services;

public class CompareService : ICompareService
{
    private readonly IPropertyScoreRepository _propertyScoreRepository;

    public CompareService(IPropertyScoreRepository propertyScoreRepository)
    {
        _propertyScoreRepository = propertyScoreRepository;
    }

    public async Task<IEnumerable<CompareEntryDto>> CompareAsync(IReadOnlyCollection<string> provinceCodes, DateOnly period)
    {
        var rows = await _propertyScoreRepository.GetByProvincesAndPeriodAsync(provinceCodes, period);

        return rows.Select(row => new CompareEntryDto
        {
            ProvinceCode = row.ProvinceCode,
            Period = row.Period,
            PriceIndex = row.PriceIndex,
            PriceIndexNationalRanking = row.PriceIndexNationalRanking,
            PriceTrendIndex = row.PriceTrendIndex,
            PriceTrendIndexYearOverYear = row.PriceTrendIndexYearOverYear,
            ActivityIndex = row.ActivityIndex,
            ActivityIndexNationalRanking = row.ActivityIndexNationalRanking,
            Score = row.Score
        });
    }
}