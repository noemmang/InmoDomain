using Analytics.Common;
using Analytics.Dtos;
using Analytics.Integrations.MarketData;
using Analytics.Repositories;

namespace Analytics.Services;

public class MetricValueService : IMetricValueService
{
    private readonly IPropertyScoreRepository _propertyScoreRepository;
    private readonly IMarketDataClient _marketDataClient;

    public MetricValueService(IPropertyScoreRepository propertyScoreRepository, IMarketDataClient marketDataClient)
    {
        _propertyScoreRepository = propertyScoreRepository;
        _marketDataClient = marketDataClient;
    }

    public async Task<Result<MetricValueDto>> GetAsync(string provinceCode, string metric)
    {
        if (metric == MetricNames.PricePerSquareMeter)
        {
            return await GetPricePerSquareMeterAsync(provinceCode);
        }

        var latest = await _propertyScoreRepository.GetLatestAsync(provinceCode);

        if (latest is null)
        {
            return Result<MetricValueDto>.Failure(ResultError.NotFound);
        }

        var value = metric switch
        {
            MetricNames.PropertyScore => latest.Score,
            MetricNames.PriceIndex => latest.PriceIndex,
            MetricNames.PriceTrendIndex => latest.PriceTrendIndex,
            MetricNames.ActivityIndex => latest.ActivityIndex,
            _ => (decimal?)null
        };

        return Result<MetricValueDto>.Success(new MetricValueDto
        {
            ProvinceCode = provinceCode,
            Metric = metric,
            Period = latest.Period,
            Value = value
        });
    }

    private async Task<Result<MetricValueDto>> GetPricePerSquareMeterAsync(string provinceCode)
    {
        var values = await _marketDataClient.GetAppraisedValuesAsync(provinceCode, from: null, to: null);

        if (values.Count == 0)
        {
            return Result<MetricValueDto>.Failure(ResultError.NotFound);
        }

        var latestPeriod = values.Max(v => v.Period);
        var average = PriceAggregation.AveragePricePerSquareMeter(values.Where(v => v.Period == latestPeriod));

        return Result<MetricValueDto>.Success(new MetricValueDto
        {
            ProvinceCode = provinceCode,
            Metric = MetricNames.PricePerSquareMeter,
            Period = latestPeriod,
            Value = average
        });
    }
}