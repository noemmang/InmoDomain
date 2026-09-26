using System.Net.Http.Json;
using System.Text.Json;
using Analytics.Integrations.MarketData.Dtos;

namespace Analytics.Integrations.MarketData;

public class MarketDataClient : IMarketDataClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;

    public MarketDataClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IReadOnlyList<PropertySaleDto>> GetPropertySalesAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var url = BuildUrl("api/v1/property-sales", provinceCode, from, to);
        var result = await _httpClient.GetFromJsonAsync<List<PropertySaleDto>>(url, SerializerOptions);
        return result ?? [];
    }

    public async Task<IReadOnlyList<AppraisedValueDto>> GetAppraisedValuesAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var url = BuildUrl("api/v1/appraised-values", provinceCode, from, to);
        var result = await _httpClient.GetFromJsonAsync<List<AppraisedValueDto>>(url, SerializerOptions);
        return result ?? [];
    }

    private static string BuildUrl(string path, string provinceCode, DateOnly? from, DateOnly? to)
    {
        var query = $"provinceCode={Uri.EscapeDataString(provinceCode)}";

        if (from is not null)
        {
            query += $"&from={from:yyyy-MM-dd}";
        }

        if (to is not null)
        {
            query += $"&to={to:yyyy-MM-dd}";
        }

        return $"{path}?{query}";
    }
}