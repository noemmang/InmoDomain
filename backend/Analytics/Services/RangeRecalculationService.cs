using Analytics.Integrations.MarketData;
using Analytics.Integrations.Property;
using Analytics.Repositories;

namespace Analytics.Services;

public class RangeRecalculationService : IRangeRecalculationService
{
    private readonly IAnalyticsCalculationService _calculationService;
    private readonly IPropertyClient _propertyClient;

    // El cálculo usa un cliente con memoria: cada serie de Market Data se pide una vez por provincia y no una vez por trimestre.
    public RangeRecalculationService(
        IPropertyScoreRepository propertyScoreRepository, IMarketDataClient marketDataClient, IPropertyClient propertyClient)
    {
        _calculationService = new AnalyticsCalculationService(propertyScoreRepository, new MemoizedMarketDataClient(marketDataClient));
        _propertyClient = propertyClient;
    }

    // Recalcula trimestre a trimestre, de más antiguo a más reciente: la tendencia de precio de cada
    // trimestre necesita ya guardado el índice de precio del anterior. En cada trimestre se calcula el
    // precio antes que la actividad, así el Índice combinado se completa en la segunda pasada.
    public async Task<IReadOnlyList<PeriodRecalculationResult>> RecalculateAsync(
        DateOnly from, DateOnly to, IReadOnlyCollection<string>? provinceCodes)
    {
        var codes = provinceCodes is { Count: > 0 }
            ? provinceCodes
            : await _propertyClient.GetProvinceCodesAsync();

        var results = new List<PeriodRecalculationResult>();
        var quarter = GetQuarterStart(from);
        var lastQuarter = GetQuarterStart(to);

        while (quarter <= lastQuarter)
        {
            var price = await _calculationService.RecalculatePriceAsync(quarter, codes);
            var activity = await _calculationService.RecalculateActivityAsync(quarter, codes);

            results.Add(new PeriodRecalculationResult(quarter, price.ProvinceCodes.Count, activity.ProvinceCodes.Count));
            quarter = quarter.AddMonths(3);
        }

        return results;
    }

    private static DateOnly GetQuarterStart(DateOnly period)
    {
        var quarterStartMonth = ((period.Month - 1) / 3) * 3 + 1;
        return new DateOnly(period.Year, quarterStartMonth, 1);
    }
}