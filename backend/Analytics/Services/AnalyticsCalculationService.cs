using Analytics.Integrations.MarketData;
using Analytics.Models;
using Analytics.Repositories;

namespace Analytics.Services;

public class AnalyticsCalculationService : IAnalyticsCalculationService
{
    private readonly IPropertyScoreRepository _propertyScoreRepository;
    private readonly IMarketDataClient _marketDataClient;

    public AnalyticsCalculationService(IPropertyScoreRepository propertyScoreRepository, IMarketDataClient marketDataClient)
    {
        _propertyScoreRepository = propertyScoreRepository;
        _marketDataClient = marketDataClient;
    }

    public async Task RecalculateActivityAsync(DateOnly period, IReadOnlyCollection<string> provinceCodes)
    {
        var targetQuarter = GetQuarterStart(period);

        var currentTotals = new Dictionary<string, decimal>();
        var historicalSeries = new Dictionary<string, List<decimal>>();

        foreach (var provinceCode in provinceCodes)
        {
            var history = await _marketDataClient.GetPropertySalesAsync(provinceCode, from: null, to: null);

            var totalsByQuarter = history
                .GroupBy(s => GetQuarterStart(s.Period))
                .ToDictionary(g => g.Key, g => (decimal)g.Sum(s => s.OperationsCount));

            if (!totalsByQuarter.TryGetValue(targetQuarter, out var currentTotal))
            {
                continue;
            }

            currentTotals[provinceCode] = currentTotal;
            historicalSeries[provinceCode] = totalsByQuarter.Values.ToList();
        }

        var nationalValues = currentTotals.Values.ToList();

        foreach (var (provinceCode, currentTotal) in currentTotals)
        {
            var historicalPercentile = PercentileCalculator.CalculatePercentileRank(historicalSeries[provinceCode], currentTotal);
            var nationalRanking = PercentileCalculator.CalculatePercentileRank(nationalValues, currentTotal);

            var existing = await _propertyScoreRepository.GetByProvinceAndPeriodAsync(provinceCode, targetQuarter);
            var isNewRow = existing is null;

            var propertyScore = existing ?? new PropertyScore
            {
                Id = Guid.NewGuid(),
                ProvinceCode = provinceCode,
                Period = targetQuarter
            };

            propertyScore.ActivityIndex = historicalPercentile;
            propertyScore.ActivityIndexNationalRanking = nationalRanking;
            propertyScore.Score = isNewRow ? null : CalculateScore(propertyScore);
            propertyScore.CalculatedAt = DateTime.UtcNow;

            await _propertyScoreRepository.UpsertAsync(propertyScore);
        }
    }

    public async Task RecalculatePriceAsync(DateOnly period, IReadOnlyCollection<string> provinceCodes)
    {
        var targetQuarter = GetQuarterStart(period);

        var currentAverages = new Dictionary<string, decimal>();
        var historicalSeries = new Dictionary<string, List<decimal>>();

        foreach (var provinceCode in provinceCodes)
        {
            var history = await _marketDataClient.GetAppraisedValuesAsync(provinceCode, from: null, to: null);

            var averagesByPeriod = history
                .GroupBy(v => v.Period)
                .ToDictionary(g => g.Key, g => PriceAggregation.AveragePricePerSquareMeter(g));

            if (!averagesByPeriod.TryGetValue(targetQuarter, out var currentAverage))
            {
                continue;
            }

            currentAverages[provinceCode] = currentAverage;
            historicalSeries[provinceCode] = averagesByPeriod.Values.ToList();
        }

        var nationalValues = currentAverages.Values.ToList();

        foreach (var (provinceCode, currentAverage) in currentAverages)
        {
            var historicalPercentile = PercentileCalculator.CalculatePercentileRank(historicalSeries[provinceCode], currentAverage);
            var nationalRanking = PercentileCalculator.CalculatePercentileRank(nationalValues, currentAverage);

            var existing = await _propertyScoreRepository.GetByProvinceAndPeriodAsync(provinceCode, targetQuarter);
            var isNewRow = existing is null;

            var propertyScore = existing ?? new PropertyScore
            {
                Id = Guid.NewGuid(),
                ProvinceCode = provinceCode,
                Period = targetQuarter
            };

            var ownHistory = (await _propertyScoreRepository.GetHistoryAsync(provinceCode, from: null, to: targetQuarter)).ToList();

            propertyScore.PriceIndex = historicalPercentile;
            propertyScore.PriceIndexNationalRanking = nationalRanking;
            propertyScore.PriceTrendIndex = CalculateTrend(ownHistory, targetQuarter, quartersBack: 1, historicalPercentile);
            propertyScore.PriceTrendIndexYearOverYear = CalculateTrend(ownHistory, targetQuarter, quartersBack: 4, historicalPercentile);
            propertyScore.Score = isNewRow ? null : CalculateScore(propertyScore);
            propertyScore.CalculatedAt = DateTime.UtcNow;

            await _propertyScoreRepository.UpsertAsync(propertyScore);
        }
    }

    private static decimal? CalculateTrend(
        IReadOnlyCollection<PropertyScore> ownHistory, DateOnly targetQuarter, int quartersBack, decimal currentPriceIndex)
    {
        var pastQuarter = targetQuarter.AddMonths(-3 * quartersBack);
        var pastRow = ownHistory.FirstOrDefault(h => h.Period == pastQuarter);

        return pastRow is null ? null : currentPriceIndex - pastRow.PriceIndex;
    }

    private static DateOnly GetQuarterStart(DateOnly period)
    {
        var quarterStartMonth = ((period.Month - 1) / 3) * 3 + 1;
        return new DateOnly(period.Year, quarterStartMonth, 1);
    }

    private static decimal? CalculateScore(PropertyScore propertyScore)
    {
        if (propertyScore.PriceTrendIndex is null)
        {
            return null;
        }

        return Math.Round(
            (propertyScore.PriceIndex + propertyScore.ActivityIndex + propertyScore.PriceTrendIndex.Value) / 3m,
            2);
    }
}