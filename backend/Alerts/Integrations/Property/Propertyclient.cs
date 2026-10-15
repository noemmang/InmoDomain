using System.Net;

namespace Alerts.Integrations.Property;

public class PropertyClient : IPropertyClient
{
    private readonly HttpClient _httpClient;

    public PropertyClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<bool> ProvinceExistsAsync(string provinceCode)
    {
        using var response = await _httpClient.GetAsync($"api/v1/provinces/{Uri.EscapeDataString(provinceCode)}");

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }

        response.EnsureSuccessStatusCode();
        return true;
    }
}