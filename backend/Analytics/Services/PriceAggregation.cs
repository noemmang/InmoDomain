using Analytics.Integrations.MarketData.Dtos;

namespace Analytics.Services;

public static class PriceAggregation
{
    public static decimal AveragePricePerSquareMeter(IEnumerable<AppraisedValueDto> valuesForPeriod)
    {
        return Math.Round(valuesForPeriod.Average(v => v.PricePerSquareMeter), 2);
    }
}