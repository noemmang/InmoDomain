using Analytics.Integrations.MarketData.Dtos;

namespace Analytics.Integrations.MarketData;

// Guarda en memoria las series de cada provincia mientras dura la operación: el recálculo por rango pide las mismas dos series una vez por trimestre.
public class MemoizedMarketDataClient : IMarketDataClient
{
    private readonly IMarketDataClient _inner;
    private readonly Dictionary<(string, DateOnly?, DateOnly?), IReadOnlyList<PropertySaleDto>> _sales = new();
    private readonly Dictionary<(string, DateOnly?, DateOnly?), IReadOnlyList<AppraisedValueDto>> _values = new();

    public MemoizedMarketDataClient(IMarketDataClient inner)
    {
        _inner = inner;
    }

    public async Task<IReadOnlyList<PropertySaleDto>> GetPropertySalesAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var key = (provinceCode, from, to);
        if (!_sales.TryGetValue(key, out var result))
        {
            result = await _inner.GetPropertySalesAsync(provinceCode, from, to);
            _sales[key] = result;
        }

        return result;
    }

    public async Task<IReadOnlyList<AppraisedValueDto>> GetAppraisedValuesAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var key = (provinceCode, from, to);
        if (!_values.TryGetValue(key, out var result))
        {
            result = await _inner.GetAppraisedValuesAsync(provinceCode, from, to);
            _values[key] = result;
        }

        return result;
    }
}
