using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Notifications.Integrations.Property;

public class PropertyClient : IPropertyClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _httpClient;

    public PropertyClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<string?> GetProvinceNameAsync(string provinceCode)
    {
        using var response = await _httpClient.GetAsync($"api/v1/provinces/{Uri.EscapeDataString(provinceCode)}");

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();

        var province = await response.Content.ReadFromJsonAsync<ProvinceDto>(SerializerOptions);
        return province?.Name;
    }
}