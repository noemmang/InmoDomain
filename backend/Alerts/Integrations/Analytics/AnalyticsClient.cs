using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Alerts.Integrations.Analytics;

public class AnalyticsClient : IAnalyticsClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _httpClient;

    public AnalyticsClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<MetricValueDto?> GetMetricValueAsync(string provinceCode, string metric)
    {
        var url = $"internal/v1/metric-value?provinceCode={Uri.EscapeDataString(provinceCode)}&metric={Uri.EscapeDataString(metric)}";

        using var response = await _httpClient.GetAsync(url);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<MetricValueDto>(SerializerOptions);
    }
}