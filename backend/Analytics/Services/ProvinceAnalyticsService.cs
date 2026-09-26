using Analytics.Dtos;
using Analytics.Integrations.MarketData;
using Analytics.Models;
using Analytics.Repositories;

namespace Analytics.Services;

public class ProvinceAnalyticsService : IProvinceAnalyticsService
{
    private readonly IPropertyScoreRepository _propertyScoreRepository;
    private readonly IMarketDataClient _marketDataClient;

    public ProvinceAnalyticsService(IPropertyScoreRepository propertyScoreRepository, IMarketDataClient marketDataClient)
    {
        _propertyScoreRepository = propertyScoreRepository;
        _marketDataClient = marketDataClient;
    }

    public async Task<ProvinceAnalyticsDto> GetAsync(string provinceCode, DateOnly? from, DateOnly? to, int? trendQuarters, Guid? userId)
    {
        var history = await _propertyScoreRepository.GetHistoryAsync(provinceCode, from, to);
        var sales = await _marketDataClient.GetPropertySalesAsync(provinceCode, from, to);
        var appraisedValues = await _marketDataClient.GetAppraisedValuesAsync(provinceCode, from, to);

        var dto = new ProvinceAnalyticsDto
        {
            ProvinceCode = provinceCode,
            History = history.Select(MapToPeriodDto).ToList(),
            PropertySales = sales.Select(s => new PropertySaleRawDto
            {
                Period = s.Period,
                HousingStatus = s.HousingStatus,
                OperationsCount = s.OperationsCount
            }).ToList(),
            AppraisedValues = appraisedValues.Select(a => new AppraisedValueRawDto
            {
                Period = a.Period,
                Age = a.Age,
                PricePerSquareMeter = a.PricePerSquareMeter
            }).ToList(),
            IsFavorite = null
        };

        if (userId is not null)
        {
            // Pendiente de Fase 8: llamada síncrona a Property (GET /api/v1/favorites)
            // con el JWT reenviado, para resolver esFavorita. Hoy userId siempre
            // llega null porque todavía no hay middleware de autenticación JWT.
        }

        if (trendQuarters is > 0)
        {
            dto.CustomTrend = await CalculateCustomTrendAsync(provinceCode, to, trendQuarters.Value, history);
        }

        return dto;
    }

    private async Task<CustomTrendDto> CalculateCustomTrendAsync(
        string provinceCode, DateOnly? to, int trendQuarters, IEnumerable<PropertyScore> historyInRange)
    {
        var latestPeriod = to ?? historyInRange.Select(h => h.Period).DefaultIfEmpty().Max();

        var currentRow = historyInRange.FirstOrDefault(h => h.Period == latestPeriod)
            ?? await _propertyScoreRepository.GetByProvinceAndPeriodAsync(provinceCode, latestPeriod);

        if (currentRow is null)
        {
            return new CustomTrendDto { TrendQuarters = trendQuarters, HasSufficientData = false };
        }

        var targetPeriod = latestPeriod.AddMonths(-3 * trendQuarters);

        var pastRow = historyInRange.FirstOrDefault(h => h.Period == targetPeriod)
            ?? await _propertyScoreRepository.GetByProvinceAndPeriodAsync(provinceCode, targetPeriod);

        if (pastRow is null)
        {
            return new CustomTrendDto { TrendQuarters = trendQuarters, HasSufficientData = false };
        }

        var variation = currentRow.PriceIndex - pastRow.PriceIndex;

        return new CustomTrendDto { TrendQuarters = trendQuarters, HasSufficientData = true, Value = variation };
    }

    private static PropertyScorePeriodDto MapToPeriodDto(PropertyScore propertyScore)
    {
        return new PropertyScorePeriodDto
        {
            Period = propertyScore.Period,
            PriceIndex = propertyScore.PriceIndex,
            PriceIndexNationalRanking = propertyScore.PriceIndexNationalRanking,
            PriceTrendIndex = propertyScore.PriceTrendIndex,
            PriceTrendIndexYearOverYear = propertyScore.PriceTrendIndexYearOverYear,
            ActivityIndex = propertyScore.ActivityIndex,
            ActivityIndexNationalRanking = propertyScore.ActivityIndexNationalRanking,
            Score = propertyScore.Score
        };
    }
}