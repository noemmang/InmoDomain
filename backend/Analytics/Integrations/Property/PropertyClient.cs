using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace Analytics.Integrations.Property;

public class PropertyClient : IPropertyClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _httpClient;

    public PropertyClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IReadOnlyList<FavoriteDto>> GetFavoritesAsync(string accessToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "api/v1/favorites");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<List<FavoriteDto>>(SerializerOptions) ?? [];
    }
}