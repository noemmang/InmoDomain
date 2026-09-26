using Analytics.Integrations.MarketData.Dtos;

namespace Analytics.Integrations.MarketData;

public interface IMarketDataClient
{
    Task<IReadOnlyList<PropertySaleDto>> GetPropertySalesAsync(string provinceCode, DateOnly? from, DateOnly? to);
    Task<IReadOnlyList<AppraisedValueDto>> GetAppraisedValuesAsync(string provinceCode, DateOnly? from, DateOnly? to);
}